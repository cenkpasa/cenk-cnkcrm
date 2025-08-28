import React, { useState } from 'react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import PersonnelLeavesTab from './PersonnelLeavesTab';
import VehicleKmTab from './VehicleKmTab';

interface PersonnelDetailProps {
    personnel: User;
    onEdit: () => void;
}

const InfoCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-cnk-bg-light p-4 rounded-lg">
        <h4 className="font-bold text-cnk-txt-secondary-light mb-2">{title}</h4>
        <div className="space-y-1 text-sm">{children}</div>
    </div>
);

const InfoItem = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div className="grid grid-cols-2">
        <span className="text-cnk-txt-muted-light">{label}:</span>
        <span className="font-semibold text-cnk-txt-primary-light">{value || '-'}</span>
    </div>
);

const PersonnelDetail = ({ personnel, onEdit }: PersonnelDetailProps) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');

    const tabs = [
        { id: 'info', labelKey: 'personnelInfo' },
        { id: 'leaves', labelKey: 'personnelLeaves' },
        { id: 'km', labelKey: 'vehicleKmTracking' },
    ];

    return (
        <div className="bg-cnk-panel-light rounded-lg shadow-sm border border-cnk-border-light">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-cnk-border-light">
                <div className="flex items-center">
                    <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name.replace(/\s/g, "+")}&background=random`} alt={personnel.name} className="w-16 h-16 rounded-full mr-4 object-cover"/>
                    <div>
                        <h2 className="text-xl font-bold text-cnk-accent-primary">{personnel.name}</h2>
                        <p className="text-cnk-txt-muted-light">{personnel.jobTitle || t(personnel.role)}</p>
                    </div>
                </div>
                <Button onClick={onEdit} icon="fas fa-edit">{t('editPersonnel')}</Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-cnk-border-light">
                <nav className="flex space-x-4 px-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-cnk-accent-primary text-cnk-accent-primary' : 'border-transparent text-cnk-txt-muted-light hover:text-cnk-txt-secondary-light'}`}>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {activeTab === 'info' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard title={t('contactInfo')}>
                            <InfoItem label={t('phone')} value={personnel.phone} />
                            <InfoItem label={t('email')} value={personnel.username} />
                            <InfoItem label={t('address')} value={personnel.address} />
                        </InfoCard>
                         <InfoCard title={t('workInfo')}>
                            <InfoItem label={t('startDate')} value={personnel.startDate ? new Date(personnel.startDate).toLocaleDateString() : ''} />
                            <InfoItem label={t('workType')} value={personnel.workType ? t(personnel.workType) : ''} />
                            <InfoItem label={t('salary')} value={personnel.salary?.toLocaleString('tr-TR')} />
                        </InfoCard>
                    </div>
                )}
                {activeTab === 'leaves' && <PersonnelLeavesTab userId={personnel.id} />}
                {activeTab === 'km' && <VehicleKmTab userId={personnel.id} />}
            </div>
        </div>
    );
};

export default PersonnelDetail;