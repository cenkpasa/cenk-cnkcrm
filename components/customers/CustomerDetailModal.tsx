import React, { useState } from 'react';
import { Customer, Task, ViewState } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ActivityTimeline from './ActivityTimeline';
import { useData } from '../../contexts/DataContext';
import TaskForm from '../forms/TaskForm';
import DataTable from '../common/DataTable';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer;
    onEdit: (customer: Customer) => void;
    setView: (view: ViewState) => void;
}

const InfoItem = ({ label, value }: { label: string, value?: string }) => (
    <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-cnk-txt-primary-light">{value || '-'}</p>
    </div>
);

const CustomerTasksTab = ({ customerId }: { customerId: string }) => {
    const { t } = useLanguage();
    const { tasks, updateTask } = useData();
    const { users } = useAuth();
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

    const customerTasks = tasks.filter(task => task.customerId === customerId);

    const columns = [
        { 
            header: t('status'), 
            accessor: (item: Task) => (<input type="checkbox" checked={item.status === 'completed'} onChange={() => updateTask({ ...item, status: item.status === 'pending' ? 'completed' : 'pending' })} className="h-4 w-4 rounded text-cnk-accent-primary focus:ring-cnk-accent-primary" />)
        },
        { header: t('taskTitle'), accessor: (item: Task) => <span className={`${item.status === 'completed' ? 'line-through text-cnk-txt-muted-light' : ''}`}>{item.title}</span> },
        { header: t('assignedTo'), accessor: (item: Task) => users.find(u => u.id === item.assignedTo)?.name || '-' },
        { header: t('dueDate'), accessor: (item: Task) => new Date(item.dueDate).toLocaleDateString() },
    ];
    
    return (
        <div>
            {isTaskFormOpen && <TaskForm isOpen={isTaskFormOpen} onClose={() => setIsTaskFormOpen(false)} task={null} defaultCustomerId={customerId} />}
            <div className="flex justify-between items-center mb-2">
                 <h4 className="text-lg font-semibold">{t('tasksForCustomer', { customerName: '' })}</h4>
                <Button size="sm" onClick={() => setIsTaskFormOpen(true)} icon="fas fa-plus">{t('addNewTask')}</Button>
            </div>
            <DataTable columns={columns} data={customerTasks} emptyStateMessage={t('noTasksYet')} itemsPerPage={5} />
        </div>
    );
};


const CustomerDetailModal = ({ isOpen, onClose, customer, onEdit, setView }: CustomerDetailModalProps) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');

    const handleCreateAppointment = () => {
        onClose();
        setView({ page: 'appointments' });
    };

    const tabs = [
        { id: 'info', label: t('generalInfo')},
        { id: 'activity', label: t('activityTimeline')},
        { id: 'tasks', label: t('tasks')}
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('customerDetail')} size="4xl">
            <div className="flex items-center gap-4 p-4 border-b">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    {customer.name.charAt(0)}
                </div>
                <div>
                    <h3 className="text-xl font-bold">{customer.name}</h3>
                    <p className="text-sm text-slate-500">{customer.commercialTitle}</p>
                </div>
            </div>

            <div className="border-b">
                 <nav className="flex space-x-4 px-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-cnk-accent-primary text-cnk-accent-primary' : 'border-transparent text-cnk-txt-muted-light hover:text-cnk-txt-secondary-light'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 min-h-[300px]">
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <InfoItem label={t('email')} value={customer.email} />
                            <InfoItem label={t('phone')} value={customer.phone1} />
                            <InfoItem label={t('address')} value={customer.address} />
                            <InfoItem label={t('taxOffice')} value={customer.taxOffice} />
                            <InfoItem label={t('taxNumber')} value={customer.taxNumber} />
                        </div>
                        <div className="border-t pt-4 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => onEdit(customer)} icon="fas fa-edit">{t('edit')}</Button>
                            <Button size="sm" variant="secondary" onClick={handleCreateAppointment} icon="fas fa-calendar-plus">{t('addAppointment')}</Button>
                        </div>
                    </div>
                )}
                {activeTab === 'activity' && <ActivityTimeline customerId={customer.id} />}
                {activeTab === 'tasks' && <CustomerTasksTab customerId={customer.id} />}
            </div>
        </Modal>
    );
};

export default CustomerDetailModal;