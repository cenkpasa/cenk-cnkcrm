import React, { useState, useEffect } from 'react';
import { PredictionInsight } from '../../types';
import { predictionService } from '../../services/predictionService';
import { useLanguage } from '../../contexts/LanguageContext';
import Loader from '../common/Loader';

const InsightCard = ({ insight }: { insight: PredictionInsight }) => {
    const isOpportunity = insight.type === 'opportunity';
    const colorClasses = isOpportunity ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50';
    const iconClass = isOpportunity ? 'fas fa-arrow-trend-up text-green-500' : 'fas fa-arrow-trend-down text-amber-500';

    return (
        <div className={`p-4 rounded-lg border-l-4 ${colorClasses}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <i className={`${iconClass} text-xl`}></i>
                </div>
                <div>
                    <p className="font-semibold">{insight.customerName}</p>
                    <p className="text-sm text-gray-600">{insight.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">Olasılık: {Math.round(insight.probability * 100)}%</p>
                </div>
            </div>
        </div>
    );
};


const PredictiveInsights = () => {
    const { t } = useLanguage();
    const [opportunities, setOpportunities] = useState<PredictionInsight[]>([]);
    const [risks, setRisks] = useState<PredictionInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            const [opps, risks] = await Promise.all([
                predictionService.getHighWinProbabilityCustomers(),
                predictionService.getAtRiskCustomers(30) // Using a default of 30 days
            ]);
            setOpportunities(opps);
            setRisks(risks);
            setIsLoading(false);
        };
        fetchInsights();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600">{t('highWinProbability')}</h3>
                <div className="space-y-4">
                    {opportunities.length > 0 ? (
                        opportunities.map(insight => <InsightCard key={insight.customerId} insight={insight} />)
                    ) : (
                        <p className="text-sm text-gray-500">Analiz edilecek bir fırsat bulunamadı.</p>
                    )}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3 text-amber-600">{t('atRiskCustomers')}</h3>
                <div className="space-y-4">
                     {risks.length > 0 ? (
                        risks.map(insight => <InsightCard key={insight.customerId} insight={insight} />)
                    ) : (
                        <p className="text-sm text-gray-500">Risk altında müşteri bulunamadı.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictiveInsights;
