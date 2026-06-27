export declare class LivekitService {
    private readonly logger;
    private readonly apiKey;
    private readonly apiSecret;
    private readonly livekitUrl;
    private readonly roomService;
    constructor();
    generateAccessToken(roomName: string, participantName: string, participantIdentity?: string): Promise<string>;
    getLivekitUrl(): string;
}
