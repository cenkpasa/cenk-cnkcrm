import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { usePersonnel } from '../../contexts/PersonnelContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LeaveRequest } from '../../types';
import Button from '../common/Button';
import DataTable from '../common/DataTable';

interface PersonnelLeavesTabProps {
    userId: string;
}

type LeaveRequestFormData = {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
};

const PersonnelLeavesTab = ({ userId }: PersonnelLeavesTabProps) => {
    const { t } = useLanguage();
    const { getLeaveRequestsForUser, addLeaveRequest } = usePersonnel();
    const { register, handleSubmit, reset } = useForm<LeaveRequestFormData>();

    const userLeaveRequests = getLeaveRequestsForUser(userId);

    const onSubmit: SubmitHandler<LeaveRequestFormData> = async (data) => {
        await addLeaveRequest({ ...data, userId });
        reset();
    };

    const columns = [
        { header: t('leaveType'), accessor: (item: LeaveRequest) => item.type },
        { header: t('startDate'), accessor: (item: LeaveRequest) => new Date(item.startDate).toLocaleDateString() },
        { header: t('endDate'), accessor: (item: LeaveRequest) => new Date(item.endDate).toLocaleDateString() },
        { header: t('status'), accessor: (item: LeaveRequest) => t(item.status) },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-bold mb-2">{t('newLeaveRequest')}</h4>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-cnk-bg-light p-4 rounded-lg">
                    <div>
                        <label htmlFor="type">{t('leaveType')}</label>
                        <input {...register('type', { required: true })} id="type" className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="startDate">{t('startDate')}</label>
                            <input type="date" {...register('startDate', { required: true })} id="startDate" className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="endDate">{t('endDate')}</label>
                            <input type="date" {...register('endDate', { required: true })} id="endDate" className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason">{t('reason')}</label>
                        <textarea {...register('reason', { required: true })} id="reason" rows={3} className="w-full mt-1 p-2 border rounded-md"></textarea>
                    </div>
                    <Button type="submit">{t('sendRequest')}</Button>
                </form>
            </div>
            <div>
                <h4 className="font-bold mb-2">{t('pastLeaveRequests')}</h4>
                <DataTable columns={columns} data={userLeaveRequests} itemsPerPage={5} />
            </div>
        </div>
    );
};

export default PersonnelLeavesTab;