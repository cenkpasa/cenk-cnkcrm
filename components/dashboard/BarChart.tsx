import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportData, ReportFilters } from '../../hooks/useReportData';


const BarChart = () => {
    const { t } = useLanguage();
    const [filters, setFilters] = React.useState<ReportFilters>({
        dateRange: { start: new Date(new Date().setDate(1)).toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) },
    });
    
    const { chartData } = useReportData(filters);

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full min-h-[300px]">
            <h3 className="font-semibold text-cnk-txt-primary-light mb-4">{t('personnelSalesPerformance')}</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData.datasets[0]?.data.map((value, index) => ({ name: chartData.labels[index], Satis: value })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR')} TL`} />
                    <Bar dataKey="Satis" fill="#3b82f6" />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BarChart;