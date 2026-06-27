import { MeetingsService } from './meetings.service';
import { Response } from 'express';
import { MeetingsGateway } from './meetings.gateway';
export declare class MeetingsController {
    private readonly meetingsService;
    private readonly meetingsGateway;
    constructor(meetingsService: MeetingsService, meetingsGateway: MeetingsGateway);
    createMeeting(req: any, body: {
        title: string;
        description?: string;
        startTime?: string;
        invitedEmails?: string;
    }): Promise<{
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
    getMeetingByCode(code: string): Promise<any>;
    getMeetings(req: any): Promise<({
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
    getMeeting(id: string): Promise<{
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
    startMeeting(id: string): Promise<{
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
    endMeeting(id: string): Promise<{
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
    analyzeRealTime(id: string): Promise<{
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
    syncActionItem(actionItemId: string, platform: 'clickup' | 'trello'): Promise<{
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
    emailMeetingSummary(meetingId: string, req: any): Promise<{
        status: string;
        message: string;
    }>;
    askTwin(id: string, body: {
        question: string;
    }): Promise<{
        answer: string;
        diagram: any;
    }>;
    getFollowupCalendarLink(meetingId: string): Promise<{
        url: string;
    }>;
    exportMeetingPdfView(meetingId: string, res: Response): Promise<Response<any, Record<string, any>>>;
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
    private buildPdfHtml;
    speak(body: {
        text: string;
        languageCode?: string;
    }): Promise<{
        audioContent: string;
    }>;
    translate(body: {
        text: string;
        sourceLang: string;
        targetLang?: string;
    }): Promise<{
        translatedText: string;
    }>;
}
