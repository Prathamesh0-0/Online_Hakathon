import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getTeams(@Req() req: any) {
    const userId = req.user.userId;
    return this.teamsService.getTeams(userId);
  }

  @Post()
  async createTeam(@Req() req: any, @Body() body: { name: string }) {
    const userId = req.user.userId;
    return this.teamsService.createTeam(userId, body.name);
  }

  @Post(':id/join')
  async joinTeam(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.teamsService.joinTeam(userId, id);
  }

  @Post(':id/channels')
  async createChannel(
    @Param('id') id: string,
    @Body() body: { name: string; description?: string },
  ) {
    return this.teamsService.createChannel(id, body.name, body.description);
  }

  @Get(':id/channels')
  async getChannels(@Param('id') id: string) {
    return this.teamsService.getChannels(id);
  }

  @Get('channels/:id/messages')
  async getChannelMessages(@Param('id') id: string) {
    return this.teamsService.getChannelMessages(id);
  }

  @Get('users')
  async getAllUsers(@Req() req: any) {
    const userId = req.user.userId;
    return this.teamsService.getAllUsers(userId);
  }

  @Get('dms/:userId')
  async getDirectMessages(@Req() req: any, @Param('userId') otherUserId: string) {
    const myId = req.user.userId;
    return this.teamsService.getDirectMessages(myId, otherUserId);
  }

  @Post('channels/:id/ai-summary')
  async getChannelAiSummary(@Param('id') id: string) {
    return this.teamsService.getChannelAiSummary(id);
  }
}
