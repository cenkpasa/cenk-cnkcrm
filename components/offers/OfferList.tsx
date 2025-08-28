import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Offer } from '../../types';
import DataTable from '../common/DataTable';
import Button from '../common/Button';
import { downloadOfferAsPdf } from '../../services/pdfService';
import Loader from '../common/Loader';
import { ViewState } from '../../types';
import { ASSETS } from '../../constants';

interface OfferListPageProps {
    setView: (view: ViewState) => void;
}

const OfferList = ({ setView }: OfferListPageProps) => {
    const { offers, customers } = useData();
    const { t } = useLanguage();
    const [isDownloading, setIsDownloading] = useState(false);
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();

    const handleDownload = async (offer: Offer) => {
        setIsDownloading(true);
        const customer = customers.find(c => c.id === offer.customerId);
        const result = await downloadOfferAsPdf(offer, customer, t, ASSETS.CNK_LOGO_BASE64);
        if (result.success) {
            showNotification('pdfDownloaded', 'success');
        } else {
            showNotification('pdfError', 'error');
        }
        setIsDownloading(false);
    };

    const columns = [
        { header: t('offerCode'), accessor: (item: Offer) => <span className="font-mono text-sm">{item.teklifNo}</span> },
        { 
            header: t('customers'), 
            accessor: (item: Offer) => customers.find(c => c.id === item.customerId)?.name || t('unknownCustomer')
        },
        { header: t('yetkili'), accessor: (item: Offer) => item.firma.yetkili },
        { header: t('amount'), accessor: (item: Offer) => `${item.genelToplam.toFixed(2)} TL`, className: 'font-semibold' },
        { header: t('createdAt'), accessor: (item: Offer) => new Date(item.createdAt).toLocaleDateString() },
        {
            header: t('actions'),
            accessor: (item: Offer) => (
                <div className="flex gap-2">
                    <Button 
                        variant="info" 
                        size="sm" 
                        onClick={() => setView({ page: 'teklif-yaz', id: item.id })} 
                        icon="fas fa-eye" 
                        title={currentUser?.role === 'admin' ? `${t('view')}/${t('edit')}` : t('view')} 
                        aria-label={t('view')} 
                    />
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleDownload(item)} 
                        icon="fas fa-file-pdf" 
                        title={t('downloadPdf')} 
                        aria-label={t('downloadPdf')} 
                    />
                </div>
            ),
        },
    ];

    return (
        <div>
            {isDownloading && <Loader fullScreen={true} />}
            <div className="flex items-center justify-end mb-6">
                <Button variant="primary" onClick={() => setView({ page: 'teklif-yaz', id: 'create' })} icon="fas fa-plus">{t('createOffer')}</Button>
            </div>
            <DataTable
                columns={columns}
                data={offers}
                itemsPerPage={10}
                emptyStateMessage={t('noOfferYet')}
            />
        </div>
    );
};

export default OfferList;