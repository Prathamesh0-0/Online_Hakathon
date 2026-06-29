export interface RecordingMetadata {
    id: string;
    meetingId: string;
    meetingTitle: string;
    createdAt: string;
    duration: number;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    createdBy: string;
    accessCode?: string;
}
export declare class RecordingsService {
    private readonly storageDir;
    private readonly dbPath;
    constructor();
    private getRecordings;
    private saveRecordings;
    saveRecording(meetingId: string, meetingTitle: string, duration: number, createdBy: string, base64Data: string): Promise<RecordingMetadata>;
    saveRecordingFromFile(meetingId: string, meetingTitle: string, duration: number, createdBy: string, file: any, accessCode?: string): Promise<RecordingMetadata>;
    getAllRecordings(): Promise<RecordingMetadata[]>;
    deleteRecording(id: string): Promise<{
        success: boolean;
    }>;
    setAccessCode(id: string, code: string): Promise<{
        success: boolean;
        accessCode: string;
    }>;
    getFilePath(fileName: string): string;
}
