import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../types';
import NotificationBell from './NotificationBell';
import CnkLogo from '../assets/CnkLogo';

interface HeaderProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    onToggleLeftSidebar: () => void;
}

const Header = ({ view, setView, onToggleLeftSidebar }: HeaderProps) => {
    const { t } = useLanguage();

    const PAGE_TITLES: Record<string, string> = {
        'dashboard': 'dashboard', 'customers': 'customerList', 'tasks': 'tasks', 'email': 'emailTitle',
        'appointments': 'appointmentsTitle', 'gorusme-formu': 'interviewFormsTitle', 'teklif-yaz': 'offerManagement',
        'mutabakat': 'reconciliation', 'email-taslaklari': 'emailDrafts', 'yapay-zeka': 'aiHubTitle',
        'raporlar': 'reports', 'personnel': 'personnelManagement', 'konum-takip': 'locationTracking',
        'erp-entegrasyonu': 'erpIntegration', 'hesaplama-araclari': 'calculationTools', 'profile': 'profileTitle',
        'ai-ayarlari': 'aiSettings',
    };
    
    const pageTitleKey = PAGE_TITLES[view.page] || 'dashboard';

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cnk-border-light bg-cnk-panel-light px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button onClick={onToggleLeftSidebar} className="text-2xl text-cnk-txt-muted-light md:hidden">
                    <i className="fas fa-bars"></i>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-xl font-semibold text-cnk-txt-primary-light">{t(pageTitleKey)}</h1>
                </div>
            </div>
            
            <div className="md:hidden">
                <CnkLogo className="h-10"/>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell setView={setView}/>
            </div>
        </header>
    );
};

export default Header;