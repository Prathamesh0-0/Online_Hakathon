import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('recordings')
@UseGuards(JwtAuthGuard)
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async saveRecording(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body() body: { meetingId: string; meetingTitle: string; duration: string; createdBy?: string; accessCode?: string }
  ) {
    const userName = body.createdBy || req.user.email || 'User';
    const durationNum = parseInt(body.duration, 10) || 0;
    return this.recordingsService.saveRecordingFromFile(
      body.meetingId,
      body.meetingTitle,
      durationNum,
      userName,
      file,
      body.accessCode
    );
  }

  @Get()
  async getRecordings() {
    return this.recordingsService.getAllRecordings();
  }

  @Public()
  @Get('file/:filename')
  async getRecordingFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.recordingsService.getFilePath(filename);
    res.setHeader('Content-Type', 'video/webm');
    return res.sendFile(filePath);
  }

  @Delete(':id')
  async deleteRecording(@Param('id') id: string) {
    return this.recordingsService.deleteRecording(id);
  }

  @Post(':id/access-code')
  async setAccessCode(@Param('id') id: string, @Body() body: { code: string }) {
    return this.recordingsService.setAccessCode(id, body.code);
  }
}
