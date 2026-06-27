import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

class LiveKitTokenDto {
  roomName: string;
  participantName: string;
  participantIdentity?: string;
}

@Controller('livekit')
@UseGuards(JwtAuthGuard)
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Public()
  @Post('token')
  async getLivekitToken(@Body() body: LiveKitTokenDto) {
    try {
      if (!body.roomName || !body.participantName) {
        throw new HttpException('Missing roomName or participantName', HttpStatus.BAD_REQUEST);
      }
      const token = await this.livekitService.generateAccessToken(
        body.roomName,
        body.participantName,
        body.participantIdentity,
      );
      return {
        token,
        url: this.livekitService.getLivekitUrl(),
      };
    } catch (e: any) {
      throw new HttpException(
        `Failed to generate LiveKit token: ${e.message}`,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
