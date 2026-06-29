import { RecordingsService } from './recordings.service';
import { Response } from 'express';
export declare class RecordingsController {
    private readonly recordingsService;
    constructor(recordingsService: RecordingsService);
    saveRecording(req: any, file: any, body: {
        meetingId: string;
        meetingTitle: string;
        duration: string;
        createdBy?: string;
        accessCode?: string;
    }): Promise<import("./recordings.service").RecordingMetadata>;
    getRecordings(): Promise<import("./recordings.service").RecordingMetadata[]>;
    getRecordingFile(filename: string, res: Response): Promise<void>;
    deleteRecording(id: string): Promise<{
        success: boolean;
    }>;
    setAccessCode(id: string, body: {
        code: string;
    }): Promise<{
        success: boolean;
        accessCode: string;
    }>;
}
