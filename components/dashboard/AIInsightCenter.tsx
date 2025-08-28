import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotificationCenter } from '../../contexts/NotificationCenterContext';
import { ViewState, Notification } from '../../types';

interface AIInsightCenterProps {
    setView: (view: ViewState) => void;
}

const InsightCard = ({ insight, setView }: { insight: Notification, setView: (view: ViewState) => void }) => {
    const { t } = useLanguage();
    
    const iconMap = { offer: 'fas fa-lightbulb', customer: 'fas fa-exclamation-triangle', system: 'fas fa-cog', appointment: 'fas fa-calendar-check', interview: 'fas fa-comments' };
    const colorMap = { 
        offer: 'border-green-500 bg-green-500/10 text-green-700', 
        customer: 'border-amber-500 bg-amber-500/10 text-amber-700', 
        system: 'border-blue-500 bg-blue-500/10 text-blue-700',
        appointment: 'border-indigo-500 bg-indigo-500/10 text-indigo-700',
        interview: 'border-pink-500 bg-pink-500/10 text-pink-700'
    };
    
    const type = insight.type || 'system';
    const colorClasses = colorMap[type as keyof typeof colorMap] || colorMap['system'];
    const iconClass = iconMap[type as keyof typeof iconMap] || iconMap['system'];

    const handleInsightClick = () => {
        if (insight.link) {
            setView({ page: insight.link.page, id: insight.link.id });
        }
    };
    
    return (
        <div onClick={handleInsightClick} className={`p-3 rounded-lg border-l-4 flex gap-3 items-start cursor-pointer transition-all hover:bg-slate-50 ${colorClasses}`}>
            <div className="flex-shrink-0">
                <i className={`${iconClass} text-lg`}></i>
            </div>
            <div>
                <p className="text-sm font-medium">{t(insight.messageKey, insight.replacements)}</p>
                <button className="text-xs font-semibold hover:underline mt-1">{t('viewDetails')}</button>
            </div>
        </div>
    );
};

const AIInsightCenter = ({ setView }: AIInsightCenterProps) => {
    const { t } = useLanguage();
    const { notifications } = useNotificationCenter();

    // Filter for AI-generated insights. For this app, let's assume they are 'offer' and 'customer' types and unread.
    const insights = notifications.filter(n => (n.type === 'offer' || n.type === 'customer') && !n.isRead).slice(0, 3);

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full">
            <h3 className="font-semibold text-cnk-txt-primary-light mb-4">{t('aiAnalysisCenter')}</h3>
            {insights.length > 0 ? (
                <div className="space-y-3">
                    {insights.map(insight => (
                        <InsightCard key={insight.id} insight={insight} setView={setView} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="text-3xl text-green-500 mb-2">🎉</div>
                    <p className="text-sm text-cnk-txt-muted-light">{t('aiNoInsights')}</p>
                </div>
            )}
        </div>
    );
};

export default AIInsightCenter;