
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Task } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    defaultCustomerId?: string;
}

type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'createdBy'>;

const TaskForm = ({ isOpen, onClose, task, defaultCustomerId }: TaskFormProps) => {
    const { addTask, updateTask, customers } = useData();
    const { users, currentUser } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>();

    useEffect(() => {
        // Modal her açıldığında veya düzenlenecek görev değiştiğinde formu doğru değerlerle doldur.
        if (isOpen) {
            if (task) {
                reset({
                    title: task.title,
                    description: task.description || '',
                    status: task.status,
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
                    assignedTo: task.assignedTo,
                    customerId: task.customerId || '',
                });
            } else {
                reset({
                    title: '',
                    description: '',
                    status: 'pending',
                    dueDate: new Date().toISOString().slice(0, 10),
                    assignedTo: currentUser?.id || '',
                    customerId: defaultCustomerId || '',
                });
            }
        }
    }, [task, isOpen, reset, currentUser, defaultCustomerId]);

    const onSubmit: SubmitHandler<TaskFormData> = async (data) => {
        if (!currentUser) return;
        
        try {
            if (task) {
                await updateTask({ ...task, ...data });
                showNotification('taskUpdated', 'success');
            } else {
                await addTask({ ...data, createdBy: currentUser.id });
                // 'taskAdded' bildirimi zaten DataContext içinde tetikleniyor.
            }
            onClose();
        } catch (error) {
            console.error("Task submission error:", error);
            showNotification('genericError', 'error');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task ? t('editTask') : t('addNewTask')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" type="submit" form="task-form" isLoading={isSubmitting}>{t('save')}</Button>
                </>
            }
        >
            <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label={t('taskTitle')} {...register('title', { required: true })} />
                {errors.title && <p className="text-red-500 text-xs">{t('fieldsRequired')}</p>}

                <div>
                    <label className="mb-2 block text-sm font-semibold">{t('description')}</label>
                    <textarea {...register('description')} rows={4} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('dueDate')} type="date" {...register('dueDate', { required: true })} />
                    
                    <div>
                        <label className="mb-2 block text-sm font-semibold">{t('status')}</label>
                        <select {...register('status')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                            <option value="pending">{t('pending')}</option>
                            <option value="completed">{t('completed')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="mb-2 block text-sm font-semibold">{t('assignedTo')}</label>
                        <select {...register('assignedTo', { required: true })} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="mb-2 block text-sm font-semibold">{t('customer')}</label>
                        <select {...register('customerId')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                            <option value="">-</option>
                            {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                        </select>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default TaskForm;
