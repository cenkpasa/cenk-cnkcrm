import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { User } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { PASSWORD_MIN_LENGTH } from '../constants';

type ProfileFormData = Pick<User, 'name' | 'jobTitle' | 'phone'>;
type PasswordFormData = { oldPassword: string; newPassword: string; confirmNewPassword: string };

const Profile = () => {
    const { currentUser, changePassword, logout, updateUser } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const [activeTab, setActiveTab] = useState('info');
    
    const profileForm = useForm<ProfileFormData>();
    const passwordForm = useForm<PasswordFormData>();

    useEffect(() => {
        if (currentUser) {
            profileForm.reset({
                name: currentUser.name,
                jobTitle: currentUser.jobTitle || '',
                phone: currentUser.phone || '',
            });
        }
    }, [currentUser, profileForm.reset]);

    const handlePasswordChange: SubmitHandler<PasswordFormData> = async (data) => {
        if (!currentUser) return;
        
        if (data.newPassword !== data.confirmNewPassword) {
            passwordForm.setError('confirmNewPassword', { type: 'manual', message: t('passwordsDoNotMatch') });
            return;
        }

        const result = await changePassword(currentUser.id, data.oldPassword, data.newPassword);
        if (result.success) {
            showNotification(result.messageKey, 'success');
            showNotification('passwordChangeRequiresLogin', 'info');
            setTimeout(() => logout(), 2000);
        } else {
            passwordForm.setError('oldPassword', { type: 'manual', message: t(result.messageKey) });
        }
    };

    const handleProfileUpdate: SubmitHandler<ProfileFormData> = async (data) => {
        if (!currentUser) return;
        const result = await updateUser({ ...currentUser, ...data });
        if (result.success) {
            showNotification(result.messageKey, 'success');
            profileForm.reset(data, { keepValues: false, keepDirty: false }); 
        } else {
            showNotification(result.messageKey, 'error');
        }
    };

    if (!currentUser) return null;

    const TabButton = ({ tabId, children }: { tabId: string, children: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tabId
                    ? 'bg-cnk-accent-primary text-white'
                    : 'text-cnk-txt-secondary-light hover:bg-cnk-bg-light'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-6 mb-8">
                <img
                    src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name.replace(/\s/g, "+")}&background=random`}
                    alt={currentUser.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-cnk-border-light"
                />
                <div>
                    <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                    <p className="text-cnk-txt-muted-light">{currentUser.jobTitle}</p>
                </div>
            </div>

            <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
                <div className="flex gap-2 mb-6 border-b border-cnk-border-light pb-4">
                    <TabButton tabId="info">{t('userInfo')}</TabButton>
                    <TabButton tabId="password">{t('changePassword')}</TabButton>
                </div>

                {activeTab === 'info' && (
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                        <Input label={t('fullName')} {...profileForm.register('name', { required: true })} />
                        <Input label={t('jobTitle')} {...profileForm.register('jobTitle')} />
                        <Input label={t('phone')} {...profileForm.register('phone')} />
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={profileForm.formState.isSubmitting}>{t('save')}</Button>
                        </div>
                    </form>
                )}

                {activeTab === 'password' && (
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                        <Input label={t('oldPassword')} type="password" {...passwordForm.register('oldPassword', { required: true })} />
                        {passwordForm.formState.errors.oldPassword && <p className="text-red-500 text-xs">{passwordForm.formState.errors.oldPassword.message}</p>}
                        
                        <Input label={t('newPassword')} type="password" {...passwordForm.register('newPassword', { required: true, minLength: { value: PASSWORD_MIN_LENGTH, message: t('passwordTooShort', { minLength: String(PASSWORD_MIN_LENGTH) }) } })} />
                        {passwordForm.formState.errors.newPassword && <p className="text-red-500 text-xs">{passwordForm.formState.errors.newPassword.message}</p>}

                        <Input label={t('confirmNewPassword')} type="password" {...passwordForm.register('confirmNewPassword', { required: true })} />
                        {passwordForm.formState.errors.confirmNewPassword && <p className="text-red-500 text-xs">{passwordForm.formState.errors.confirmNewPassword.message}</p>}

                        <div className="flex justify-end">
                            <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>{t('changePassword')}</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;