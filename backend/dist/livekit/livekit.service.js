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
var LivekitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivekitService = void 0;
const common_1 = require("@nestjs/common");
const livekit_server_sdk_1 = require("livekit-server-sdk");
let LivekitService = LivekitService_1 = class LivekitService {
    constructor() {
        this.logger = new common_1.Logger(LivekitService_1.name);
        this.apiKey = process.env.LIVEKIT_API_KEY || 'dev-key';
        this.apiSecret = process.env.LIVEKIT_API_SECRET || 'dev-secret';
        this.livekitUrl = process.env.LIVEKIT_URL || 'wss://your-livekit-project.livekit.cloud';
        if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
            this.logger.warn('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not set. LiveKit token generator running in dummy mode.');
        }
        let httpUrl = this.livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
        this.roomService = new livekit_server_sdk_1.RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
    }
    async generateAccessToken(roomName, participantName, participantIdentity) {
        const identity = participantIdentity || `guest_${Math.floor(1000 + Math.random() * 9000)}`;
        try {
            await this.roomService.createRoom({
                name: roomName,
                emptyTimeout: 10 * 60,
                maxParticipants: 30,
            });
            const at = new livekit_server_sdk_1.AccessToken(this.apiKey, this.apiSecret, {
                identity: identity,
                name: participantName,
                ttl: '6h',
            });
            at.addGrant({
                roomJoin: true,
                room: roomName,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
            });
            const token = await at.toJwt();
            this.logger.log(`Generated LiveKit token for participant ${participantName} in room ${roomName} with max 30 participants`);
            return token;
        }
        catch (error) {
            this.logger.error(`Failed to encode LiveKit token or create room: ${error.message}`);
            throw error;
        }
    }
    getLivekitUrl() {
        return this.livekitUrl;
    }
};
exports.LivekitService = LivekitService;
exports.LivekitService = LivekitService = LivekitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LivekitService);
//# sourceMappingURL=livekit.service.js.map