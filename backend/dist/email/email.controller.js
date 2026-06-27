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
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const meetings_service_1 = require("../meetings/meetings.service");
const class_validator_1 = require("class-validator");
class SendInviteDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SendInviteDto.prototype, "emails", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendInviteDto.prototype, "meetingId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendInviteDto.prototype, "appBaseUrl", void 0);
class SendSingleInviteDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendSingleInviteDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSingleInviteDto.prototype, "appBaseUrl", void 0);
let EmailController = class EmailController {
    constructor(emailService, meetingsService) {
        this.emailService = emailService;
        this.meetingsService = meetingsService;
    }
    async sendInvites(body, req) {
        const { emails, meetingId, appBaseUrl } = body;
        if (!emails || emails.length === 0) {
            throw new common_1.BadRequestException('At least one email address is required');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((e) => !emailRegex.test(e));
        if (invalidEmails.length > 0) {
            throw new common_1.BadRequestException(`Invalid email address(es): ${invalidEmails.join(', ')}`);
        }
        const meeting = await this.meetingsService.getMeetingById(meetingId);
        const hostName = req.user?.name || req.user?.email || 'Meeting Host';
        const baseUrl = appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:5173';
        const joinLink = `${baseUrl}/join?code=${meeting.code}`;
        const result = await this.emailService.sendBulkInvites(emails, {
            meetingId: meeting.id,
            meetingTitle: meeting.title,
            meetingCode: meeting.code ?? '',
            hostName,
            scheduledAt: meeting.startTime ?? undefined,
            joinLink,
        });
        return {
            message: `Invites sent: ${result.sent}/${result.total}`,
            ...result,
        };
    }
    async sendSingleInvite(meetingId, body, req) {
        const { email, appBaseUrl } = body;
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        const meeting = await this.meetingsService.getMeetingById(meetingId);
        const hostName = req.user?.name || req.user?.email || 'Meeting Host';
        const baseUrl = appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:5173';
        const joinLink = `${baseUrl}/join?code=${meeting.code}`;
        const result = await this.emailService.sendMeetingInvite({
            recipientEmail: email,
            meetingId: meeting.id,
            meetingTitle: meeting.title,
            meetingCode: meeting.code ?? '',
            hostName,
            scheduledAt: meeting.startTime ?? undefined,
            joinLink,
        });
        if (!result.success) {
            throw new common_1.BadRequestException(`Failed to send invite: ${result.error}`);
        }
        return { message: `Invite sent to ${email}`, messageId: result.messageId };
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('invite'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendInviteDto, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendInvites", null);
__decorate([
    (0, common_1.Post)('invite/:meetingId/single'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SendSingleInviteDto, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendSingleInvite", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)('email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        meetings_service_1.MeetingsService])
], EmailController);
//# sourceMappingURL=email.controller.js.map