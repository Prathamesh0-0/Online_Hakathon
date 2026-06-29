"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let RecordingsService = class RecordingsService {
    constructor() {
        this.storageDir = path.join(process.cwd(), 'storage', 'recordings');
        this.dbPath = path.join(process.cwd(), 'storage', 'recordings.json');
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify([]));
        }
    }
    getRecordings() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    saveRecordings(recordings) {
        fs.writeFileSync(this.dbPath, JSON.stringify(recordings, null, 2));
    }
    async saveRecording(meetingId, meetingTitle, duration, createdBy, base64Data) {
        const recordings = this.getRecordings();
        const existing = recordings.find(r => r.meetingId === meetingId);
        if (existing) {
            return existing;
        }
        const recordingId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const fileName = `${recordingId}.webm`;
        const filePath = path.join(this.storageDir, fileName);
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        const recording = {
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
    async saveRecordingFromFile(meetingId, meetingTitle, duration, createdBy, file, accessCode) {
        const recordings = this.getRecordings();
        const existing = recordings.find(r => r.meetingId === meetingId);
        if (existing) {
            return existing;
        }
        const recordingId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const fileName = `${recordingId}.webm`;
        const filePath = path.join(this.storageDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        const recording = {
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
    async getAllRecordings() {
        return this.getRecordings();
    }
    async deleteRecording(id) {
        let recordings = this.getRecordings();
        const recording = recordings.find(r => r.id === id);
        if (!recording) {
            throw new common_1.NotFoundException('Recording not found');
        }
        const filePath = path.join(this.storageDir, recording.fileName);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            }
            catch (err) {
                console.error('Failed to delete recording file', err);
            }
        }
        recordings = recordings.filter(r => r.id !== id);
        this.saveRecordings(recordings);
        return { success: true };
    }
    async setAccessCode(id, code) {
        const recordings = this.getRecordings();
        const recording = recordings.find(r => r.id === id);
        if (!recording) {
            throw new common_1.NotFoundException('Recording not found');
        }
        recording.accessCode = code;
        this.saveRecordings(recordings);
        return { success: true, accessCode: code };
    }
    getFilePath(fileName) {
        const filePath = path.join(this.storageDir, fileName);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Recording file not found');
        }
        return filePath;
    }
};
exports.RecordingsService = RecordingsService;
exports.RecordingsService = RecordingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RecordingsService);
//# sourceMappingURL=recordings.service.js.map