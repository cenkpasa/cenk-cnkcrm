import React, { useState } from 'react';
import { useReportGenerator, ReportFilters, ReportType } from '../../hooks/useReportGenerator';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Input from '../common/Input';
import DataTable from '../common/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ReportDashboard = () => {
    const { t } = useLanguage();
    const [filters, setFilters] = useState<ReportFilters>({
        reportType: 'sales_performance',
        dateRange: { 
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
            end: new Date().toISOString().slice(0, 10)
        }
    });

    const { columns, data, summary, title, chartData } = useReportGenerator(filters);

    const handleFilterChange = (key: keyof ReportFilters['dateRange'] | 'reportType', value: string) => {
        if (key === 'reportType') {
            setFilters(prev => ({ ...prev, reportType: value as ReportType }));
        } else {
             setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, [key]: value }
            }));
        }
    };
    
    return (
        <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light space-y-6">
            {/* Filter Section */}
            <div className="flex flex-wrap gap-4 items-end p-4 bg-cnk-bg-light rounded-lg">
                <div>
                    <label className="text-sm font-semibold">Rapor Türü</label>
                    <select value={filters.reportType} onChange={e => handleFilterChange('reportType', e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-white">
                        <option value="sales_performance">Satış Performansı</option>
                    </select>
                </div>
                <Input label="Başlangıç Tarihi" type="date" value={filters.dateRange.start} onChange={e => handleFilterChange('start', e.target.value)} />
                <Input label="Bitiş Tarihi" type="date" value={filters.dateRange.end} onChange={e => handleFilterChange('end', e.target.value)} />
            </div>

            {/* Report Content */}
            <div>
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(summary).map(([key, value]) => (
                        <div key={key} className="bg-cnk-bg-light p-4 rounded-lg">
                            <p className="text-sm text-cnk-txt-muted-light">{key}</p>
                            <p className="text-2xl font-bold text-cnk-accent-primary">{String(value)}</p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                {chartData && chartData.labels.length > 0 && (
                    <div className="h-80 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.labels.map((label, index) => ({ name: label, [chartData.datasets[0].label]: chartData.datasets[0].data[index] }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR')} TL`} />
                                <Legend />
                                <Bar dataKey={chartData.datasets[0].label} fill={chartData.datasets[0].backgroundColor} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                
                {/* Data Table */}
                <DataTable columns={columns} data={data} />
            </div>
        </div>
    );
};

export default ReportDashboard;
