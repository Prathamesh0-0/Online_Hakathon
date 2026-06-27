import { TeamsService } from './teams.service';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    getTeams(req: any): Promise<({
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
    createTeam(req: any, body: {
        name: string;
    }): Promise<{
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
    joinTeam(req: any, id: string): Promise<{
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
    createChannel(id: string, body: {
        name: string;
        description?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        teamId: string;
    }>;
    getChannels(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string | null;
        teamId: string;
    }[]>;
    getChannelMessages(id: string): Promise<{
        id: string;
        createdAt: Date;
        text: string;
        channelId: string;
        senderId: string;
        senderName: string;
    }[]>;
    getAllUsers(req: any): Promise<{
        id: string;
        email: string;
        name: string;
    }[]>;
    getDirectMessages(req: any, otherUserId: string): Promise<({
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
    getChannelAiSummary(id: string): Promise<{
        summary: string;
        keyPoints: string[];
    }>;
}
