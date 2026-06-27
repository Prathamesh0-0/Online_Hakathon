import { EmailService } from './email.service';
import { MeetingsService } from '../meetings/meetings.service';
declare class SendInviteDto {
    emails: string[];
    meetingId: string;
    appBaseUrl?: string;
}
declare class SendSingleInviteDto {
    email: string;
    appBaseUrl?: string;
}
export declare class EmailController {
    private readonly emailService;
    private readonly meetingsService;
    constructor(emailService: EmailService, meetingsService: MeetingsService);
    sendInvites(body: SendInviteDto, req: any): Promise<{
        total: number;
        sent: number;
        failed: string[];
        message: string;
    }>;
    sendSingleInvite(meetingId: string, body: SendSingleInviteDto, req: any): Promise<{
        message: string;
        messageId: string | undefined;
    }>;
}
export {};
