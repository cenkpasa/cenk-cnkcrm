import React, { useState } from 'react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import PersonnelLeavesTab from './PersonnelLeavesTab';
import VehicleKmTab from './VehicleKmTab';

const InfoItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
        <p className="text-xs text-cnk-txt-muted-light">{label}</p>
        <p className="font-medium text-cnk-txt-secondary-light">{value ? String(value) : '-'}</p>
    </div>
);

const PersonnelDetail = ({ personnel, onEdit }: { personnel: User, onEdit: () => void }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');

    const tabs = [
        { id: 'info', label: t('personnelInfo') },
        { id: 'leaves', label: t('personnelLeaves') },
        { id: 'vehicle', label: t('vehicleKmTracking') }
    ];

    return (
        <div className="bg-cnk-panel-light rounded-lg shadow-lg">
            {/* Header */}
            <div className="bg-cnk-accent-primary/10 p-6 rounded-t-lg flex items-center space-x-6">
                <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name}&background=random`} alt={personnel.name} className="w-20 h-20 rounded-full border-4 border-cnk-accent-primary/50 object-cover"/>
                <div>
                    <h2 className="text-2xl font-bold text-cnk-txt-primary-light">{personnel.name}</h2>
                    <p className="text-cnk-accent-primary">{personnel.jobTitle || t('user')}</p>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-cnk-border-light px-6">
                <nav className="flex space-x-8 -mb-px">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-cnk-accent-primary text-cnk-accent-primary' : 'border-transparent text-cnk-txt-muted-light hover:text-cnk-txt-secondary-light hover:border-cnk-border-light'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'info' && (
                     <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-cnk-txt-primary-light">{t('generalInfo')}</h3>
                            <Button onClick={onEdit} icon="fas fa-pencil-alt" size="sm">{t('edit')}</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-4">
                                <InfoItem label="T.C No" value={personnel.tcNo} />
                                <InfoItem label={t('fullName')} value={personnel.name} />
                                <InfoItem label={t('jobTitle')} value={personnel.jobTitle} />
                                <InfoItem label={t('email')} value={personnel.username} />
                                <InfoItem label={t('phone')} value={personnel.phone} />
                                <InfoItem label={t('startDate')} value={personnel.startDate} />
                                <InfoItem label={t('workType')} value={personnel.workType} />
                                <InfoItem label={t('status')} value={personnel.employmentStatus} />
                                <InfoItem label={t('bloodType')} value={personnel.bloodType} />
                                <InfoItem label={t('licensePlate')} value={personnel.licensePlate} />
                            </div>
                            <div className="md:col-span-4 flex justify-center md:justify-end mt-4 md:mt-0">
                                <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name}&background=random`} alt={personnel.name} className="w-32 h-32 rounded-full object-cover shadow-md"/>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'leaves' && <PersonnelLeavesTab personnel={personnel} />}
                {activeTab === 'vehicle' && <VehicleKmTab personnel={personnel} />}
            </div>
        </div>
    );
};

export default PersonnelDetail;