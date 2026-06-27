import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getTeams(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            channels: true,
            members: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.teams;
  }

  async createTeam(userId: string, name: string) {
    const existing = await this.prisma.team.findUnique({
      where: { name },
    });

    if (existing) {
      throw new BadRequestException('Team name already exists');
    }

    return this.prisma.team.create({
      data: {
        name,
        members: {
          connect: { id: userId },
        },
      },
      include: {
        channels: true,
        members: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async joinTeam(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        channels: true,
        members: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async createChannel(teamId: string, name: string, description?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.channel.create({
      data: {
        name,
        description,
        teamId,
      },
    });
  }

  async getChannels(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { channels: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team.channels;
  }

  async getChannelMessages(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllUsers(userId: string) {
    return this.prisma.user.findMany({
      where: { NOT: { id: userId } },
      select: { id: true, name: true, email: true },
    });
  }

  async getDirectMessages(myId: string, userId: string) {
    return this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: userId },
          { senderId: userId, receiverId: myId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getChannelAiSummary(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Get last 50 channel messages
    const messages = await this.prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    messages.reverse();

    // Get past completed meetings in this channel
    const meetings = await this.prisma.meeting.findMany({
      where: { channelId, status: 'COMPLETED' },
      include: { summary: true },
    });

    const chatLines = messages.map(msg => `${msg.senderName}: ${msg.text}`);
    const meetingSummaries = meetings
      .filter(m => m.summary)
      .map(m => `Meeting '${m.title}' summary: ${m.summary?.overview}`);

    return this.aiService.summarizeChannel(chatLines, meetingSummaries);
  }
}
