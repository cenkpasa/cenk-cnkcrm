import { useMemo } from 'react';
import { useErp } from '../contexts/ErpContext';
import { useAuth } from '../contexts/AuthContext';
import { ReportData } from '../types';

export interface ReportFilters {
    dateRange: { start: string, end: string };
    userId?: string;
}

interface GeneratedReport {
    title: string;
    chartData: ReportData;
    kpi: { title: string, value: string }[];
}

export const useReportData = (filters: ReportFilters): GeneratedReport => {
    const { invoices } = useErp();
    const { users } = useAuth();

    const report = useMemo(() => {
        if (!filters.dateRange.start || !filters.dateRange.end) {
            return {
                title: 'Veriler Yükleniyor...',
                chartData: { labels: [], datasets: [] },
                kpi: [],
            };
        }

        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= startDate && invDate <= endDate;
        });

        const salesByUser = users.map(user => {
            const userInvoices = filteredInvoices.filter(inv => inv.userId === user.id);
            const totalSales = userInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
            return {
                userName: user.name,
                totalSales: totalSales,
                invoiceCount: userInvoices.length,
            };
        }).filter(u => u.totalSales > 0);

        const totalRevenue = salesByUser.reduce((sum, u) => sum + u.totalSales, 0);
        const totalInvoices = salesByUser.reduce((sum, u) => sum + u.invoiceCount, 0);

        return {
            title: 'Personel Satış Performansı',
            chartData: {
                labels: salesByUser.map(u => u.userName),
                datasets: [{
                    label: 'Toplam Satış (TL)',
                    data: salesByUser.map(u => u.totalSales),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                }]
            },
            kpi: [
                { title: 'Toplam Ciro', value: `${totalRevenue.toLocaleString('tr-TR')} TL` },
                { title: 'Toplam Fatura', value: totalInvoices.toString() },
                { title: 'Ort. Fatura Değeri', value: `${(totalRevenue / (totalInvoices || 1)).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL` },
            ]
        };

    }, [filters, invoices, users]);

    return report;
};