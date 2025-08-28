import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Reconciliation, ReconciliationStatus, ReconciliationType } from '../../types';
import { useReconciliation } from '../../contexts/ReconciliationContext';
import { useData } from '../../contexts/DataContext';
import { useErp } from '../../contexts/ErpContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface ReconciliationModalProps {
    isOpen: boolean;
    onClose: () => void;
    reconciliation: Reconciliation | null;
}

type ReconciliationFormData = {
    customerId: string;
    type: ReconciliationType;
    period: string; // "YYYY-MM" format
    amount: number;
    notes?: string;
};

const StatusBadge = ({ status }: { status: ReconciliationStatus }) => {
    const { t } = useLanguage();
    const statusClasses: Record<ReconciliationStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        agreed: 'bg-green-100 text-green-800',
        disagreed: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>{t(status)}</span>;
};

const ReconciliationModal = ({ isOpen, onClose, reconciliation }: ReconciliationModalProps) => {
    const { t } = useLanguage();
    const { customers } = useData();
    const { addReconciliation, updateReconciliation } = useReconciliation();
    const { fetchErpAccountBalance } = useErp();
    const { showNotification } = useNotification();

    const isCreateMode = !reconciliation;
    const [isFetchingBalance, setIsFetchingBalance] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<ReconciliationFormData>();
    
    const watchedCustomerId = watch('customerId');
    const watchedPeriod = watch('period');

    useEffect(() => {
        if (isOpen) {
            if (isCreateMode) {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                reset({
                    customerId: '',
                    type: 'current_account',
                    period: lastMonth.toISOString().slice(0, 7),
                    amount: 0,
                    notes: ''
                });
            } else {
                reset({
                    customerId: reconciliation.customerId,
                    type: reconciliation.type,
                    period: reconciliation.period,
                    amount: reconciliation.amount,
                    notes: reconciliation.notes
                });
            }
        }
    }, [isOpen, reconciliation, isCreateMode, reset]);
    
    const handleFetchBalance = async () => {
        if (!watchedCustomerId || !watchedPeriod) {
            showNotification('Lütfen önce müşteri ve dönem seçin.', 'warning');
            return;
        }
        setIsFetchingBalance(true);
        try {
            const balance = await fetchErpAccountBalance(watchedCustomerId, watchedPeriod);
            setValue('amount', balance);
        } catch (error) {
            showNotification("ERP'den bakiye alınamadı.", 'error');
        } finally {
            setIsFetchingBalance(false);
        }
    };
    
    const handleStatusUpdate = async (newStatus: ReconciliationStatus) => {
        if (reconciliation) {
            await updateReconciliation(reconciliation.id, { status: newStatus });
            showNotification('Mutabakat durumu güncellendi.', 'success');
            onClose();
        }
    };

    const onSubmit: SubmitHandler<ReconciliationFormData> = async (data) => {
        try {
            await addReconciliation(data);
            showNotification('Mutabakat kaydı oluşturuldu.', 'success');
            onClose();
        } catch (error) {
            showNotification('genericError', 'error');
        }
    };
    
    const renderCreateForm = () => (
         <form id="reconciliation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="mb-2 block text-sm font-semibold">{t('customer')}</label>
                <select {...register('customerId', { required: true })} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                    <option value="">{t('selectCustomer')}</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-semibold">{t('type')}</label>
                    <select {...register('type')} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2">
                        <option value="current_account">{t('current_account')}</option>
                        <option value="ba">{t('ba')}</option>
                        <option value="bs">{t('bs')}</option>
                    </select>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-semibold">{t('period')}</label>
                    <input type="month" {...register('period', { required: true })} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2" />
                </div>
            </div>
            <div>
                <label className="mb-2 block text-sm font-semibold">{t('amount')}</label>
                <div className="flex items-center gap-2">
                    <input type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2" />
                    <Button type="button" onClick={handleFetchBalance} isLoading={isFetchingBalance} variant="secondary">ERP'den Getir</Button>
                </div>
            </div>
             <div>
                <label className="mb-2 block text-sm font-semibold">{t('notes')}</label>
                <textarea {...register('notes')} rows={3} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2" />
            </div>
        </form>
    );
    
    const renderDetailsView = () => {
        if (!reconciliation) return null;
        const customer = customers.find(c => c.id === reconciliation.customerId);
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-cnk-bg-light rounded-lg">
                    <div><p className="text-sm text-cnk-txt-muted-light">{t('customer')}</p><p className="font-semibold">{customer?.name}</p></div>
                    <div><p className="text-sm text-cnk-txt-muted-light">{t('status')}</p><p><StatusBadge status={reconciliation.status} /></p></div>
                    <div><p className="text-sm text-cnk-txt-muted-light">{t('type')}</p><p className="font-semibold">{t(reconciliation.type)}</p></div>
                    <div><p className="text-sm text-cnk-txt-muted-light">{t('period')}</p><p className="font-semibold">{reconciliation.period}</p></div>
                    <div className="col-span-2"><p className="text-sm text-cnk-txt-muted-light">{t('amount')}</p><p className="font-semibold text-xl text-cnk-accent-primary">{reconciliation.amount.toLocaleString('tr-TR')} TL</p></div>
                </div>
                {reconciliation.notes && (
                    <div><p className="text-sm text-cnk-txt-muted-light">{t('notes')}</p><p className="p-2 border rounded-md bg-white">{reconciliation.notes}</p></div>
                )}
            </div>
        );
    };

    const getFooter = () => {
        if (isCreateMode) {
            return <>
                <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button variant="primary" type="submit" form="reconciliation-form" isLoading={isSubmitting}>{t('save')}</Button>
            </>;
        }
        if (reconciliation?.status === 'pending') {
            return <>
                <Button variant="secondary" onClick={() => { showNotification('Email gönderme özelliği yakında eklenecek.', 'info')}}>E-posta Gönder</Button>
                <Button variant="danger" onClick={() => handleStatusUpdate('disagreed')}>Anlaşılmadı</Button>
                <Button variant="success" onClick={() => handleStatusUpdate('agreed')}>Anlaşıldı</Button>
            </>;
        }
        return <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isCreateMode ? t('createReconciliation') : t('reconciliationDetails')}
            footer={getFooter()}
            size="2xl"
        >
            {isCreateMode ? renderCreateForm() : renderDetailsView()}
        </Modal>
    );
};

export default ReconciliationModal;
