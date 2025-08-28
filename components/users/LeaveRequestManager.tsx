import React from 'react';
import { usePersonnel } from '../../contexts/PersonnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import { LeaveRequest } from '../../types';

const LeaveRequestManager = () => {
    const { leaveRequests, updateLeaveRequestStatus } = usePersonnel();
    const { users } = useAuth();
    const { t } = useLanguage();

    const pendingRequests = leaveRequests.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) {
        return null; // Don't render if there are no pending requests
    }

    return (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">{t('leaveRequestManagement')}</h3>
            <div className="space-y-2">
                {pendingRequests.map(req => {
                    const user = users.find(u => u.id === req.userId);
                    return (
                        <div key={req.id} className="flex flex-wrap items-center justify-between bg-white p-2 rounded-md">
                            <div>
                                <span className="font-semibold">{user?.name}</span>
                                <span className="text-sm text-gray-600 mx-2">- {req.type}</span>
                                <span className="text-sm text-gray-500">({new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()})</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="success" onClick={() => updateLeaveRequestStatus(req.id, 'approved')}>{t('approve')}</Button>
                                <Button size="sm" variant="danger" onClick={() => updateLeaveRequestStatus(req.id, 'rejected')}>{t('reject')}</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LeaveRequestManager;