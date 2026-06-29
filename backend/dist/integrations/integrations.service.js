"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IntegrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
let IntegrationsService = IntegrationsService_1 = class IntegrationsService {
    constructor() {
        this.logger = new common_1.Logger(IntegrationsService_1.name);
    }
    async sendSlackNotification(message) {
        const url = process.env.SLACK_WEBHOOK_URL;
        if (!url) {
            this.logger.log(`[Mock Slack Notification] Webhook URL not set. Message: {message}`);
            return true;
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message }),
            });
            if (response.ok) {
                this.logger.log('Slack notification sent successfully.');
                return true;
            }
            else {
                this.logger.error(`Slack returned code ${response.status}: ${await response.text()}`);
                return false;
            }
        }
        catch (e) {
            this.logger.error(`Failed to send Slack notification: ${e.message}`);
            return false;
        }
    }
    async createClickUpTask(taskName, taskNotes, listId) {
        const accessToken = process.env.CLICKUP_ACCESS_TOKEN;
        const targetListId = listId || process.env.CLICKUP_LIST_ID;
        if (!accessToken || accessToken.startsWith('pk_57398188_mock') || !targetListId) {
            this.logger.log(`[Mock ClickUp Task] Token or List ID missing/mock. Created Task: ${taskName} on List: ${targetListId}`);
            const mockId = `8623${Math.floor(1000 + Math.random() * 9000)}`;
            return {
                id: mockId,
                url: `https://app.clickup.com/t/${mockId}`,
                name: taskName,
                description: taskNotes
            };
        }
        try {
            const url = `https://api.clickup.com/api/v2/list/${targetListId}/task`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: taskName,
                    description: taskNotes,
                    status: 'to do'
                })
            });
            if (response.ok) {
                const json = await response.json();
                this.logger.log('ClickUp task created successfully.');
                return json;
            }
            else {
                const text = await response.text();
                this.logger.error(`ClickUp returned code ${response.status}: ${text}`);
                return { status: 'error', message: text };
            }
        }
        catch (e) {
            this.logger.error(`Failed to create ClickUp task: ${e.message}`);
            return { status: 'error', message: e.message };
        }
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = IntegrationsService_1 = __decorate([
    (0, common_1.Injectable)()
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map