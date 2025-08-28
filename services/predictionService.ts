import { db } from './dbService';
import { Customer, Offer, Interview, Appointment, PredictionInsight } from '../types';

class PredictionService {
    public async getHighWinProbabilityCustomers(): Promise<PredictionInsight[]> {
        const insights: PredictionInsight[] = [];
        const negotiationCustomers = await db.customers.where('stage').equals('negotiation').toArray();
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 14);

        for (const customer of negotiationCustomers) {
            const lastAppointment = await db.appointments.where('customerId').equals(customer.id).last();
            if (lastAppointment && new Date(lastAppointment.start) > recentDate) {
                insights.push({
                    type: 'opportunity',
                    customerId: customer.id,
                    customerName: customer.name,
                    reason: 'Müzakere aşamasında ve son 14 günde randevusu var.',
                    probability: 0.75,
                });
            }
        }
        return insights;
    }

    public async getAtRiskCustomers(atRiskDays: number): Promise<PredictionInsight[]> {
        const insights: PredictionInsight[] = [];
        const atRiskDate = new Date();
        atRiskDate.setDate(atRiskDate.getDate() - atRiskDays);
        
        const activeCustomers = await db.customers.where('status').equals('active').toArray();

        for (const customer of activeCustomers) {
            const [lastOffer, lastInterview, lastAppointment] = await Promise.all([
                 db.offers.where('customerId').equals(customer.id).last(),
                 db.interviews.where('customerId').equals(customer.id).last(),
                 db.appointments.where('customerId').equals(customer.id).last()
            ]);

            const lastContactDate = [
                lastOffer?.createdAt,
                lastInterview?.createdAt,
                lastAppointment?.createdAt,
                customer.createdAt
            ].filter(Boolean).map(d => new Date(d!)).sort((a, b) => b.getTime() - a.getTime())[0];

            if (lastContactDate < atRiskDate) {
                insights.push({
                    type: 'risk',
                    customerId: customer.id,
                    customerName: customer.name,
                    reason: `Son ${atRiskDays} gündür etkileşim kurulmadı.`,
                    probability: 0.40,
                });
            }
        }
        return insights;
    }
}

export const predictionService = new PredictionService();