import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

@Injectable()
export class RecordingsService {
  private readonly storageDir = path.join(process.cwd(), 'storage', 'recordings');
  private readonly dbPath = path.join(process.cwd(), 'storage', 'recordings.json');

  constructor() {
    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    // Initialize JSON database if it doesn't exist
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([]));
    }
  }

  private getRecordings(): RecordingMetadata[] {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveRecordings(recordings: RecordingMetadata[]) {
    fs.writeFileSync(this.dbPath, JSON.stringify(recordings, null, 2));
  }

  async saveRecording(
    meetingId: string,
    meetingTitle: string,
    duration: number,
    createdBy: string,
    base64Data: string
  ): Promise<RecordingMetadata> {
    const recordings = this.getRecordings();

    // Prevent duplicate recordings for the same meeting
    const existing = recordings.find(r => r.meetingId === meetingId);
    if (existing) {
      return existing;
    }

    const recordingId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fileName = `${recordingId}.webm`;
    const filePath = path.join(this.storageDir, fileName);

    // Write file to disk
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const recording: RecordingMetadata = {
      id: recordingId,
      meetingId,
      meetingTitle,
      createdAt: new Date().toISOString(),
      duration,
      fileUrl: `http://localhost:5000/recordings/file/${fileName}`,
      fileName,
      fileSize: buffer.length,
      createdBy,
    };

    recordings.unshift(recording);
    this.saveRecordings(recordings);

    return recording;
  }

  async saveRecordingFromFile(
    meetingId: string,
    meetingTitle: string,
    duration: number,
    createdBy: string,
    file: any,
    accessCode?: string
  ): Promise<RecordingMetadata> {
    const recordings = this.getRecordings();

    // Prevent duplicate recordings for the same meeting
    const existing = recordings.find(r => r.meetingId === meetingId);
    if (existing) {
      return existing;
    }

    const recordingId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fileName = `${recordingId}.webm`;
    const filePath = path.join(this.storageDir, fileName);

    // Write file buffer to disk
    fs.writeFileSync(filePath, file.buffer);

    const recording: RecordingMetadata = {
      id: recordingId,
      meetingId,
      meetingTitle,
      createdAt: new Date().toISOString(),
      duration,
      fileUrl: `http://localhost:5000/recordings/file/${fileName}`,
      fileName,
      fileSize: file.buffer.length,
      createdBy,
      accessCode: accessCode || undefined
    };

    recordings.unshift(recording);
    this.saveRecordings(recordings);

    return recording;
  }

  async getAllRecordings(): Promise<RecordingMetadata[]> {
    return this.getRecordings();
  }

  async deleteRecording(id: string): Promise<{ success: boolean }> {
    let recordings = this.getRecordings();
    const recording = recordings.find(r => r.id === id);
    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    // Delete file
    const filePath = path.join(this.storageDir, recording.fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete recording file', err);
      }
    }

    // Update metadata
    recordings = recordings.filter(r => r.id !== id);
    this.saveRecordings(recordings);

    return { success: true };
  }

  async setAccessCode(id: string, code: string): Promise<{ success: boolean; accessCode: string }> {
    const recordings = this.getRecordings();
    const recording = recordings.find(r => r.id === id);
    if (!recording) {
      throw new NotFoundException('Recording not found');
    }
    recording.accessCode = code;
    this.saveRecordings(recordings);
    return { success: true, accessCode: code };
  }

  getFilePath(fileName: string): string {
    const filePath = path.join(this.storageDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Recording file not found');
    }
    return filePath;
  }
}
