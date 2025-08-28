import { db } from './dbService';
import { SalesFunnelStage, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { type NewNotificationData } from '../contexts/NotificationCenterContext';
import { DataContextType } from '../contexts/DataContext';

interface AutomationResult {
    notifications: NewNotificationData[];
}

class AutomationService {
    private dataContext: DataContextType | null = null;

    public setDataContext(context: DataContextType): void {
        this.dataContext = context;
    }

    public async runAutomationsForStageChange(customerId: string, newStage: SalesFunnelStage, currentUserId: string): Promise<AutomationResult> {
        const results: AutomationResult = { notifications: [] };
        if (!this.dataContext) return results;

        const customer = await db.customers.get(customerId);
        if (!customer) return results;

        if (newStage === 'proposal') {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 3);

            const newTaskData: Omit<Task, 'id' | 'createdAt'> = {
                title: `${customer.name} için Teklif Takibi`,
                description: `${customer.name} firmasına gönderilen teklifin 3 gün içinde takibini yap.`,
                status: 'pending',
                dueDate: dueDate.toISOString().slice(0, 10),
                assignedTo: currentUserId,
                createdBy: 'system-automation',
                customerId: customerId,
            };
            
            await this.dataContext.addTask(newTaskData);
            
            results.notifications.push({
                messageKey: 'automationTaskCreated',
                replacements: { customerName: customer.name },
                type: 'system',
                link: { page: 'tasks' }
            });
        }
        
        return results;
    }
}

export const automationService = new AutomationService();