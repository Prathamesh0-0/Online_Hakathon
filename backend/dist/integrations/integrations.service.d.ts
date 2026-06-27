export declare class IntegrationsService {
    private readonly logger;
    sendSlackNotification(message: string): Promise<boolean>;
    createJiraIssue(summary: string, description: string, projectKey?: string, issueType?: string): Promise<any>;
    createTrelloCard(cardName: string, cardDesc: string, listId?: string): Promise<any>;
    createClickUpTask(taskName: string, taskNotes: string, listId?: string): Promise<any>;
}
