
import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ErpSettings, StockItem, Invoice, Customer, Offer } from '../types';
import { db } from '../services/dbService';
import { useData } from './DataContext';
import { MOCK_ERP_CUSTOMERS, MOCK_ERP_OFFERS, MOCK_ERP_STOCK_ITEMS, MOCK_ERP_INVOICES } from '../constants';

interface ErpContextType {
    erpSettings: ErpSettings | undefined;
    updateErpSettings: (settings: ErpSettings) => Promise<void>;
    
    // Synced Data
    stockItems: StockItem[];
    invoices: Invoice[];

    // Sync Functions
    syncStock: () => Promise<number>;
    syncInvoices: () => Promise<number>;
    syncCustomers: () => Promise<number>;
    syncOffers: () => Promise<number>;
    
    // Other functions
    fetchErpAccountBalance: (customerId: string, period: string) => Promise<number>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

interface ErpProviderProps {
    children: ReactNode;
}

export const ErpProvider = ({ children }: ErpProviderProps) => {
    const { bulkAddCustomers, bulkAddOffers } = useData();
    const erpSettings = useLiveQuery(() => db.erpSettings.get('default'), []);
    
    // Get ERP-specific data
    const stockItems = useLiveQuery(() => db.stockItems.toArray(), []) || [];
    const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

    const updateErpSettings = async (settings: ErpSettings) => {
        await db.erpSettings.put(settings);
    };

    const syncStock = async (): Promise<number> => {
        await db.stockItems.bulkPut(MOCK_ERP_STOCK_ITEMS);
        const currentSettings = await db.erpSettings.get('default');
        if(currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncStock: new Date().toISOString() });
        }
        return MOCK_ERP_STOCK_ITEMS.length;
    };
    
    const syncInvoices = async (): Promise<number> => {
        await db.invoices.bulkPut(MOCK_ERP_INVOICES);
        const currentSettings = await db.erpSettings.get('default');
        if(currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncInvoices: new Date().toISOString() });
        }
        return MOCK_ERP_INVOICES.length;
    };

    const syncCustomers = async (): Promise<number> => {
        const addedCount = await bulkAddCustomers(MOCK_ERP_CUSTOMERS);
        const currentSettings = await db.erpSettings.get('default');
        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncCustomers: new Date().toISOString() });
        }
        return addedCount;
    };
    
    // Fix: Refactored syncOffers to correctly process mock data and resolve type errors.
    const syncOffers = async (): Promise<number> => {
        const allCustomers = await db.customers.toArray();
        const customerCodeMap = new Map<string, string>();
        allCustomers.forEach(c => {
            if (c.currentCode) {
                customerCodeMap.set(c.currentCode, c.id);
            }
        });

        const offersToSync = MOCK_ERP_OFFERS.map(mockOffer => {
            const customerId = customerCodeMap.get(mockOffer.customerCurrentCode);
            if (!customerId) {
                console.warn(`Customer with current code ${mockOffer.customerCurrentCode} not found for mock offer.`);
                return null;
            }

            const toplam = mockOffer.items.reduce((acc, item) => acc + item.tutar, 0);
            const kdv = toplam * 0.20;
            const genelToplam = toplam + kdv;
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { customerCurrentCode, ...restOfMock } = mockOffer;

            const finalOffer: Omit<Offer, 'id' | 'createdAt' | 'teklifNo'> = {
                ...restOfMock,
                customerId,
                toplam,
                kdv,
                genelToplam,
            };
            return finalOffer;
        }).filter((o): o is Omit<Offer, 'id' | 'createdAt' | 'teklifNo'> => o !== null);

        const addedCount = await bulkAddOffers(offersToSync);
        const currentSettings = await db.erpSettings.get('default');
        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncOffers: new Date().toISOString() });
        }
        return addedCount;
    };
    
    const fetchErpAccountBalance = async (customerId: string, period: string): Promise<number> => {
        await new Promise(resolve => setTimeout(resolve, 750));
        const [year, month] = period.split('-').map(Number);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const allInvoices = await db.invoices.where('customerId').equals(customerId).toArray();
        const balance = allInvoices
            .filter(inv => new Date(inv.date) <= endDate)
            .reduce((total, inv) => total + inv.totalAmount, 0);
        const randomFactor = (Math.random() - 0.5) * 100;
        return parseFloat(Math.max(0, balance + randomFactor).toFixed(2));
    };

    const value = {
        erpSettings,
        updateErpSettings,
        stockItems,
        invoices,
        syncStock,
        syncInvoices,
        syncCustomers,
        syncOffers,
        fetchErpAccountBalance,
    };

    return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
};

export const useErp = (): ErpContextType => {
    const context = useContext(ErpContext);
    if (!context) {
        throw new Error('useErp must be used within an ErpProvider');
    }
    return context;
};
