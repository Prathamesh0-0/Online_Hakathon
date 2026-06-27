import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MeetingsService } from './meetings.service';
import { AiService } from '../ai/ai.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MeetingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MeetingsGateway.name);

  // Keep track of active utterance counts to throttle real-time AI analysis
  private meetingAnalysisCounters: Map<string, number> = new Map();

  // Keep track of waiting participants: meetingId -> Array<{ socketId: string, name: string, email: string }>
  private waitingParticipants: Map<string, Array<{ socketId: string; name: string; email: string }>> = new Map();

  // Keep track of active participants: meetingId -> Array<{ socketId: string, name: string }>
  private activeParticipants: Map<string, Array<{ socketId: string; name: string }>> = new Map();

  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly aiService: AiService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clean up client from waiting list in all rooms
    for (const [meetingId, list] of this.waitingParticipants.entries()) {
      if (list.some(p => p.socketId === client.id)) {
        const updated = list.filter(p => p.socketId !== client.id);
        this.waitingParticipants.set(meetingId, updated);
        // Notify host
        this.server.to(meetingId).emit('waitingListUpdated', updated);
      }
    }

    // Clean up client from active participants in all rooms
    for (const [meetingId, list] of this.activeParticipants.entries()) {
      if (list.some(p => p.socketId === client.id)) {
        const updated = list.filter(p => p.socketId !== client.id);
        this.activeParticipants.set(meetingId, updated);
        this.server.to(meetingId).emit('participantsUpdated', updated);
      }
    }
  }

  @SubscribeMessage('joinWaitingRoom')
  handleJoinWaitingRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; name: string; email: string },
  ) {
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

  @SubscribeMessage('approveParticipant')
  handleApproveParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; guestSocketId: string },
  ) {
    const { meetingId, guestSocketId } = data;
    this.logger.log(`Host approving guest ${guestSocketId} for meeting ${meetingId}`);

    let list = this.waitingParticipants.get(meetingId) || [];
    list = list.filter(p => p.socketId !== guestSocketId);
    this.waitingParticipants.set(meetingId, list);

    this.server.to(meetingId).emit('waitingListUpdated', list);
    this.server.to(guestSocketId).emit('joinApproved', { meetingId });

    return { status: 'success' };
  }

  @SubscribeMessage('rejectParticipant')
  handleRejectParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; guestSocketId: string },
  ) {
    const { meetingId, guestSocketId } = data;
    this.logger.log(`Host rejecting guest ${guestSocketId} for meeting ${meetingId}`);

    let list = this.waitingParticipants.get(meetingId) || [];
    list = list.filter(p => p.socketId !== guestSocketId);
    this.waitingParticipants.set(meetingId, list);

    this.server.to(meetingId).emit('waitingListUpdated', list);
    this.server.to(guestSocketId).emit('joinRejected', { meetingId });

    return { status: 'success' };
  }

  @SubscribeMessage('getWaitingList')
  handleGetWaitingList(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    const list = this.waitingParticipants.get(data.meetingId) || [];
    return { status: 'success', waitingList: list };
  }

  @SubscribeMessage('getParticipants')
  handleGetParticipants(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    const list = this.activeParticipants.get(data.meetingId) || [];
    return { status: 'success', participants: list };
  }

  @SubscribeMessage('joinMeeting')
  handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; name?: string },
  ) {
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

  @SubscribeMessage('leaveMeeting')
  handleLeaveMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
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

  @SubscribeMessage('sendTranscript')
  async handleSendTranscript(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; speakerName: string; text: string; languageCode?: string },
  ) {
    const { meetingId, speakerName, text, languageCode } = data;
    this.logger.log(`Transcript in ${meetingId} from ${speakerName}: "${text}" (Lang: ${languageCode || 'default'})`);

    let translation: string | undefined = undefined;
    if (languageCode && languageCode !== 'en-US' && languageCode !== 'en-IN') {
      try {
        translation = await this.meetingsService.translateText(text, languageCode, 'en-IN');
        this.logger.log(`Translated transcript to English: "${translation}"`);
      } catch (err: any) {
        this.logger.error(`Real-time translation failed: ${err.message}`);
      }
    }

    // 1. Save transcript segment to DB
    const segment = await this.meetingsService.addTranscriptSegment(meetingId, speakerName, text, translation);

    // 2. Broadcast the segment to all participants in the meeting room
    this.server.to(meetingId).emit('transcriptAdded', segment);

    // Check if the segment addresses the AI Copilot (excluding responses from Copilot itself)
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

          // Generate Sarvam AI TTS audio for the AI response
          let ttsAudio = '';
          try {
            ttsAudio = await this.aiService.generateSpeech(aiSegment.text, 'en-IN');
          } catch (ttsErr: any) {
            this.logger.warn(`TTS generation failed, emitting without audio: ${ttsErr.message}`);
          }

          this.server.to(meetingId).emit('transcriptAdded', {
            ...aiSegment,
            ttsAudio,
          });
        } catch (err: any) {
          this.logger.error(`Failed to generate AI Copilot response to transcript question: ${err.message}`);
        }
      }, 1000);
    }

    // 3. Throttle real-time AI updates (trigger AI analysis every 4 transcript segments)
    let count = this.meetingAnalysisCounters.get(meetingId) || 0;
    count += 1;
    this.meetingAnalysisCounters.set(meetingId, count);

    if (count % 4 === 0) {
      try {
        this.logger.log(`Triggering background real-time AI analysis for meeting ${meetingId}...`);
        const analysis = await this.meetingsService.analyzeRealTime(meetingId);
        if (analysis) {
          // Broadcast live action items and risks to the room
          this.server.to(meetingId).emit('liveAnalysisUpdated', {
            actionItems: analysis.actionItems,
            risks: analysis.risks,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to run real-time AI analysis for meeting ${meetingId}:`, error);
      }
    }
  }

  @SubscribeMessage('askAiQuestion')
  async handleAskAiQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; question: string; askerName: string },
  ) {
    const { meetingId, question, askerName } = data;
    this.logger.log(`Direct Q&A in ${meetingId} from ${askerName}: "${question}"`);

    // 1. Save and emit the question itself as a transcript segment
    const questionSegment = await this.meetingsService.addTranscriptSegment(meetingId, askerName, question);
    this.server.to(meetingId).emit('transcriptAdded', questionSegment);

    try {
      // 2. Generate and save the AI Copilot response
      const result = await this.meetingsService.answerMeetingQuestion(meetingId, question, askerName);
      const aiSegment = result.segment;
      const diagram = result.diagram;

      // 3. Generate Sarvam AI TTS audio for the AI Copilot's voice response
      let ttsAudio = '';
      try {
        ttsAudio = await this.aiService.generateSpeech(aiSegment.text, 'en-IN');
        this.logger.log(`Sarvam AI TTS audio generated (${ttsAudio.length} chars base64)`);
      } catch (ttsErr: any) {
        this.logger.warn(`TTS generation failed, emitting without audio: ${ttsErr.message}`);
      }

      this.server.to(meetingId).emit('transcriptAdded', {
        ...aiSegment,
        diagram,
        ttsAudio,
      });
      return { status: 'success', answer: aiSegment.text, diagram };
    } catch (error: any) {
      this.logger.error(`Direct AI Q&A failed:`, error);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('triggerManualAnalysis')
  async handleManualAnalysis(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    try {
      const analysis = await this.meetingsService.analyzeRealTime(data.meetingId);
      if (analysis) {
        this.server.to(data.meetingId).emit('liveAnalysisUpdated', {
          actionItems: analysis.actionItems,
          risks: analysis.risks,
        });
      }
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Manual AI analysis failed:`, error);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.join(`channel_${data.channelId}`);
    this.logger.log(`Client ${client.id} joined channel room: channel_${data.channelId}`);
    return { status: 'success', room: `channel_${data.channelId}` };
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`channel_${data.channelId}`);
    this.logger.log(`Client ${client.id} left channel room: channel_${data.channelId}`);
    return { status: 'success', room: `channel_${data.channelId}` };
  }

  @SubscribeMessage('sendChannelMessage')
  async handleSendChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; senderId: string; senderName: string; text: string },
  ) {
    const { channelId, senderId, senderName, text } = data;
    const message = await this.meetingsService.createChannelMessage(channelId, senderId, senderName, text);
    this.server.to(`channel_${channelId}`).emit('channelMessageAdded', message);
    return { status: 'success' };
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    client.join(`user_${data.userId}`);
    this.logger.log(`Client ${client.id} joined user room: user_${data.userId}`);
    return { status: 'success', room: `user_${data.userId}` };
  }

  @SubscribeMessage('sendDirectMessage')
  async handleSendDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string; text: string },
  ) {
    const { senderId, receiverId, text } = data;
    const message = await this.meetingsService.createDirectMessage(senderId, receiverId, text);
    this.server.to(`user_${senderId}`).emit('directMessageAdded', message);
    this.server.to(`user_${receiverId}`).emit('directMessageAdded', message);
    return { status: 'success' };
  }

  @SubscribeMessage('webrtc_offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; sdp: any; meetingId: string },
  ) {
    this.logger.log(`Routing WebRTC offer from ${client.id} to ${data.target}`);
    this.server.to(data.target).emit('webrtc_offer', {
      sdp: data.sdp,
      sender: client.id,
    });
  }

  @SubscribeMessage('webrtc_answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; sdp: any },
  ) {
    this.logger.log(`Routing WebRTC answer from ${client.id} to ${data.target}`);
    this.server.to(data.target).emit('webrtc_answer', {
      sdp: data.sdp,
      sender: client.id,
    });
  }

  @SubscribeMessage('webrtc_ice_candidate')
  handleWebRTCIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; candidate: any; meetingId: string },
  ) {
    this.logger.log(`Routing WebRTC ICE candidate from ${client.id} to ${data.target}`);
    this.server.to(data.target).emit('webrtc_ice_candidate', {
      candidate: data.candidate,
      sender: client.id,
    });
  }
}
