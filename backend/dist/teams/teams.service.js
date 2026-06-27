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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const ai_service_1 = require("../ai/ai.service");
let TeamsService = class TeamsService {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
    }
    async getTeams(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        return user.teams;
    }
    async createTeam(userId, name) {
        const existing = await this.prisma.team.findUnique({
            where: { name },
        });
        if (existing) {
            throw new common_1.BadRequestException('Team name already exists');
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
    async joinTeam(userId, teamId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
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
    async createChannel(teamId, name, description) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        return this.prisma.channel.create({
            data: {
                name,
                description,
                teamId,
            },
        });
    }
    async getChannels(teamId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: { channels: true },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        return team.channels;
    }
    async getChannelMessages(channelId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        return this.prisma.channelMessage.findMany({
            where: { channelId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getAllUsers(userId) {
        return this.prisma.user.findMany({
            where: { NOT: { id: userId } },
            select: { id: true, name: true, email: true },
        });
    }
    async getDirectMessages(myId, userId) {
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
    async getChannelAiSummary(channelId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        const messages = await this.prisma.channelMessage.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        messages.reverse();
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
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map