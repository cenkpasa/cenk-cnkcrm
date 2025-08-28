import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

type UserFormData = Omit<User, 'id'>;

const UserForm = ({ isOpen, onClose, user }: UserFormProps) => {
    const { addUser, updateUser, users } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const getInitialState = (): UserFormData => ({
        username: '', password: '', role: 'user', name: '',
        jobTitle: '', avatar: '', tcNo: '', phone: '', startDate: '',
        employmentStatus: 'Aktif', bloodType: '', licensePlate: '', gender: 'male',
        salary: 0, educationLevel: '', address: '', annualLeaveDays: 14,
        workType: 'full-time', vehicleModel: '', vehicleInitialKm: 0
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
        defaultValues: getInitialState()
    });
    
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        if (isOpen) {
            const defaultValues = getInitialState();
            if (user) {
                const userData = { ...defaultValues, ...user, password: '' };
                reset(userData);
            } else {
                 reset(defaultValues);
            }
            setActiveTab('general');
        }
    }, [user, isOpen, reset]);
    
    const onSubmit: SubmitHandler<UserFormData> = async (data) => {
        if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase() && u.id !== user?.id)) {
            showNotification('usernameInUse', 'error');
            return;
        }
        
        try {
            if(user) {
                const userToUpdate: User = { ...user, ...data };
                if (!data.password) {
                    delete userToUpdate.password;
                }
                await updateUser(userToUpdate);
                showNotification('userUpdated', 'success');
            } else {
                await addUser(data);
                showNotification('userAdded', 'success');
            }
            onClose();
        } catch(err) {
            console.error(err);
            showNotification('genericError', 'error');
        }
    };

    const tabs = [
        { id: 'general', label: t('generalInfo') },
        { id: 'account', label: t('accountAndPermissions') },
        { id: 'vehicle', label: t('vehicleAssignmentInfo') },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user ? t('editPersonnel') : t('addNewPersonnel')}
            size="3xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleSubmit(onSubmit)}>{t('save')}</Button>
                </>
            }
        >
            <div className="border-b border-cnk-border-light mb-4">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium ${activeTab === tab.id ? 'border-b-2 border-cnk-accent-primary text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <Input id="name" label={t('fullName')} {...register('name', { required: true })} />
                        <Input id="tcNo" label="T.C. No" {...register('tcNo')} />
                        <Input id="jobTitle" label={t('jobTitle')} {...register('jobTitle')} />
                         <div>
                            <label htmlFor="employmentStatus" className="mb-2 block text-sm font-semibold">{t('status')}</label>
                            <select id="employmentStatus" {...register('employmentStatus')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="Aktif">{t('active')}</option>
                                <option value="Pasif">{t('passive')}</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="gender" className="mb-2 block text-sm font-semibold">{t('gender')}</label>
                            <select id="gender" {...register('gender')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="male">{t('male')}</option>
                                <option value="female">{t('female')}</option>
                                <option value="other">{t('other')}</option>
                            </select>
                        </div>
                        <Input id="phone" label={t('phone')} {...register('phone')} />
                        <Input id="startDate" label={t('startDate')} type="date" {...register('startDate')} />
                         <div>
                            <label htmlFor="workType" className="mb-2 block text-sm font-semibold">{t('workType')}</label>
                            <select id="workType" {...register('workType')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="full-time">{t('fullTime')}</option>
                                <option value="part-time">{t('partTime')}</option>
                            </select>
                        </div>
                        <Input id="annualLeaveDays" label={t('annualLeaveDays')} type="number" {...register('annualLeaveDays', { valueAsNumber: true })} />
                        <Input id="salary" label={t('salary')} type="number" {...register('salary', { valueAsNumber: true })} />
                        <Input id="bloodType" label={t('bloodType')} {...register('bloodType')} />
                        <Input id="educationLevel" label={t('educationLevel')} {...register('educationLevel')} />
                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="mb-2 block text-sm font-semibold">{t('address')}</label>
                            <textarea id="address" {...register('address')} rows={2} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2"></textarea>
                        </div>
                    </div>
                )}
                {activeTab === 'account' && (
                     <div className="space-y-1">
                        <Input id="username" label={t('username')} {...register('username', { required: true })} />
                        <Input id="password" type="password" label={`${t('password')} (${user ? t('leaveBlankToKeep') : t('required')})`} {...register('password', { required: !user })} />
                        <div>
                            <label htmlFor="role" className="mb-2 block text-sm font-semibold">{t('role')}</label>
                            <select id="role" {...register('role')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                                <option value="user">{t('user')}</option>
                                <option value="admin">{t('admin')}</option>
                            </select>
                        </div>
                    </div>
                )}
                 {activeTab === 'vehicle' && (
                     <div className="space-y-1">
                        <Input id="licensePlate" label={t('licensePlate')} {...register('licensePlate')} />
                        <Input id="vehicleModel" label={t('vehicleModel')} {...register('vehicleModel')} />
                        <Input id="vehicleInitialKm" type="number" label={t('initialKm')} {...register('vehicleInitialKm', { valueAsNumber: true })} />
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default UserForm;