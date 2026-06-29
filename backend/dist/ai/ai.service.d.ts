export declare class AiService {
    private readonly logger;
    private readonly sarvamApiKey;
    constructor();
    private callSarvamAi;
    private parseJson;
    generateSpeech(text: string, languageCode?: string): Promise<string>;
    translateText(text: string, sourceLang: string, targetLang?: string): Promise<string>;
    private getLanguageName;
    answerQuestion(meetingTitle: string, transcriptLines: string[], question: string, languageCode?: string): Promise<{
        answer: string;
        diagram?: any;
    }>;
    private getMockQuestionAnswer;
    summarizeMeeting(transcriptLines: string[]): Promise<{
        overview: string;
        keyTakeaways: string[];
        keyDecisions: string[];
        nextSteps: string[];
        productivityScore: number;
    }>;
    extractActionItems(transcriptLines: string[]): Promise<Array<{
        text: string;
        assigneeName?: string;
        dueDate?: string;
    }>>;
    detectRisks(transcriptLines: string[]): Promise<Array<{
        text: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>>;
    summarizeChannel(chatLines: string[], meetingSummaries: string[]): Promise<{
        summary: string;
        keyPoints: string[];
    }>;
    analyzeMeetingAnalytics(transcriptLines: string[]): Promise<{
        duration: number;
        totalWords: number;
        talkTimeDistribution: Record<string, number>;
        sentimentScore: number;
        engagementScore: number;
        speakerSentiment: Record<string, string>;
    }>;
    private getMockSummary;
    private getMockActionItems;
    private getMockRisks;
    private getMockAnalytics;
}
