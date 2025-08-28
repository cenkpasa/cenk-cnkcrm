import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Appointment } from '../types';
import Button from '../components/common/Button';
import AppointmentForm from '../components/forms/AppointmentForm';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

type ViewMode = 'day' | 'week' | 'month';

const Appointments = () => {
    const { t, language } = useLanguage();
    const { appointments, customers, deleteAppointment } = useData();
    const { showNotification } = useNotification();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [defaultDate, setDefaultDate] = useState<Date | undefined>();

    if (!appointments || !customers) return <Loader fullScreen />;

    const handleOpenForm = (appointment?: Appointment | null, date?: Date) => {
        setSelectedAppointment(appointment || null);
        setDefaultDate(date);
        setIsFormOpen(true);
    };
    
    const openDeleteConfirm = (appointmentId: string) => {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
            setSelectedAppointment(appointment);
            setIsConfirmDeleteOpen(true);
        }
    };

    const handleDelete = async () => {
        if (selectedAppointment) {
            await deleteAppointment(selectedAppointment.id);
            showNotification('appointmentDeleted', 'success');
        }
        setIsConfirmDeleteOpen(false);
        setSelectedAppointment(null);
    };
    
    const Header = () => (
        <div className="p-2 border-b border-cnk-border-light flex flex-wrap justify-between items-center gap-2 bg-cnk-panel-light">
            <div className="flex items-center gap-2">
                <Button variant="primary" onClick={() => handleOpenForm(null, new Date())} icon="fas fa-plus">{t('appointmentCreate')}</Button>
                <span className="border-l border-cnk-border-light h-8 mx-2"></span>
                <Button size="sm" variant="secondary" onClick={() => setCurrentDate(new Date())}>{t('today')}</Button>
                <Button size="sm" variant="secondary" icon="fas fa-chevron-left" onClick={() => navigateDate(-1)}/>
                <Button size="sm" variant="secondary" icon="fas fa-chevron-right" onClick={() => navigateDate(1)}/>
                <h2 className="text-lg font-semibold text-cnk-txt-primary-light">{currentDate.toLocaleDateString(language, { year: 'numeric', month: 'long' })}</h2>
            </div>
            <div className="flex items-center gap-1 bg-cnk-bg-light p-1 rounded-lg border border-cnk-border-light">
                {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                    <Button key={v} size="sm" variant={viewMode === v ? 'primary' : 'secondary'} className={viewMode === v ? '' : '!bg-transparent shadow-none border-none'} onClick={() => setViewMode(v)}>
                        {t(v)}
                    </Button>
                ))}
            </div>
        </div>
    );

    const navigateDate = (direction: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + direction);
        else if (viewMode === 'week') newDate.setDate(currentDate.getDate() + (7 * direction));
        else newDate.setDate(currentDate.getDate() + direction);
        setCurrentDate(newDate);
    };
    
    const MonthView = () => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Monday is 0
        const calendarStartDate = new Date(firstDayOfMonth);
        calendarStartDate.setDate(calendarStartDate.getDate() - firstDayOfWeek);
        
        const days = Array.from({ length: 42 }, (_, i) => {
            const day = new Date(calendarStartDate);
            day.setDate(day.getDate() + i);
            return day;
        });

        return (
            <div className="flex-grow grid grid-cols-7 grid-rows-6">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                    <div key={day} className="text-center font-bold p-2 border-b border-r border-cnk-border-light text-cnk-txt-muted-light">{day}</div>
                ))}
                {days.map(day => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const dayAppointments = appointments.filter(app => new Date(app.start).toDateString() === day.toDateString());

                    return (
                        <div key={day.toISOString()} className={`border-b border-r border-cnk-border-light p-1 overflow-y-auto ${isCurrentMonth ? '' : 'bg-slate-50'}`} onClick={() => handleOpenForm(null, day)}>
                            <p className={`text-sm text-right ${isToday ? 'font-bold text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>{day.getDate()}</p>
                            <div className="space-y-1">
                                {dayAppointments.map(app => (
                                    <div key={app.id} onClick={(e) => { e.stopPropagation(); handleOpenForm(app)}} className="bg-cnk-accent-primary/80 text-white rounded p-1 text-xs cursor-pointer truncate">
                                        {app.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col flex-grow border border-cnk-border-light rounded-xl overflow-hidden shadow-lg bg-cnk-panel-light">
                <Header />
                {viewMode === 'month' && <MonthView />}
            </div>

            <AppointmentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} appointment={selectedAppointment} defaultDate={defaultDate} />
            
            <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title={t('deleteAppointmentConfirm')} footer={
                <><Button variant="secondary" onClick={() => setIsConfirmDeleteOpen(false)}>{t('cancel')}</Button><Button variant="danger" onClick={handleDelete}>{t('delete')}</Button></>
            }>
                <p>{t('deleteConfirmation')}</p>
            </Modal>
        </div>
    );
};

export default Appointments;