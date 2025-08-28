import { db } from './dbService';
import { Offer, Customer, EmailDraft, AISettings } from '../types';
import { type NewNotificationData } from '../contexts/NotificationCenterContext';
import { generateFollowUpEmail } from './aiService';
import { predictionService } from './predictionService';
import { v4 as uuidv4 } from 'uuid';

export type Insight = NewNotificationData;

/**
 * Finds opportunities to follow up on old offers and creates draft emails.
 */
const findFollowUpOpportunitiesAndAct = async (settings: AISettings): Promise<Insight[]> => {
    if (!settings.enableFollowUpDrafts) return [];

    const insights: Insight[] = [];
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() - settings.followUpDays);

    const offersToFollowUp = await db.offers
        .where('createdAt').below(followUpDate.toISOString())
        .toArray();

    for (const offer of offersToFollowUp) {
        const existingDraft = await db.emailDrafts.where('relatedObjectId').equals(offer.id).first();
        if (existingDraft) continue;
        
        const customer = await db.customers.get(offer.customerId);
        if (!customer || !customer.email) continue;
        
        const emailResult = await generateFollowUpEmail(offer, customer);
        
        if (emailResult.success) {
            const newDraft: EmailDraft = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                recipientEmail: customer.email,
                recipientName: customer.name,
                subject: `${offer.teklifNo} Numaralı Teklifimiz Hakkında`,
                body: emailResult.text,
                status: 'draft',
                relatedObjectType: 'offer',
                relatedObjectId: offer.id,
                generatedBy: 'ai_agent'
            };
            await db.emailDrafts.add(newDraft);

            insights.push({
                messageKey: 'aiInsightFollowUpWithDraft',
                replacements: { teklifNo: offer.teklifNo, customerName: customer.name },
                type: 'offer',
                link: { page: 'email-taslaklari', id: newDraft.id }
            });
        }
    }
    return insights;
};

/**
 * Finds customers who haven't been contacted recently and flags them as at risk.
 */
const findAtRiskCustomersAndAlert = async (settings: AISettings): Promise<Insight[]> => {
    if (!settings.enableAtRiskAlerts) return [];
    
    const atRiskInsights = await predictionService.getAtRiskCustomers(settings.atRiskDays);
    
    return atRiskInsights.map(insight => ({
        messageKey: 'aiInsightAtRiskCustomer',
        replacements: { customerName: insight.customerName, days: String(settings.atRiskDays) },
        type: 'customer',
        link: { page: 'customers', id: insight.customerId }
    }));
};

/**
 * Main entry point for the proactive AI agent.
 */
export const runAIAgent = async (settings: AISettings | null): Promise<Insight[]> => {
    if (!settings || !settings.isAgentActive) {
        console.log("🤖 Proaktif AI Ajanı pasif durumda.");
        return [];
    }
    
    console.log("🤖 Proaktif AI Ajanı analizleri başlatıyor...");
    
    const [
        followUpActions,
        atRiskAlerts
    ] = await Promise.all([
        findFollowUpOpportunitiesAndAct(settings),
        findAtRiskCustomersAndAlert(settings)
    ]);

    const allInsights = [...followUpActions, ...atRiskAlerts];
    console.log(`🤖 Analiz tamamlandı. ${allInsights.length} adet EYLEM/İÇGÖRÜ üretildi.`);
    return allInsights;
};