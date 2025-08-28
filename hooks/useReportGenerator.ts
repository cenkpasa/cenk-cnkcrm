import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useErp } from '../contexts/ErpContext';
import { User, Invoice, Interview, Customer } from '../types';

export type ReportType = 'sales_performance' | 'customer_activity' | 'offer_summary';

export interface ReportFilters {
    reportType: ReportType;
    dateRange: { start: string, end: string };
    userId?: string;
}

export const useReportGenerator = (filters: ReportFilters) => {
    const { interviews, customers } = useData();
    const { invoices } = useErp();
    const { users } = useAuth();

    const generatedData = useMemo(() => {
        if (!filters.dateRange.start || !filters.dateRange.end) {
            return { columns: [], data: [], summary: {}, title: 'Rapor', chartData: { labels: [], datasets: [] } };
        }

        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        switch (filters.reportType) {
            case 'sales_performance': {
                const filteredInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    const userMatch = !filters.userId || inv.userId === filters.userId;
                    return invDate >= startDate && invDate <= endDate && userMatch;
                });

                const salesByUser = users.map(user => {
                    const userInvoices = filteredInvoices.filter(inv => inv.userId === user.id);
                    const totalSales = userInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                    return {
                        userId: user.id,
                        userName: user.name,
                        invoiceCount: userInvoices.length,
                        totalSales: totalSales,
                    };
                }).filter(u => u.invoiceCount > 0);

                const totalRevenue = salesByUser.reduce((sum, u) => sum + u.totalSales, 0);

                return {
                    title: 'Personel Satış Performansı Raporu',
                    columns: [
                        { header: 'Personel', accessor: (row: any) => row.userName },
                        { header: 'Fatura Adedi', accessor: (row: any) => row.invoiceCount },
                        { header: 'Toplam Satış (TL)', accessor: (row: any) => row.totalSales.toLocaleString('tr-TR') },
                    ],
                    data: salesByUser.sort((a, b) => b.totalSales - a.totalSales),
                    summary: { 'Toplam Ciro': `${totalRevenue.toLocaleString('tr-TR')} TL` },
                    chartData: {
                        labels: salesByUser.map(u => u.userName),
                        datasets: [{
                            label: 'Toplam Satış (TL)',
                            data: salesByUser.map(u => u.totalSales),
                            backgroundColor: '#3b82f6',
                        }]
                    }
                };
            }
            default:
                return { columns: [], data: [], summary: {}, title: 'Rapor', chartData: { labels: [], datasets: [] } };
        }

    }, [filters, invoices, users, interviews, customers]);

    return generatedData;
};