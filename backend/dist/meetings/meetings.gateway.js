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
var MeetingsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const meetings_service_1 = require("./meetings.service");
const ai_service_1 = require("../ai/ai.service");
const common_1 = require("@nestjs/common");
let MeetingsGateway = MeetingsGateway_1 = class MeetingsGateway {
    constructor(meetingsService, aiService) {
        this.meetingsService = meetingsService;
        this.aiService = aiService;
        this.logger = new common_1.Logger(MeetingsGateway_1.name);
        this.meetingAnalysisCounters = new Map();
        this.waitingParticipants = new Map();
        this.activeParticipants = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        for (const [meetingId, list] of this.waitingParticipants.entries()) {
            if (list.some(p => p.socketId === client.id)) {
                const updated = list.filter(p => p.socketId !== client.id);
                this.waitingParticipants.set(meetingId, updated);
                this.server.to(meetingId).emit('waitingListUpdated', updated);
            }
        }
        for (const [meetingId, list] of this.activeParticipants.entries()) {
            if (list.some(p => p.socketId === client.id)) {
                const updated = list.filter(p => p.socketId !== client.id);
                this.activeParticipants.set(meetingId, updated);
                this.server.to(meetingId).emit('participantsUpdated', updated);
            }
        }
    }
    handleJoinWaitingRoom(client, data) {
        const { meetingId, name, email } = data;
        this.logger.log(`Client ${client.id} joining waiting room for meeting: ${meetingId}`);
        client.join(`waiting_room_${meetingId}`);
        let list = this.waitingParticipants.get(meetingId) || [];
        if (!list.some(p => p.socketId === client.id)) {
            list.push({ socketId: client.id, name, email });
        }
        this.waitingParticipants.set(meetingId, list);
        this.server.to(meetingId).emit('waitingListUpdated', list);
        this.server.to(meetingId).emit('participantWaiting', { socketId: client.id, name, email });
        return { status: 'success', waitingCount: list.length };
    }
    handleApproveParticipant(client, data) {
        const { meetingId, guestSocketId } = data;
        this.logger.log(`Host approving guest ${guestSocketId} for meeting ${meetingId}`);
        let list = this.waitingParticipants.get(meetingId) || [];
        list = list.filter(p => p.socketId !== guestSocketId);
        this.waitingParticipants.set(meetingId, list);
        this.server.to(meetingId).emit('waitingListUpdated', list);
        this.server.to(guestSocketId).emit('joinApproved', { meetingId });
        return { status: 'success' };
    }
    handleRejectParticipant(client, data) {
        const { meetingId, guestSocketId } = data;
        this.logger.log(`Host rejecting guest ${guestSocketId} for meeting ${meetingId}`);
        let list = this.waitingParticipants.get(meetingId) || [];
        list = list.filter(p => p.socketId !== guestSocketId);
        this.waitingParticipants.set(meetingId, list);
        this.server.to(meetingId).emit('waitingListUpdated', list);
        this.server.to(guestSocketId).emit('joinRejected', { meetingId });
        return { status: 'success' };
    }
    handleGetWaitingList(client, data) {
        const list = this.waitingParticipants.get(data.meetingId) || [];
        return { status: 'success', waitingList: list };
    }
    handleGetParticipants(client, data) {
        const list = this.activeParticipants.get(data.meetingId) || [];
        return { status: 'success', participants: list };
    }
    handleJoinMeeting(client, data) {
        client.join(data.meetingId);
        this.logger.log(`Client ${client.id} joined meeting room: ${data.meetingId}`);
        if (data.name) {
            let list = this.activeParticipants.get(data.meetingId) || [];
            if (!list.some(p => p.socketId === client.id)) {
                list.push({ socketId: client.id, name: data.name });
            }
            this.activeParticipants.set(data.meetingId, list);
            this.server.to(data.meetingId).emit('participantsUpdated', list);
        }
        return { status: 'success', room: data.meetingId };
    }
    handleLeaveMeeting(client, data) {
        client.leave(data.meetingId);
        this.logger.log(`Client ${client.id} left meeting room: ${data.meetingId}`);
        let list = this.activeParticipants.get(data.meetingId) || [];
        if (list.some(p => p.socketId === client.id)) {
            list = list.filter(p => p.socketId !== client.id);
            this.activeParticipants.set(data.meetingId, list);
            this.server.to(data.meetingId).emit('participantsUpdated', list);
        }
        return { status: 'success', room: data.meetingId };
    }
    async handleSendTranscript(client, data) {
        const { meetingId, speakerName, text, languageCode } = data;
        this.logger.log(`Transcript in ${meetingId} from ${speakerName}: "${text}" (Lang: ${languageCode || 'default'})`);
        let translation = undefined;
        if (languageCode && languageCode !== 'en-US' && languageCode !== 'en-IN') {
            try {
                translation = await this.meetingsService.translateText(text, languageCode, 'en-IN');
                this.logger.log(`Translated transcript to English: "${translation}"`);
            }
            catch (err) {
                this.logger.error(`Real-time translation failed: ${err.message}`);
            }
        }
        const segment = await this.meetingsService.addTranscriptSegment(meetingId, speakerName, text, translation);
        this.server.to(meetingId).emit('transcriptAdded', segment);
        const cleanText = text.toLowerCase();
        const aiTriggers = [
            'copilot', 'co pilot', 'ko pilot', 'co-pilot',
            'hey ai', 'ask ai', 'ai help', 'ai assist',
            'hey copilot', 'ai copilot', 'ai ko',
            'pilot help', 'pilot madad', 'madad karo',
            'help me', 'ai please', 'ai bhai',
        ];
        const isAiTriggered = aiTriggers.some(trigger => cleanText.includes(trigger));
        if (speakerName !== 'AI Copilot' && isAiTriggered) {
            setTimeout(async () => {
                try {
                    this.logger.log(`Detected question in transcript for AI Copilot in meeting ${meetingId}: "${text}"`);
                    const aiSegment = await this.meetingsService.answerMeetingQuestion(meetingId, text, speakerName);
                    let ttsAudio = '';
                    try {
                        ttsAudio = await this.aiService.generateSpeech(aiSegment.text, 'en-IN');
                    }
                    catch (ttsErr) {
                        this.logger.warn(`TTS generation failed, emitting without audio: ${ttsErr.message}`);
                    }
                    this.server.to(meetingId).emit('transcriptAdded', {
                        ...aiSegment,
                        ttsAudio,
                    });
                }
                catch (err) {
                    this.logger.error(`Failed to generate AI Copilot response to transcript question: ${err.message}`);
                }
            }, 1000);
        }
        let count = this.meetingAnalysisCounters.get(meetingId) || 0;
        count += 1;
        this.meetingAnalysisCounters.set(meetingId, count);
        if (count % 4 === 0) {
            try {
                this.logger.log(`Triggering background real-time AI analysis for meeting ${meetingId}...`);
                const analysis = await this.meetingsService.analyzeRealTime(meetingId);
                if (analysis) {
                    this.server.to(meetingId).emit('liveAnalysisUpdated', {
                        actionItems: analysis.actionItems,
                        risks: analysis.risks,
                    });
                }
            }
            catch (error) {
                this.logger.error(`Failed to run real-time AI analysis for meeting ${meetingId}:`, error);
            }
        }
    }
    async handleAskAiQuestion(client, data) {
        const { meetingId, question, askerName } = data;
        this.logger.log(`Direct Q&A in ${meetingId} from ${askerName}: "${question}"`);
        const questionSegment = await this.meetingsService.addTranscriptSegment(meetingId, askerName, question);
        this.server.to(meetingId).emit('transcriptAdded', questionSegment);
        try {
            const result = await this.meetingsService.answerMeetingQuestion(meetingId, question, askerName);
            const aiSegment = result.segment;
            const diagram = result.diagram;
            let ttsAudio = '';
            try {
                ttsAudio = await this.aiService.generateSpeech(aiSegment.text, 'en-IN');
                this.logger.log(`Sarvam AI TTS audio generated (${ttsAudio.length} chars base64)`);
            }
            catch (ttsErr) {
                this.logger.warn(`TTS generation failed, emitting without audio: ${ttsErr.message}`);
            }
            this.server.to(meetingId).emit('transcriptAdded', {
                ...aiSegment,
                diagram,
                ttsAudio,
            });
            return { status: 'success', answer: aiSegment.text, diagram };
        }
        catch (error) {
            this.logger.error(`Direct AI Q&A failed:`, error);
            return { status: 'error', message: error.message };
        }
    }
    async handleManualAnalysis(client, data) {
        try {
            const analysis = await this.meetingsService.analyzeRealTime(data.meetingId);
            if (analysis) {
                this.server.to(data.meetingId).emit('liveAnalysisUpdated', {
                    actionItems: analysis.actionItems,
                    risks: analysis.risks,
                });
            }
            return { status: 'success' };
        }
        catch (error) {
            this.logger.error(`Manual AI analysis failed:`, error);
            return { status: 'error', message: error.message };
        }
    }
    handleJoinChannel(client, data) {
        client.join(`channel_${data.channelId}`);
        this.logger.log(`Client ${client.id} joined channel room: channel_${data.channelId}`);
        return { status: 'success', room: `channel_${data.channelId}` };
    }
    handleLeaveChannel(client, data) {
        client.leave(`channel_${data.channelId}`);
        this.logger.log(`Client ${client.id} left channel room: channel_${data.channelId}`);
        return { status: 'success', room: `channel_${data.channelId}` };
    }
    async handleSendChannelMessage(client, data) {
        const { channelId, senderId, senderName, text } = data;
        const message = await this.meetingsService.createChannelMessage(channelId, senderId, senderName, text);
        this.server.to(`channel_${channelId}`).emit('channelMessageAdded', message);
        return { status: 'success' };
    }
    handleJoinUserRoom(client, data) {
        client.join(`user_${data.userId}`);
        this.logger.log(`Client ${client.id} joined user room: user_${data.userId}`);
        return { status: 'success', room: `user_${data.userId}` };
    }
    async handleSendDirectMessage(client, data) {
        const { senderId, receiverId, text } = data;
        const message = await this.meetingsService.createDirectMessage(senderId, receiverId, text);
        this.server.to(`user_${senderId}`).emit('directMessageAdded', message);
        this.server.to(`user_${receiverId}`).emit('directMessageAdded', message);
        return { status: 'success' };
    }
    handleWebRTCOffer(client, data) {
        this.logger.log(`Routing WebRTC offer from ${client.id} to ${data.target}`);
        this.server.to(data.target).emit('webrtc_offer', {
            sdp: data.sdp,
            sender: client.id,
        });
    }
    handleWebRTCAnswer(client, data) {
        this.logger.log(`Routing WebRTC answer from ${client.id} to ${data.target}`);
        this.server.to(data.target).emit('webrtc_answer', {
            sdp: data.sdp,
            sender: client.id,
        });
    }
    handleWebRTCIceCandidate(client, data) {
        this.logger.log(`Routing WebRTC ICE candidate from ${client.id} to ${data.target}`);
        this.server.to(data.target).emit('webrtc_ice_candidate', {
            candidate: data.candidate,
            sender: client.id,
        });
    }
};
exports.MeetingsGateway = MeetingsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MeetingsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinWaitingRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleJoinWaitingRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('approveParticipant'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleApproveParticipant", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('rejectParticipant'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleRejectParticipant", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getWaitingList'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleGetWaitingList", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getParticipants'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleGetParticipants", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinMeeting'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleJoinMeeting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveMeeting'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleLeaveMeeting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendTranscript'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MeetingsGateway.prototype, "handleSendTranscript", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('askAiQuestion'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MeetingsGateway.prototype, "handleAskAiQuestion", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('triggerManualAnalysis'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MeetingsGateway.prototype, "handleManualAnalysis", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleJoinChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleLeaveChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendChannelMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MeetingsGateway.prototype, "handleSendChannelMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinUserRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleJoinUserRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendDirectMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MeetingsGateway.prototype, "handleSendDirectMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleWebRTCOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleWebRTCAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_ice_candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MeetingsGateway.prototype, "handleWebRTCIceCandidate", null);
exports.MeetingsGateway = MeetingsGateway = MeetingsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        ai_service_1.AiService])
], MeetingsGateway);
//# sourceMappingURL=meetings.gateway.js.map