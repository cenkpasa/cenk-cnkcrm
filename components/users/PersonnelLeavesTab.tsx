import React, { useMemo, useState } from 'react';
import { usePersonnel } from '../../contexts/PersonnelContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LeaveRequest, User } from '../../types';
import Button from '../common/Button';
import DataTable from '../common/DataTable';
import { useNotification } from '../../contexts/NotificationContext';

const PerformanceCard = ({ label, value, color }: { label: string, value: string | number, color: 'blue' | 'orange' | 'green' | 'indigo' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-800',
        orange: 'bg-orange-500/10 text-orange-800',
        green: 'bg-green-500/10 text-green-800',
        indigo: 'bg-indigo-500/10 text-indigo-800',
    };
    return (
        <div className={`${colorClasses[color]} p-4 rounded-lg text-center`}>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

const PersonnelLeavesTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { addLeaveRequest, getLeaveRequestsForUser } = usePersonnel();
    const { showNotification } = useNotification();
    const [leaveType, setLeaveType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    
    const leaveHistory = useMemo(() => getLeaveRequestsForUser(personnel.id), [getLeaveRequestsForUser, personnel.id]);

    const handleLeaveRequest = async () => {
        if (!startDate || !endDate) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        await addLeaveRequest({ userId: personnel.id, type: leaveType, startDate, endDate, reason });
        showNotification('leaveRequestSent', 'success');
        setStartDate('');
        setEndDate('');
        setReason('');
    };

    const usedLeaveDays = useMemo(() => {
        return leaveHistory
            .filter(req => req.status === 'approved')
            .reduce((total, req) => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return total;
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return total + diffDays;
            }, 0);
    }, [leaveHistory]);

    const remainingLeaveDays = (personnel.annualLeaveDays || 14) - usedLeaveDays;

    const getStatusClass = (status: LeaveRequest['status']) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const leaveHistoryColumns = [
        { header: t('date'), accessor: (item: LeaveRequest) => new Date(item.requestDate).toLocaleDateString() },
        { header: "Tür", accessor: (item: LeaveRequest) => item.type },
        { header: "Tarih Aralığı", accessor: (item: LeaveRequest) => `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}` },
        { 
            header: t('status'), 
            accessor: (item: LeaveRequest) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(item.status)}`}>
                    {t(item.status)}
                </span>
            )
        }
    ];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <PerformanceCard label="Yıllık İzin Hakkı" value={personnel.annualLeaveDays || 14} color="blue" />
                <PerformanceCard label={t('usedLeave')} value={usedLeaveDays} color="orange" />
                <PerformanceCard label={t('remainingLeave')} value={remainingLeaveDays} color="green" />
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-lg mb-6 border border-cnk-border-light">
                <h4 className="font-bold text-lg mb-3">Yeni İzin Talebi Oluştur</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium">İzin Tipi</label>
                        <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md">
                            <option>Yıllık İzin</option>
                            <option>Raporlu</option>
                            <option>Ücretsiz İzin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Başlangıç Tarihi</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Bitiş Tarihi</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-sm font-medium">Açıklama (İsteğe Bağlı)</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"></textarea>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleLeaveRequest}>{t('sendRequest')}</Button>
                </div>
            </div>
            
            <h4 className="font-bold text-lg mb-3">İzin Geçmişi</h4>
            <DataTable columns={leaveHistoryColumns} data={[...leaveHistory].reverse()} emptyStateMessage="İzin geçmişi bulunmuyor." />
        </div>
    );
};

export default PersonnelLeavesTab;