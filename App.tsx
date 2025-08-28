import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext';
import LoginPage from './pages/LoginPage';
import SidebarLeft from './components/layout/SidebarLeft';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Appointments from './pages/Appointments';
import InterviewFormPage from './pages/InterviewFormPage';
import OfferPage from './pages/OfferPage';
import Users from './pages/Users';
import CalculationToolsPage from './pages/CalculationToolsPage';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import { ViewState } from './types';
import AIHubPage from './pages/AIHubPage';
import LocationTrackingPage from './pages/LocationTrackingPage';
import ErpIntegrationPage from './pages/ErpIntegrationPage';
import Header from './components/layout/Header';
import { useSettings } from './contexts/SettingsContext';
import { runAIAgent } from './services/aiAgentService';
import { useNotificationCenter } from './contexts/NotificationCenterContext';
import AISettingsPage from './pages/AISettingsPage';
import ReportPage from './pages/ReportPage';
import EmailDraftsPage from './pages/EmailDraftsPage';
import ReconciliationPage from './pages/ReconciliationPage';
import TasksPage from './pages/TasksPage';
import EmailPage from './pages/EmailPage';
import { useData } from './contexts/DataContext';
import { useLanguage } from './contexts/LanguageContext';

const PageContent = ({ view, setView }: { view: ViewState; setView: (view: ViewState) => void; }) => {
    switch (view.page) {
        case 'dashboard': return <Dashboard setView={setView} />;
        case 'customers': return <Customers setView={setView} />;
        case 'tasks': return <TasksPage setView={setView} />;
        case 'appointments': return <Appointments />;
        case 'email': return <EmailPage />;
        case 'gorusme-formu': return <InterviewFormPage setView={setView} view={view} />;
        case 'teklif-yaz': return <OfferPage setView={setView} view={view} />;
        case 'mutabakat': return <ReconciliationPage />;
        case 'email-taslaklari': return <EmailDraftsPage setView={setView} />;
        case 'yapay-zeka': return <AIHubPage />;
        case 'raporlar': return <ReportPage />;
        case 'personnel': return <Users />;
        case 'konum-takip': return <LocationTrackingPage />;
        case 'erp-entegrasyonu': return <ErpIntegrationPage />;
        case 'hesaplama-araclari': return <CalculationToolsPage />;
        case 'profile': return <Profile />;
        case 'ai-ayarlari': return <AISettingsPage />;
        default: return <Dashboard setView={setView} />;
    }
};

const App = () => {
    const { currentUser, loading } = useAuth();
    const { NotificationContainer } = useNotification();
    const [view, setView] = useState<ViewState>({ page: 'dashboard' });
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const { settings } = useSettings();
    const { addNotification } = useNotificationCenter();
    const { t } = useLanguage();
    const { appointments, customers } = useData();

    // Proactive AI Agent Runner
    useEffect(() => {
        if (settings) {
            const timer = setTimeout(async () => {
                const insights = await runAIAgent(settings);
                await Promise.all(insights.map(insight => addNotification(insight)));
            }, 5000); // Run agent 5 seconds after app load
            return () => clearTimeout(timer);
        }
    }, [settings, addNotification]);

    // Appointment Reminders
    useEffect(() => {
        const sessionNotified = new Set<string>();

        const checkReminders = () => {
            const now = new Date();
            const notifiedAppointments: string[] = JSON.parse(localStorage.getItem('notifiedAppointments') || '[]');

            appointments.forEach(app => {
                const alreadyNotified = notifiedAppointments.includes(app.id) || sessionNotified.has(app.id);
                if (app.reminder && app.reminder !== 'none' && !alreadyNotified) {
                    const startTime = new Date(app.start);
                    let reminderTime = new Date(startTime);

                    switch (app.reminder) {
                        case '15m': reminderTime.setMinutes(startTime.getMinutes() - 15); break;
                        case '1h': reminderTime.setHours(startTime.getHours() - 1); break;
                        case '1d': reminderTime.setDate(startTime.getDate() - 1); break;
                        default: return;
                    }

                    if (now >= reminderTime && now < startTime) {
                        const customer = customers.find(c => c.id === app.customerId);
                        addNotification({
                            messageKey: 'appointmentReminder',
                            replacements: { 
                                title: app.title, 
                                customer: customer?.name || t('unknownCustomer'),
                                time: startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
                            },
                            type: 'appointment',
                            link: { page: 'appointments' }
                        });
                        
                        sessionNotified.add(app.id);
                        if (!notifiedAppointments.includes(app.id)) {
                            notifiedAppointments.push(app.id);
                            localStorage.setItem('notifiedAppointments', JSON.stringify(notifiedAppointments));
                        }
                    }
                }
            });
        };

        const intervalId = setInterval(checkReminders, 30000); // Check every 30 seconds
        checkReminders(); // Run once on load

        return () => clearInterval(intervalId);
    }, [appointments, customers, addNotification, t]);
    
    useEffect(() => {
        if (!currentUser) {
            setSidebarOpen(false);
        }
    }, [currentUser]);

    if (loading) {
        return <Loader fullScreen={true} />;
    }

    if (!currentUser) {
        return (
            <>
                <NotificationContainer />
                <LoginPage />
            </>
        );
    }
    
    return (
        <div className="grid min-h-screen bg-cnk-bg-light text-cnk-txt-secondary-light md:grid-cols-[260px_1fr]">
            <NotificationContainer />
            <SidebarLeft view={view} setView={setView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex flex-col flex-grow min-w-0">
                <Header 
                    view={view} 
                    onToggleLeftSidebar={() => setSidebarOpen(prev => !prev)}
                    setView={setView}
                />
                <main className="flex-grow overflow-y-auto bg-cnk-bg-light p-4 md:p-6">
                     <div className="min-h-[calc(100vh-120px)]">
                        <PageContent view={view} setView={setView} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;