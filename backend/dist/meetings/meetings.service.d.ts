import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
export declare class MeetingsService {
    private prisma;
    private aiService;
    private integrationsService;
    constructor(prisma: PrismaService, aiService: AiService, integrationsService: IntegrationsService);
    createMeeting(hostId: string, title: string, description?: string, startTime?: string | Date, invitedEmails?: string): Promise<{
        id: string;
        code: string | null;
        title: string;
        description: string | null;
        invitedEmails: string | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        startTime: Date;
        endTime: Date | null;
        createdAt: Date;
        updatedAt: Date;
        hostId: string;
        channelId: string | null;
    }>;
    private generateUniqueMeetingCode;
    findMeetingByCodeOrId(identifier: string): Promise<any>;
    getMeetings(userId: string): Promise<({
        summary: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            meetingId: string;
            overview: string;
            keyTakeaways: string;
            keyDecisions: string | null;
            nextSteps: string | null;
            productivityScore: number;
        } | null;
        _count: {
            transcripts: number;
            actionItems: number;
            risks: number;
        };
    } & {
        id: string;
        code: string | null;
        title: string;
        description: string | null;
        invitedEmails: string | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        startTime: Date;
        endTime: Date | null;
        createdAt: Date;
        updatedAt: Date;
        hostId: string;
        channelId: string | null;
    })[]>;
    getMeetingById(meetingId: string): Promise<{
        host: {
            id: string;
            name: string;
            email: string;
        };
        transcripts: {
            id: string;
            createdAt: Date;
            meetingId: string;
            timestamp: Date;
            speakerName: string;
            speakerId: string | null;
            text: string;
            translation: string | null;
        }[];
        actionItems: {
            id: string;
            status: import(".prisma/client").$Enums.ActionItemStatus;
            createdAt: Date;
            updatedAt: Date;
            meetingId: string;
            text: string;
            assigneeId: string | null;
            assigneeName: string | null;
            dueDate: Date | null;
            externalId: string | null;
            externalUrl: string | null;
            externalPlatform: string | null;
        }[];
        risks: {
            id: string;
            status: import(".prisma/client").$Enums.RiskStatus;
            createdAt: Date;
            meetingId: string;
            text: string;
            severity: import(".prisma/client").$Enums.RiskSeverity;
        }[];
        summary: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            meetingId: string;
            overview: string;
            keyTakeaways: string;
            keyDecisions: string | null;
            nextSteps: string | null;
            productivityScore: number;
        } | null;
        analytics: {
            id: string;
            createdAt: Date;
            meetingId: string;
            duration: number;
            totalWords: number;
            talkTimeDistribution: string;
            sentimentScore: number;
            engagementScore: number;
            speakerSentiment: string;
        } | null;
    } & {
        id: string;
        code: string | null;
        title: string;
        description: string | null;
        invitedEmails: string | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        startTime: Date;
        endTime: Date | null;
        createdAt: Date;
        updatedAt: Date;
        hostId: string;
        channelId: string | null;
    }>;
    startMeeting(meetingId: string): Promise<{
        id: string;
        code: string | null;
        title: string;
        description: string | null;
        invitedEmails: string | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        startTime: Date;
        endTime: Date | null;
        createdAt: Date;
        updatedAt: Date;
        hostId: string;
        channelId: string | null;
    }>;
    addTranscriptSegment(meetingId: string, speakerName: string, text: string, translation?: string): Promise<{
        id: string;
        createdAt: Date;
        meetingId: string;
        timestamp: Date;
        speakerName: string;
        speakerId: string | null;
        text: string;
        translation: string | null;
    }>;
    endMeeting(meetingId: string): Promise<{
        actionItems: {
            id: string;
            status: import(".prisma/client").$Enums.ActionItemStatus;
            createdAt: Date;
            updatedAt: Date;
            meetingId: string;
            text: string;
            assigneeId: string | null;
            assigneeName: string | null;
            dueDate: Date | null;
            externalId: string | null;
            externalUrl: string | null;
            externalPlatform: string | null;
        }[];
        risks: {
            id: string;
            status: import(".prisma/client").$Enums.RiskStatus;
            createdAt: Date;
            meetingId: string;
            text: string;
            severity: import(".prisma/client").$Enums.RiskSeverity;
        }[];
        summary: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            meetingId: string;
            overview: string;
            keyTakeaways: string;
            keyDecisions: string | null;
            nextSteps: string | null;
            productivityScore: number;
        } | null;
        analytics: {
            id: string;
            createdAt: Date;
            meetingId: string;
            duration: number;
            totalWords: number;
            talkTimeDistribution: string;
            sentimentScore: number;
            engagementScore: number;
            speakerSentiment: string;
        } | null;
    } & {
        id: string;
        code: string | null;
        title: string;
        description: string | null;
        invitedEmails: string | null;
        status: import(".prisma/client").$Enums.MeetingStatus;
        startTime: Date;
        endTime: Date | null;
        createdAt: Date;
        updatedAt: Date;
        hostId: string;
        channelId: string | null;
    }>;
    analyzeRealTime(meetingId: string): Promise<{
        actionItems: {
            id: string;
            status: import(".prisma/client").$Enums.ActionItemStatus;
            createdAt: Date;
            updatedAt: Date;
            meetingId: string;
            text: string;
            assigneeId: string | null;
            assigneeName: string | null;
            dueDate: Date | null;
            externalId: string | null;
            externalUrl: string | null;
            externalPlatform: string | null;
        }[];
        risks: {
            id: string;
            status: import(".prisma/client").$Enums.RiskStatus;
            createdAt: Date;
            meetingId: string;
            text: string;
            severity: import(".prisma/client").$Enums.RiskSeverity;
        }[];
    } | null>;
    createChannelMessage(channelId: string, senderId: string, senderName: string, text: string): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        text: string;
        senderName: string;
        senderId: string;
    }>;
    createDirectMessage(senderId: string, receiverId: string, text: string): Promise<{
        sender: {
            id: string;
            name: string;
            email: string;
        };
        receiver: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        text: string;
        senderId: string;
        receiverId: string;
    }>;
    syncActionItemToPlatform(actionItemId: string, platform: 'clickup' | 'trello'): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActionItemStatus;
        createdAt: Date;
        updatedAt: Date;
        meetingId: string;
        text: string;
        assigneeId: string | null;
        assigneeName: string | null;
        dueDate: Date | null;
        externalId: string | null;
        externalUrl: string | null;
        externalPlatform: string | null;
    }>;
    getMeetingAnalytics(meetingId: string): Promise<{
        meetingId: string;
        duration: number;
        totalWords: number;
        talkTimeDistribution: {};
        sentimentScore: number;
        engagementScore: number;
        speakerSentiment: {};
        createdAt?: undefined;
    } | {
        meetingId: string;
        duration: number;
        totalWords: number;
        talkTimeDistribution: any;
        sentimentScore: number;
        engagementScore: number;
        speakerSentiment: any;
        createdAt: Date;
    }>;
    getTeamAnalytics(teamId: string): Promise<{
        teamId: string;
        averageDuration: number;
        averageSentiment: number;
        averageEngagement: number;
        totalMeetingsAnalyzed: number;
    }>;
    generateSpeech(text: string, languageCode?: string): Promise<string>;
    translateText(text: string, sourceLang: string, targetLang?: string): Promise<string>;
    answerMeetingQuestion(meetingId: string, question: string, askerName: string): Promise<{
        segment: {
            id: string;
            createdAt: Date;
            meetingId: string;
            timestamp: Date;
            speakerName: string;
            speakerId: string | null;
            text: string;
            translation: string | null;
        };
        diagram: any;
    }>;
    askDigitalTwin(meetingId: string, question: string): Promise<{
        answer: string;
        diagram?: any;
    }>;
}
