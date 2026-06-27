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
exports.LivekitController = void 0;
const common_1 = require("@nestjs/common");
const livekit_service_1 = require("./livekit.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
class LiveKitTokenDto {
}
let LivekitController = class LivekitController {
    constructor(livekitService) {
        this.livekitService = livekitService;
    }
    async getLivekitToken(body) {
        try {
            if (!body.roomName || !body.participantName) {
                throw new common_1.HttpException('Missing roomName or participantName', common_1.HttpStatus.BAD_REQUEST);
            }
            const token = await this.livekitService.generateAccessToken(body.roomName, body.participantName, body.participantIdentity);
            return {
                token,
                url: this.livekitService.getLivekitUrl(),
            };
        }
        catch (e) {
            throw new common_1.HttpException(`Failed to generate LiveKit token: ${e.message}`, e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.LivekitController = LivekitController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LiveKitTokenDto]),
    __metadata("design:returntype", Promise)
], LivekitController.prototype, "getLivekitToken", null);
exports.LivekitController = LivekitController = __decorate([
    (0, common_1.Controller)('livekit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [livekit_service_1.LivekitService])
], LivekitController);
//# sourceMappingURL=livekit.controller.js.map