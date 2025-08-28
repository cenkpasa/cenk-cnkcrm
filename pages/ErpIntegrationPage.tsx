import React, { useState, useMemo } from 'react';
import { useErp } from '../contexts/ErpContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, ErpSettings, StockItem, Invoice, Customer, Offer } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';

const TargetEditModal = ({ isOpen, onClose, user, onSave }: { isOpen: boolean, onClose: () => void, user: User, onSave: (target: number) => void }) => {
    const { t } = useLanguage();
    const [target, setTarget] = useState(user.salesTarget?.toString() || '');

    const handleSave = () => {
        onSave(parseFloat(target) || 0);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('salesTargetFor', { name: user.name })} footer={
            <>
                <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave}>{t('save')}</Button>
            </>
        }>
            <Input
                label={t('targetAmount')}
                id="salesTarget"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
            />
        </Modal>
    );
};

const SyncCard = ({ title, descriptionKey, lastSync, type, onSync, isSyncing, isConnected, viewAction } : { title: string, descriptionKey: string, lastSync?: string, type: 'customers' | 'offers' | 'stock' | 'invoices', onSync: (type: any) => void, isSyncing: string | null, isConnected: boolean, viewAction?: () => void }) => {
    const { t } = useLanguage();
    const syncKeyMap = {
        customers: 'syncCustomers',
        offers: 'syncOffers',
        stock: 'syncStock',
        invoices: 'syncInvoices',
    };
    return (
        <div className="flex flex-col justify-between p-4 bg-cnk-bg-light rounded-lg border border-cnk-border-light">
            <div>
                <h3 className="font-semibold text-lg text-cnk-txt-secondary-light">{title}</h3>
                <p className="text-xs text-cnk-txt-muted-light mt-1 mb-2 h-8">{t(descriptionKey)}</p>
                <p className="text-xs text-cnk-txt-muted-light/50">Son Senk: {lastSync ? new Date(lastSync).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="flex gap-2 mt-3">
                <Button onClick={() => onSync(type)} isLoading={isSyncing === type} disabled={!isConnected || isSyncing !== null} className="w-full">{t(syncKeyMap[type])}</Button>
                {viewAction && <Button onClick={viewAction} variant="secondary" icon="fas fa-eye" className="w-auto"/>}
            </div>
        </div>
    );
};

const ErpIntegrationPage = () => {
    const { t } = useLanguage();
    const { erpSettings, updateErpSettings, syncStock, syncInvoices, syncCustomers, syncOffers, stockItems, invoices } = useErp();
    const { customers, offers } = useData();
    const { users, updateUser } = useAuth();
    const { showNotification } = useNotification();

    const [settings, setSettings] = useState<ErpSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState<null | 'stock' | 'invoices' | 'customers' | 'offers'>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('connection');

    React.useEffect(() => {
        if (erpSettings) {
            setSettings(erpSettings);
        }
    }, [erpSettings]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (settings) {
            setSettings({ ...settings, [e.target.id]: e.target.value });
        }
    };

    const handleToggleConnection = async () => {
        if (!settings) return;
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 1000));
        await updateErpSettings({ ...settings, isConnected: !settings.isConnected });
        setIsLoading(false);
    };

    const handleSync = async (type: 'stock' | 'invoices' | 'customers' | 'offers') => {
        setIsSyncing(type);
        let count = 0;
        let typeKey = '';
        
        switch(type) {
            case 'stock': count = await syncStock(); typeKey = t('stockStatus'); break;
            case 'invoices': count = await syncInvoices(); typeKey = t('salesInvoicesTitle'); break;
            case 'customers': count = await syncCustomers(); typeKey = t('customerList'); break;
            case 'offers': count = await syncOffers(); typeKey = t('offerManagement'); break;
        }

        showNotification('syncDataSuccess', 'success', { count: String(count), type: typeKey });
        setIsSyncing(null);
    };

    const handleSaveTarget = async (user: User, target: number) => {
        await updateUser({ ...user, salesTarget: target });
        showNotification('userUpdated', 'success');
        setEditingUser(null);
    };

    const salesData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return users.map(user => {
            const monthlySales = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return inv.userId === user.id && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
                })
                .reduce((sum, inv) => sum + inv.totalAmount, 0);
            
            const progress = (user.salesTarget && user.salesTarget > 0) ? (monthlySales / user.salesTarget) * 100 : 0;

            return { ...user, monthlySales, progress };
        });
    }, [users, invoices]);
    
    const salesColumns = [
        { header: t('personnel'), accessor: (item: any) => item.name },
        { header: t('monthlyTarget'), accessor: (item: any) => `${(item.salesTarget || 0).toLocaleString('tr-TR')} TL` },
        { header: t('thisMonthSales'), accessor: (item: any) => `${item.monthlySales.toLocaleString('tr-TR')} TL` },
        { header: t('progress'), accessor: (item: any) => (
            <div className="w-full bg-cnk-bg-light rounded-full h-4">
                <div className="bg-cnk-accent-green h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${Math.min(item.progress, 100)}%`}}>
                    {item.progress > 10 && `${item.progress.toFixed(0)}%`}
                </div>
            </div>
        )},
        { header: t('actions'), accessor: (item: User) => (
            <Button size="sm" onClick={() => setEditingUser(item)}>{t('editTarget')}</Button>
        )},
    ];

    const stockColumns = [
        { header: t('stockCode'), accessor: (item: StockItem) => item.id },
        { header: t('stockName'), accessor: (item: StockItem) => item.name },
        { header: t('stockQuantity'), accessor: (item: StockItem) => item.quantity.toLocaleString('tr-TR') },
        { header: t('stockPrice'), accessor: (item: StockItem) => `${item.price.toLocaleString('tr-TR')} TL` },
    ];
    
    const customerColumns = [
        { header: t('nameCompanyName'), accessor: (item: Customer) => item.name },
        { header: t('email'), accessor: (item: Customer) => item.email || '-' },
        { header: t('phone1'), accessor: (item: Customer) => item.phone1 || '-' },
        { header: t('status'), accessor: (item: Customer) => item.status ? t(item.status) : '-' },
    ];

    const offerColumns = [
        { header: t('offerNo'), accessor: (item: Offer) => item.teklifNo },
        { header: t('customer'), accessor: (item: Offer) => customers.find(c => c.id === item.customerId)?.name || 'N/A' },
        { header: t('totalAmount'), accessor: (item: Offer) => `${item.genelToplam.toLocaleString('tr-TR')} TL` },
        { header: t('date'), accessor: (item: Offer) => new Date(item.createdAt).toLocaleDateString() },
    ];

    const invoiceColumns = [
        { header: t('invoiceNo'), accessor: (item: Invoice) => item.id },
        { header: t('customer'), accessor: (item: Invoice) => customers.find(c => c.id === item.customerId)?.name || 'N/A' },
        { header: t('totalAmount'), accessor: (item: Invoice) => `${item.totalAmount.toLocaleString('tr-TR')} TL` },
        { header: t('date'), accessor: (item: Invoice) => new Date(item.date).toLocaleDateString() },
    ];

    if (!settings) return <Loader fullScreen />;

    const tabs = [
        { id: 'connection', labelKey: 'erpConnectionTab' },
        { id: 'targets', labelKey: 'erpTargetsTab' },
        { id: 'customers', labelKey: 'erpCustomersTab' },
        { id: 'offers', labelKey: 'erpOffersTab' },
        { id: 'stock', labelKey: 'erpStockTab' },
        { id: 'invoices', labelKey: 'erpInvoicesTab' },
    ];

    return (
        <div>
            {editingUser && <TargetEditModal isOpen={true} onClose={() => setEditingUser(null)} user={editingUser} onSave={(target) => handleSaveTarget(editingUser, target)} />}
            
            <div className="border-b border-cnk-border-light mb-6">
                <nav className="flex space-x-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-cnk-panel-light border border-cnk-border-light border-b-cnk-panel-light text-cnk-accent-primary -mb-px' : 'text-cnk-txt-muted-light hover:text-cnk-accent-primary'}`}>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className={`${activeTab === 'connection' ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm lg:col-span-1">
                        <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('databaseConnection')}</h2>
                        <div className="space-y-4">
                            <Input label={t('server')} id="server" value={settings.server} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label="Database Path" id="databasePath" value={settings.databasePath} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label={t('username')} id="username" value={settings.username} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label={t('password')} id="password" type="password" value="••••••••" disabled={settings.isConnected}/>
                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2">
                                    <span className={`h-3 w-3 rounded-full ${settings.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span>{settings.isConnected ? t('connected') : t('notConnected')}</span>
                                </div>
                                <Button onClick={handleToggleConnection} isLoading={isLoading} variant={settings.isConnected ? 'danger' : 'success'}>
                                    {settings.isConnected ? t('disconnect') : t('connect')}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('dataSync')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <SyncCard title={t('customerList')} descriptionKey="erpCustomerSyncDesc" lastSync={settings.lastSyncCustomers} type="customers" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} viewAction={() => setActiveTab('customers')} />
                           <SyncCard title={t('offerManagement')} descriptionKey="erpOfferSyncDesc" lastSync={settings.lastSyncOffers} type="offers" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} viewAction={() => setActiveTab('offers')} />
                           <SyncCard title={t('stockStatus')} descriptionKey="erpStockSyncDesc" lastSync={settings.lastSyncStock} type="stock" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} viewAction={() => setActiveTab('stock')} />
                           <SyncCard title={t('salesInvoicesTitle')} descriptionKey="erpInvoiceSyncDesc" lastSync={settings.lastSyncInvoices} type="invoices" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} viewAction={() => setActiveTab('invoices')} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${activeTab === 'targets' ? 'block' : 'hidden'}`}>
                <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm">
                     <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('monthlySalesTargets')}</h2>
                     <DataTable columns={salesColumns} data={salesData} />
                </div>
            </div>

            <div className={`${activeTab === 'customers' ? 'block' : 'hidden'}`}>
                <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('erpCustomersTab')}</h2>
                    <DataTable columns={customerColumns} data={customers} />
                </div>
            </div>

             <div className={`${activeTab === 'offers' ? 'block' : 'hidden'}`}>
                <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('erpOffersTab')}</h2>
                    <DataTable columns={offerColumns} data={offers} />
                </div>
            </div>
            
            <div className={`${activeTab === 'stock' ? 'block' : 'hidden'}`}>
                <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm">
                     <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('erpStockTab')}</h2>
                     <DataTable columns={stockColumns} data={stockItems} emptyStateMessage={t('noStockData')} />
                </div>
            </div>
            
             <div className={`${activeTab === 'invoices' ? 'block' : 'hidden'}`}>
                <div className="rounded-xl border border-cnk-border-light bg-cnk-panel-light p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('erpInvoicesTab')}</h2>
                    <DataTable columns={invoiceColumns} data={invoices} />
                </div>
            </div>
        </div>
    );
};

export default ErpIntegrationPage;