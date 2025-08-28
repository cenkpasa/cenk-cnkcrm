

import React from 'react';
import ReportDashboard from '../components/reports/ReportDashboard';
import PredictiveInsights from '../components/reports/PredictiveInsights';
import { useLanguage } from '../contexts/LanguageContext';

const ReportPage = () => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            <ReportDashboard />
            <div className="mt-8 bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
                <h2 className="text-xl font-bold mb-4">Tahminsel Analizler</h2>
                <PredictiveInsights />
            </div>
        </div>
    );
};

export default ReportPage;