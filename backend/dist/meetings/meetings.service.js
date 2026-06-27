"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const ai_service_1 = require("../ai/ai.service");
const client_1 = require("@prisma/client");
const integrations_service_1 = require("../integrations/integrations.service");
let MeetingsService = class MeetingsService {
    constructor(prisma, aiService, integrationsService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.integrationsService = integrationsService;
    }
    async createMeeting(hostId, title, description, startTime, invitedEmails) {
        const code = await this.generateUniqueMeetingCode();
        return this.prisma.meeting.create({
            data: {
                title,
                description,
                status: client_1.MeetingStatus.SCHEDULED,
                hostId,
                startTime: startTime ? new Date(startTime) : new Date(),
                invitedEmails: invitedEmails || null,
                code,
            },
        });
    }
    async generateUniqueMeetingCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let isUnique = false;
        let code = '';
        while (!isUnique) {
            let randomPart = '';
            for (let i = 0; i < 6; i++) {
                randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            code = `TM-${randomPart}`;
            const existing = await this.prisma.meeting.findUnique({
                where: { code },
            });
            if (!existing) {
                isUnique = true;
            }
        }
        return code;
    }
    async findMeetingByCodeOrId(identifier) {
        let meeting = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
        if (isUuid) {
            meeting = await this.prisma.meeting.findUnique({
                where: { id: identifier },
                include: {
                    transcripts: { orderBy: { timestamp: 'asc' } },
                    actionItems: true,
                    risks: true,
                    summary: true,
                    analytics: true,
                    host: { select: { id: true, name: true, email: true } },
                },
            });
        }
        if (!meeting) {
            meeting = await this.prisma.meeting.findUnique({
                where: { code: identifier },
                include: {
                    transcripts: { orderBy: { timestamp: 'asc' } },
                    actionItems: true,
                    risks: true,
                    summary: true,
                    analytics: true,
                    host: { select: { id: true, name: true, email: true } },
                },
            });
        }
        if (!meeting) {
            throw new common_1.NotFoundException('Meeting not found');
        }
        return meeting;
    }
    async getMeetings(userId) {
        return this.prisma.meeting.findMany({
            where: { hostId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                summary: true,
                _count: {
                    select: {
                        transcripts: true,
                        actionItems: true,
                        risks: true,
                    },
                },
            },
        });
    }
    async getMeetingById(meetingId) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: {
                transcripts: { orderBy: { timestamp: 'asc' } },
                actionItems: true,
                risks: true,
                summary: true,
                analytics: true,
                host: { select: { id: true, name: true, email: true } },
            },
        });
        if (!meeting) {
            throw new common_1.NotFoundException('Meeting not found');
        }
        return meeting;
    }
    async startMeeting(meetingId) {
        return this.prisma.meeting.update({
            where: { id: meetingId },
            data: {
                status: client_1.MeetingStatus.ACTIVE,
                startTime: new Date(),
            },
        });
    }
    async addTranscriptSegment(meetingId, speakerName, text, translation) {
        return this.prisma.transcript.create({
            data: {
                meetingId,
                speakerName,
                text,
                translation: translation || null,
            },
        });
    }
    async endMeeting(meetingId) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { transcripts: { orderBy: { timestamp: 'asc' } } },
        });
        if (!meeting) {
            throw new common_1.NotFoundException('Meeting not found');
        }
        const transcriptLines = meeting.transcripts.map(t => `${t.speakerName}: ${t.text}`);
        const [aiSummary, aiActionItems, aiRisks, aiAnalytics] = await Promise.all([
            this.aiService.summarizeMeeting(transcriptLines),
            this.aiService.extractActionItems(transcriptLines),
            this.aiService.detectRisks(transcriptLines),
            this.aiService.analyzeMeetingAnalytics(transcriptLines),
        ]);
        await this.prisma.summary.upsert({
            where: { meetingId },
            update: {
                overview: aiSummary.overview,
                keyTakeaways: JSON.stringify(aiSummary.keyTakeaways),
                keyDecisions: JSON.stringify(aiSummary.keyDecisions || []),
                nextSteps: JSON.stringify(aiSummary.nextSteps || []),
                productivityScore: aiSummary.productivityScore,
            },
            create: {
                meetingId,
                overview: aiSummary.overview,
                keyTakeaways: JSON.stringify(aiSummary.keyTakeaways),
                keyDecisions: JSON.stringify(aiSummary.keyDecisions || []),
                nextSteps: JSON.stringify(aiSummary.nextSteps || []),
                productivityScore: aiSummary.productivityScore,
            },
        });
        if (aiAnalytics) {
            await this.prisma.analytics.upsert({
                where: { meetingId },
                update: {
                    duration: aiAnalytics.duration,
                    totalWords: aiAnalytics.totalWords,
                    talkTimeDistribution: JSON.stringify(aiAnalytics.talkTimeDistribution),
                    sentimentScore: aiAnalytics.sentimentScore,
                    engagementScore: aiAnalytics.engagementScore,
                    speakerSentiment: JSON.stringify(aiAnalytics.speakerSentiment),
                },
                create: {
                    meetingId,
                    duration: aiAnalytics.duration,
                    totalWords: aiAnalytics.totalWords,
                    talkTimeDistribution: JSON.stringify(aiAnalytics.talkTimeDistribution),
                    sentimentScore: aiAnalytics.sentimentScore,
                    engagementScore: aiAnalytics.engagementScore,
                    speakerSentiment: JSON.stringify(aiAnalytics.speakerSentiment),
                },
            });
        }
        await this.prisma.actionItem.deleteMany({ where: { meetingId } });
        if (aiActionItems.length > 0) {
            for (const item of aiActionItems) {
                let externalId = null;
                let externalUrl = null;
                let externalPlatform = null;
                try {
                    const clickupRes = await this.integrationsService.createClickUpTask(`Action Item: ${item.text.substring(0, 50)}...`, `Extracted from Meeting ${meetingId}.\nAssignee: ${item.assigneeName || 'Unassigned'}\nDue Date: ${item.dueDate || 'No due date'}\nFull Text: ${item.text}`);
                    if (clickupRes && clickupRes.id) {
                        externalId = clickupRes.id;
                        externalUrl = clickupRes.url || `https://app.clickup.com/t/${clickupRes.id}`;
                        externalPlatform = 'clickup';
                    }
                }
                catch (err) {
                    console.error(`Failed to automatically sync action item to ClickUp: ${err.message}`);
                }
                await this.prisma.actionItem.create({
                    data: {
                        meetingId,
                        text: item.text,
                        assigneeName: item.assigneeName || null,
                        dueDate: item.dueDate ? new Date(item.dueDate) : null,
                        status: 'PENDING',
                        externalId,
                        externalUrl,
                        externalPlatform,
                    },
                });
            }
        }
        await this.prisma.risk.deleteMany({ where: { meetingId } });
        if (aiRisks.length > 0) {
            await this.prisma.risk.createMany({
                data: aiRisks.map(risk => ({
                    meetingId,
                    text: risk.text,
                    severity: risk.severity,
                    status: 'OPEN',
                })),
            });
        }
        try {
            const summaryMsg = `📹 Meeting Completed: *${meeting.title}*\n` +
                `• Overview: ${aiSummary.overview}\n` +
                `• Productivity Score: ${aiSummary.productivityScore}/100\n` +
                `• Action Items Extracted: ${aiActionItems.length}\n` +
                `• Risks Identified: ${aiRisks.length}`;
            await this.integrationsService.sendSlackNotification(summaryMsg);
        }
        catch (err) {
            console.error(`Failed to send Slack end-meeting notification: ${err.message}`);
        }
        return this.prisma.meeting.update({
            where: { id: meetingId },
            data: {
                status: client_1.MeetingStatus.COMPLETED,
                endTime: new Date(),
            },
            include: {
                summary: true,
                actionItems: true,
                risks: true,
                analytics: true,
            },
        });
    }
    async analyzeRealTime(meetingId) {
        const transcripts = await this.prisma.transcript.findMany({
            where: { meetingId },
            orderBy: { timestamp: 'asc' },
        });
        if (transcripts.length === 0)
            return null;
        const transcriptLines = transcripts.map(t => `${t.speakerName}: ${t.text}`);
        const [aiActionItems, aiRisks] = await Promise.all([
            this.aiService.extractActionItems(transcriptLines),
            this.aiService.detectRisks(transcriptLines),
        ]);
        await this.prisma.actionItem.deleteMany({ where: { meetingId } });
        if (aiActionItems.length > 0) {
            await this.prisma.actionItem.createMany({
                data: aiActionItems.map(item => ({
                    meetingId,
                    text: item.text,
                    assigneeName: item.assigneeName || null,
                    dueDate: item.dueDate ? new Date(item.dueDate) : null,
                    status: 'PENDING',
                })),
            });
        }
        await this.prisma.risk.deleteMany({ where: { meetingId } });
        if (aiRisks.length > 0) {
            await this.prisma.risk.createMany({
                data: aiRisks.map(risk => ({
                    meetingId,
                    text: risk.text,
                    severity: risk.severity,
                    status: 'OPEN',
                })),
            });
        }
        return {
            actionItems: await this.prisma.actionItem.findMany({ where: { meetingId } }),
            risks: await this.prisma.risk.findMany({ where: { meetingId } }),
        };
    }
    async createChannelMessage(channelId, senderId, senderName, text) {
        return this.prisma.channelMessage.create({
            data: {
                channelId,
                senderId,
                senderName,
                text,
            },
        });
    }
    async createDirectMessage(senderId, receiverId, text) {
        return this.prisma.directMessage.create({
            data: {
                senderId,
                receiverId,
                text,
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async syncActionItemToPlatform(actionItemId, platform) {
        const actionItem = await this.prisma.actionItem.findUnique({
            where: { id: actionItemId },
            include: { meeting: true },
        });
        if (!actionItem) {
            throw new common_1.NotFoundException('Action item not found');
        }
        const meetingTitle = actionItem.meeting?.title || 'AI Meeting';
        const taskNotes = `Meeting: ${meetingTitle}\n` +
            `Assignee: ${actionItem.assigneeName || 'Unassigned'}\n` +
            `Due Date: ${actionItem.dueDate ? actionItem.dueDate.toISOString().split('T')[0] : 'None'}\n` +
            `Synced from AI Meeting Copilot`;
        let res;
        if (platform === 'clickup') {
            res = await this.integrationsService.createClickUpTask(actionItem.text, taskNotes);
        }
        else if (platform === 'trello') {
            res = await this.integrationsService.createTrelloCard(actionItem.text, taskNotes);
        }
        if (res && res.status === 'error') {
            throw new Error(res.message || `Failed to sync to ${platform}`);
        }
        return this.prisma.actionItem.update({
            where: { id: actionItemId },
            data: {
                externalId: res.id,
                externalUrl: res.url || (platform === 'clickup' ? `https://app.clickup.com/t/${res.id}` : null),
                externalPlatform: platform,
            },
        });
    }
    async getMeetingAnalytics(meetingId) {
        const analytics = await this.prisma.analytics.findUnique({
            where: { meetingId },
        });
        if (!analytics) {
            return {
                meetingId,
                duration: 0,
                totalWords: 0,
                talkTimeDistribution: {},
                sentimentScore: 0.0,
                engagementScore: 100,
                speakerSentiment: {},
            };
        }
        return {
            meetingId: analytics.meetingId,
            duration: analytics.duration,
            totalWords: analytics.totalWords,
            talkTimeDistribution: JSON.parse(analytics.talkTimeDistribution),
            sentimentScore: analytics.sentimentScore,
            engagementScore: analytics.engagementScore,
            speakerSentiment: JSON.parse(analytics.speakerSentiment),
            createdAt: analytics.createdAt,
        };
    }
    async getTeamAnalytics(teamId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: { members: true },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        const memberIds = team.members.map(m => m.id);
        const meetings = await this.prisma.meeting.findMany({
            where: { hostId: { in: memberIds } },
            select: { id: true },
        });
        const meetingIds = meetings.map(m => m.id);
        const analyticsList = await this.prisma.analytics.findMany({
            where: { meetingId: { in: meetingIds } },
        });
        if (analyticsList.length === 0) {
            return {
                teamId,
                averageDuration: 0,
                averageSentiment: 0.0,
                averageEngagement: 100,
                totalMeetingsAnalyzed: 0,
            };
        }
        const totalDuration = analyticsList.reduce((acc, curr) => acc + curr.duration, 0);
        const totalSentiment = analyticsList.reduce((acc, curr) => acc + curr.sentimentScore, 0);
        const totalEngagement = analyticsList.reduce((acc, curr) => acc + curr.engagementScore, 0);
        const count = analyticsList.length;
        return {
            teamId,
            averageDuration: Math.round(totalDuration / count),
            averageSentiment: Number((totalSentiment / count).toFixed(2)),
            averageEngagement: Math.round(totalEngagement / count),
            totalMeetingsAnalyzed: count,
        };
    }
    async generateSpeech(text, languageCode) {
        return this.aiService.generateSpeech(text, languageCode);
    }
    async translateText(text, sourceLang, targetLang) {
        return this.aiService.translateText(text, sourceLang, targetLang);
    }
    async answerMeetingQuestion(meetingId, question, askerName) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { transcripts: { orderBy: { timestamp: 'asc' } } },
        });
        if (!meeting) {
            throw new Error('Meeting not found');
        }
        const transcriptLines = meeting.transcripts.map(t => `${t.speakerName}: ${t.text}`);
        const aiResult = await this.aiService.answerQuestion(meeting.title, transcriptLines, question);
        const segment = await this.prisma.transcript.create({
            data: {
                meetingId,
                speakerName: 'AI Copilot',
                text: aiResult.answer,
            },
        });
        return {
            segment,
            diagram: aiResult.diagram
        };
    }
    async askDigitalTwin(meetingId, question) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { transcripts: { orderBy: { timestamp: 'asc' } } },
        });
        if (!meeting) {
            throw new common_1.NotFoundException('Meeting not found');
        }
        const transcriptLines = meeting.transcripts.map(t => `${t.speakerName}: ${t.text}`);
        return this.aiService.answerQuestion(meeting.title, transcriptLines, question);
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        integrations_service_1.IntegrationsService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map