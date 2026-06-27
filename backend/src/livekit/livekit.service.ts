import { Injectable, Logger } from '@nestjs/common';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly apiKey = process.env.LIVEKIT_API_KEY || 'dev-key';
  private readonly apiSecret = process.env.LIVEKIT_API_SECRET || 'dev-secret';
  private readonly livekitUrl = process.env.LIVEKIT_URL || 'wss://your-livekit-project.livekit.cloud';
  private readonly roomService: RoomServiceClient;

  constructor() {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      this.logger.warn(
        'LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not set. LiveKit token generator running in dummy mode.'
      );
    }
    
    let httpUrl = this.livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    this.roomService = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
  }

  async generateAccessToken(roomName: string, participantName: string, participantIdentity?: string): Promise<string> {
    const identity = participantIdentity || `guest_${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Create or update the room to enforce the 30 participants limit
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60,
        maxParticipants: 30,
      });

      const at = new AccessToken(this.apiKey, this.apiSecret, {
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
    } catch (error: any) {
      this.logger.error(`Failed to encode LiveKit token or create room: ${error.message}`);
      throw error;
    }
  }

  getLivekitUrl(): string {
    return this.livekitUrl;
  }
}
