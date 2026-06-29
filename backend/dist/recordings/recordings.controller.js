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
exports.RecordingsController = void 0;
const common_1 = require("@nestjs/common");
const recordings_service_1 = require("./recordings.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const platform_express_1 = require("@nestjs/platform-express");
let RecordingsController = class RecordingsController {
    constructor(recordingsService) {
        this.recordingsService = recordingsService;
    }
    async saveRecording(req, file, body) {
        const userName = body.createdBy || req.user.email || 'User';
        const durationNum = parseInt(body.duration, 10) || 0;
        return this.recordingsService.saveRecordingFromFile(body.meetingId, body.meetingTitle, durationNum, userName, file, body.accessCode);
    }
    async getRecordings() {
        return this.recordingsService.getAllRecordings();
    }
    async getRecordingFile(filename, res) {
        const filePath = this.recordingsService.getFilePath(filename);
        res.setHeader('Content-Type', 'video/webm');
        return res.sendFile(filePath);
    }
    async deleteRecording(id) {
        return this.recordingsService.deleteRecording(id);
    }
    async setAccessCode(id, body) {
        return this.recordingsService.setAccessCode(id, body.code);
    }
};
exports.RecordingsController = RecordingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RecordingsController.prototype, "saveRecording", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecordingsController.prototype, "getRecordings", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('file/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecordingsController.prototype, "getRecordingFile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RecordingsController.prototype, "deleteRecording", null);
__decorate([
    (0, common_1.Post)(':id/access-code'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecordingsController.prototype, "setAccessCode", null);
exports.RecordingsController = RecordingsController = __decorate([
    (0, common_1.Controller)('recordings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [recordings_service_1.RecordingsService])
], RecordingsController);
//# sourceMappingURL=recordings.controller.js.map