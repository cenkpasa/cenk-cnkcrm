
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Appointment } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { REMINDER_OPTIONS } from '../../constants';

interface AppointmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null | undefined;
    defaultDate?: Date;
}

const formatDate = (date: Date, type: 'date' | 'time') => {
    if (type === 'date') return date.toISOString().slice(0, 10);
    return date.toTimeString().slice(0, 5);
};

type AppointmentFormData = {
    customerId: string;
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: boolean;
    notes: string;
    reminder: string;
}

const AppointmentForm = ({ isOpen, onClose, appointment, defaultDate }: AppointmentFormProps) => {
    const { customers, addAppointment, updateAppointment } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();
    
    const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<AppointmentFormData>();
    const isAllDay = watch('allDay');

    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                const start = new Date(appointment.start);
                const end = new Date(appointment.end);
                reset({
                    customerId: appointment.customerId,
                    title: appointment.title,
                    startDate: formatDate(start, 'date'),
                    startTime: formatDate(start, 'time'),
                    endDate: formatDate(end, 'date'),
                    endTime: formatDate(end, 'time'),
                    allDay: appointment.allDay || false,
                    notes: appointment.notes || '',
                    reminder: appointment.reminder || '15m'
                });
            } else {
                const startDate = defaultDate || new Date();
                const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 mins later
                reset({
                    customerId: '',
                    title: '',
                    startDate: formatDate(startDate, 'date'),
                    startTime: formatDate(startDate, 'time'),
                    endDate: formatDate(endDate, 'date'),
                    endTime: formatDate(endDate, 'time'),
                    allDay: false,
                    notes: '',
                    reminder: '15m'
                });
            }
        }
    }, [appointment, isOpen, defaultDate, reset]);
    
    const onSubmit: SubmitHandler<AppointmentFormData> = async (data) => {
        if (!currentUser) return;

        const startDateTime = new Date(`${data.startDate}T${data.allDay ? '00:00:00' : data.startTime}`);
        const endDateTime = new Date(`${data.endDate}T${data.allDay ? '23:59:59' : data.endTime}`);

        const appointmentData: Omit<Appointment, 'id' | 'createdAt'> = {
            customerId: data.customerId,
            userId: currentUser.id,
            title: data.title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: data.allDay,
            notes: data.notes,
            reminder: data.reminder,
        };

        try {
            if(appointment) {
                await updateAppointment({ ...appointment, ...appointmentData });
                showNotification('appointmentUpdated', 'success');
            } else {
                await addAppointment(appointmentData);
            }
            onClose();
        } catch(error) {
            console.error("Appointment submission error:", error);
            showNotification('genericError', 'error');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={appointment ? t('appointmentEdit') : t('appointmentCreate')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" type="submit" form="appointment-form" isLoading={isSubmitting}>{t('save')}</Button>
                </>
            }
        >
            <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input {...register('title', { required: true })} placeholder={t('addTitle')} containerClassName="!mb-0" className="!text-lg !font-semibold !border-0 !border-b-2 !rounded-none" />
                 <div>
                    <label htmlFor="customerId" className="mb-2 block text-sm font-semibold text-text-dark">{t('selectCustomer')}</label>
                    <select {...register('customerId', { required: true })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-text-dark shadow-sm">
                        <option value="">{t('selectCustomer')}</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-center gap-4">
                    <i className="fas fa-clock text-slate-500"></i>
                    <Input {...register('startDate')} type="date" required containerClassName="!mb-0 flex-grow" />
                    {!isAllDay && <Input {...register('startTime')} type="time" required containerClassName="!mb-0" />}
                    <span>-</span>
                    {!isAllDay && <Input {...register('endTime')} type="time" required containerClassName="!mb-0" />}
                    <Input {...register('endDate')} type="date" required containerClassName="!mb-0 flex-grow" />
                     <label className="flex items-center gap-2 whitespace-nowrap"><input type="checkbox" {...register('allDay')} />{t('allDay')}</label>
                </div>
                 <div className="flex items-center gap-4">
                    <i className="fas fa-bell text-slate-500"></i>
                    <select {...register('reminder')} className="flex-grow rounded-lg border border-slate-300 bg-white px-3 py-2 text-text-dark shadow-sm">
                        {REMINDER_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                    </select>
                </div>
                 <div className="flex items-start gap-4">
                    <i className="fas fa-align-left text-slate-500 mt-2"></i>
                     <textarea {...register('notes')} placeholder={t('addDescription')} rows={3} className="w-full flex-grow rounded-lg border border-slate-300 bg-white px-3 py-2 text-text-dark shadow-sm" />
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentForm;
