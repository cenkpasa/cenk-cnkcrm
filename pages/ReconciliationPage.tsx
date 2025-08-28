// This file was previously TechnicalForms.tsx and has been repurposed for the new Reconciliation module.
import React, { useState } from 'react';
import { useReconciliation } from '../contexts/ReconciliationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Reconciliation, ReconciliationStatus } from '../types';
import { useData } from '../contexts/DataContext';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import ReconciliationModal from '../components/reconciliation/ReconciliationModal';

const ReconciliationPage = () => {
    const { t } = useLanguage();
    const { reconciliations } = useReconciliation();
    const { customers } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null);

    const handleOpenModal = (rec: Reconciliation | null) => {
        setSelectedReconciliation(rec);
        setIsModalOpen(true);
    };

    const statusClasses: Record<ReconciliationStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        agreed: 'bg-green-100 text-green-800',
        disagreed: 'bg-red-100 text-red-800',
    };
    
    const columns = [
        { 
            header: t('customer'), 
            accessor: (item: Reconciliation) => {
                const customer = customers.find(c => c.id === item.customerId);
                return String(customer?.name || t('unknownCustomer'));
            }
        },
        { header: t('type'), accessor: (item: Reconciliation) => t(item.type) },
        { header: t('period'), accessor: (item: Reconciliation) => item.period },
        { header: t('amount'), accessor: (item: Reconciliation) => `${item.amount.toLocaleString('tr-TR')} TL` },
        { 
            header: t('status'), 
            accessor: (item: Reconciliation) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[item.status]}`}>
                    {t(item.status)}
                </span>
            )
        },
        { 
            header: t('actions'), 
            accessor: (item: Reconciliation) => (
                <Button size="sm" onClick={() => handleOpenModal(item)}>
                    {t('details')}
                </Button>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('reconciliations')}</h1>
                <Button onClick={() => handleOpenModal(null)} icon="fas fa-plus">{t('createReconciliation')}</Button>
            </div>
            <DataTable columns={columns} data={reconciliations} emptyStateMessage={t('noReconciliationYet')} />
            {isModalOpen && (
                <ReconciliationModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    reconciliation={selectedReconciliation}
                />
            )}
        </div>
    );
};

export default ReconciliationPage;