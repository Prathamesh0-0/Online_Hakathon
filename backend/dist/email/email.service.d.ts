export interface SendInviteEmailDto {
    recipientEmail: string;
    recipientName?: string;
    meetingTitle: string;
    meetingCode: string;
    meetingId: string;
    hostName: string;
    scheduledAt?: Date;
    joinLink: string;
}
export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    private sendViaResend;
    private sendMockEmail;
    sendMeetingInvite(dto: SendInviteEmailDto): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    sendBulkInvites(emails: string[], meetingData: Omit<SendInviteEmailDto, 'recipientEmail' | 'recipientName'>): Promise<{
        total: number;
        sent: number;
        failed: string[];
    }>;
    private buildInviteEmailHtml;
    private buildPlainTextBody;
}
