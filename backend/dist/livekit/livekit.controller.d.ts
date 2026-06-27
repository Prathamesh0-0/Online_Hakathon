import { LivekitService } from './livekit.service';
declare class LiveKitTokenDto {
    roomName: string;
    participantName: string;
    participantIdentity?: string;
}
export declare class LivekitController {
    private readonly livekitService;
    constructor(livekitService: LivekitService);
    getLivekitToken(body: LiveKitTokenDto): Promise<{
        token: string;
        url: string;
    }>;
}
export {};
