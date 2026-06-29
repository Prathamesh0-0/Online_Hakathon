export declare class IntegrationsService {
    private readonly logger;
    sendSlackNotification(message: string): Promise<boolean>;
    createClickUpTask(taskName: string, taskNotes: string, listId?: string): Promise<any>;
}
