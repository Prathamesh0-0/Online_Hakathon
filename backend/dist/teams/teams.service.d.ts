import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
export declare class TeamsService {
    private prisma;
    private aiService;
    constructor(prisma: PrismaService, aiService: AiService);
    getTeams(userId: string): Promise<({
        channels: {
            id: string;
            name: string;
            createdAt: Date;
            description: string | null;
            teamId: string;
        }[];
        members: {
            id: string;
            email: string;
            name: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
    })[]>;
    createTeam(userId: string, name: string): Promise<{
        channels: {
            id: string;
            name: string;
            createdAt: Date;
            description: string | null;
            teamId: string;
        }[];
        members: {
            id: string;
            email: string;
            name: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
    }>;
    joinTeam(userId: string, teamId: string): Promise<{
        channels: {
            id: string;
            name: string;
            createdAt: Date;
            description: string | null;
            teamId: string;
        }[];
        members: {
            id: string;
            email: string;
            name: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
    }>;
    createChannel(teamId: string, name: string, description?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        teamId: string;
    }>;
    getChannels(teamId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        teamId: string;
    }[]>;
    getChannelMessages(channelId: string): Promise<{
        id: string;
        createdAt: Date;
        text: string;
        channelId: string;
        senderId: string;
        senderName: string;
    }[]>;
    getAllUsers(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
    }[]>;
    getDirectMessages(myId: string, userId: string): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        text: string;
        senderId: string;
        receiverId: string;
    })[]>;
    getChannelAiSummary(channelId: string): Promise<{
        summary: string;
        keyPoints: string[];
    }>;
}
