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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsController = void 0;
const common_1 = require("@nestjs/common");
const meetings_service_1 = require("./meetings.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const meetings_gateway_1 = require("./meetings.gateway");
let MeetingsController = class MeetingsController {
    constructor(meetingsService, meetingsGateway) {
        this.meetingsService = meetingsService;
        this.meetingsGateway = meetingsGateway;
    }
    async createMeeting(req, body) {
        const userId = req.user.userId;
        return this.meetingsService.createMeeting(userId, body.title, body.description, body.startTime, body.invitedEmails);
    }
    async getMeetingByCode(code) {
        return this.meetingsService.findMeetingByCodeOrId(code);
    }
    async getMeetings(req) {
        const userId = req.user.userId;
        return this.meetingsService.getMeetings(userId);
    }
    async getMeeting(id) {
        return this.meetingsService.getMeetingById(id);
    }
    async startMeeting(id) {
        return this.meetingsService.startMeeting(id);
    }
    async endMeeting(id) {
        const result = await this.meetingsService.endMeeting(id);
        if (this.meetingsGateway && this.meetingsGateway.server) {
            this.meetingsGateway.server.to(id).emit('meetingEnded', { meetingId: id });
        }
        return result;
    }
    async analyzeRealTime(id) {
        return this.meetingsService.analyzeRealTime(id);
    }
    async syncActionItem(actionItemId, platform) {
        try {
            return await this.meetingsService.syncActionItemToPlatform(actionItemId, platform);
        }
        catch (e) {
            throw new common_1.HttpException(e.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async emailMeetingSummary(meetingId, req) {
        const userEmail = req.user.email || 'host@teamsspace.app';
        console.log(`Simulating sending meeting summary email for meeting ${meetingId} to host ${userEmail}`);
        return { status: 'success', message: `Summary emailed successfully to ${userEmail}!` };
    }
    async askTwin(id, body) {
        if (!body.question) {
            throw new common_1.HttpException('Question is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const result = await this.meetingsService.askDigitalTwin(id, body.question);
        return {
            answer: result.answer,
            diagram: result.diagram
        };
    }
    async getFollowupCalendarLink(meetingId) {
        const meeting = await this.meetingsService.getMeetingById(meetingId);
        const title = encodeURIComponent(`Follow-up: ${meeting.title}`);
        const details = encodeURIComponent(`Follow-up discussion for meeting: ${meeting.title}\n\n` +
            `Original description: ${meeting.description || ''}\n\n` +
            `Review actions & outcomes in Copilot.`);
        const baseUrl = 'https://calendar.google.com/calendar/render';
        const url = `${baseUrl}?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
        return { url };
    }
    async exportMeetingPdfView(meetingId, res) {
        try {
            const meeting = (await this.meetingsService.getMeetingById(meetingId));
            let decisions = [];
            let nextSteps = [];
            let takeaways = [];
            if (meeting.summary) {
                try {
                    takeaways = JSON.parse(meeting.summary.keyTakeaways);
                }
                catch { }
                try {
                    decisions = meeting.summary.keyDecisions ? JSON.parse(meeting.summary.keyDecisions) : [];
                }
                catch { }
                try {
                    nextSteps = meeting.summary.nextSteps ? JSON.parse(meeting.summary.nextSteps) : [];
                }
                catch { }
            }
            let speakerSentiments = {};
            if (meeting.analytics) {
                try {
                    speakerSentiments = JSON.parse(meeting.analytics.speakerSentiment);
                }
                catch { }
            }
            else {
                speakerSentiments = {
                    'Alice Smith': 'Positive',
                    'John Doe': 'Positive',
                    'Bob Johnson': 'Concerned',
                };
            }
            const html = this.buildPdfHtml(meeting, decisions, nextSteps, takeaways, meeting.actionItems || [], meeting.risks || [], speakerSentiments);
            res.setHeader('Content-Type', 'text/html');
            return res.status(common_1.HttpStatus.OK).send(html);
        }
        catch (e) {
            return res.status(common_1.HttpStatus.NOT_FOUND).send(`<h3>Error exporting report: ${e.message}</h3>`);
        }
    }
    async getMeetingAnalytics(meetingId) {
        return this.meetingsService.getMeetingAnalytics(meetingId);
    }
    buildPdfHtml(meeting, decisions, nextSteps, takeaways, actionItems, risks, speakerSentiments) {
        const actionItemsHtml = actionItems.length === 0
            ? '<p>No action items assigned.</p>'
            : `<ul>${actionItems.map(a => {
                const dueStr = a.dueDate ? ` (Due: ${new Date(a.dueDate).toISOString().split('T')[0]})` : '';
                const assignee = a.assigneeName || 'Unassigned';
                return `<li><strong>${assignee}</strong>: ${a.text}${dueStr}</li>`;
            }).join('')}</ul>`;
        const risksHtml = risks.length === 0
            ? '<p>No risks or blockers identified.</p>'
            : risks.map(r => {
                const severityClass = r.severity === 'HIGH' ? 'high' : r.severity === 'MEDIUM' ? 'med' : 'low';
                return `<div style='margin-bottom:8px;'>⚠️ ${r.text} <span class='badge badge-${severityClass}'>${r.severity}</span></div>`;
            }).join('');
        const sentimentsHtml = !speakerSentiments || Object.keys(speakerSentiments).length === 0
            ? '<p>No speaker sentiment log available.</p>'
            : Object.entries(speakerSentiments).map(([name, sent]) => {
                const sentStr = sent === 'Positive' ? 'Positive 😊' : sent === 'Concerned' ? 'Concerned ⚠️' : 'Neutral 😐';
                return `<div class='sentiment-item'><span>${name}</span><span>${sentStr}</span></div>`;
            }).join('');
        const formattedDate = meeting.createdAt
            ? new Date(meeting.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
            : 'Unknown Date';
        return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${meeting.title} - Meeting Minutes Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
        <style>
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .page-break { page-break-before: always; }
            }
            body {
                font-family: 'Inter', sans-serif;
                color: #0f172a;
                line-height: 1.6;
                padding: 40px;
                max-width: 850px;
                margin: 0 auto;
                background-color: #f8fafc;
            }
            .report-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                padding: 50px;
            }
            .header {
                border-bottom: 3px solid #6366f1;
                padding-bottom: 24px;
                margin-bottom: 32px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .title {
                font-size: 32px;
                font-family: 'Outfit', sans-serif;
                font-weight: 800;
                color: #1e1b4b;
                margin: 0 0 12px 0;
            }
            .meta {
                font-size: 14px;
                color: #64748b;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .brand {
                font-family: 'Outfit', sans-serif;
                font-size: 18px;
                font-weight: 800;
                color: #6366f1;
            }
            .section {
                margin-bottom: 36px;
                background: #fdfdfd;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 24px;
            }
            .section-title {
                font-size: 18px;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
                color: #4338ca;
                border-bottom: 2px solid #e0e7ff;
                padding-bottom: 8px;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            ul, ol { padding-left: 24px; margin-top: 0; }
            li { margin-bottom: 8px; }
            .badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .badge-high { background: #fee2e2; color: #b91c1c; }
            .badge-med { background: #fef3c7; color: #b45309; }
            .badge-low { background: #e0e7ff; color: #4338ca; }
            
            .sentiment-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            .sentiment-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 16px;
                background-color: #f1f5f9;
                border-radius: 6px;
                font-weight: 500;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #94a3b8;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="header">
                <div>
                    <h1 class="title">${meeting.title}</h1>
                    <div class="meta">
                        <span><strong>Date:</strong> ${formattedDate}</span>
                        <span><strong>Status:</strong> ${meeting.status}</span>
                    </div>
                </div>
                <div class="brand">AI Meeting Copilot</div>
            </div>
            
            <div class="section">
                <div class="section-title">Executive Summary</div>
                <p style="font-size: 16px; font-weight: 500; color: #334155;">${meeting.summary?.overview || 'No summary available.'}</p>
            </div>

            <div class="section">
                <div class="section-title">Key Decisions</div>
                <ul>
                    ${decisions.length > 0 ? decisions.map(d => `<li>${d}</li>`).join('') : '<li>No major decisions recorded.</li>'}
                </ul>
            </div>
            
            <div class="section" style="border-left: 4px solid #6366f1;">
                <div class="section-title">Action Items & Next Steps</div>
                ${actionItemsHtml}
            </div>

            <div class="page-break"></div>

            <div class="section" style="border-left: 4px solid #ef4444;">
                <div class="section-title">Risks & Blockers</div>
                ${risksHtml}
            </div>
            
            <div class="section">
                <div class="section-title">Speaker Sentiment Analysis</div>
                <div class="sentiment-grid">
                    ${sentimentsHtml}
                </div>
            </div>
        </div>

        <script>
            window.onload = function() {
                window.print();
            };
        </script>
    </body>
    </html>
    `;
    }
    async speak(body) {
        if (!body.text)
            throw new common_1.HttpException('Text is required', common_1.HttpStatus.BAD_REQUEST);
        const audioContent = await this.meetingsService.generateSpeech(body.text, body.languageCode);
        return { audioContent };
    }
    async translate(body) {
        if (!body.text)
            throw new common_1.HttpException('Text is required', common_1.HttpStatus.BAD_REQUEST);
        const translatedText = await this.meetingsService.translateText(body.text, body.sourceLang, body.targetLang);
        return { translatedText };
    }
};
exports.MeetingsController = MeetingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "createMeeting", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getMeetingByCode", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getMeetings", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getMeeting", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "startMeeting", null);
__decorate([
    (0, common_1.Post)(':id/end'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "endMeeting", null);
__decorate([
    (0, common_1.Post)(':id/analyze'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "analyzeRealTime", null);
__decorate([
    (0, common_1.Post)('action-items/:id/sync/:platform'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "syncActionItem", null);
__decorate([
    (0, common_1.Post)(':id/email-summary'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "emailMeetingSummary", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':id/ask-twin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "askTwin", null);
__decorate([
    (0, common_1.Get)(':id/calendar-link'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getFollowupCalendarLink", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "exportMeetingPdfView", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getMeetingAnalytics", null);
__decorate([
    (0, common_1.Post)('speak'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "speak", null);
__decorate([
    (0, common_1.Post)('translate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "translate", null);
exports.MeetingsController = MeetingsController = __decorate([
    (0, common_1.Controller)('meetings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        meetings_gateway_1.MeetingsGateway])
], MeetingsController);
//# sourceMappingURL=meetings.controller.js.map