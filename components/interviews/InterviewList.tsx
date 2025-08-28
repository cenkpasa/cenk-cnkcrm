import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Interview } from '../../types';
import DataTable from '../common/DataTable';
import Button from '../common/Button';
import { ViewState } from '../../types';

interface InterviewListPageProps {
    setView: (view: ViewState) => void;
}

const InterviewList = ({ setView }: InterviewListPageProps) => {
    const { interviews, customers } = useData();
    const { t } = useLanguage();
    const { currentUser } = useAuth();

    const columns = [
        {
            header: t('customers'),
            accessor: (item: Interview) => {
                const customer = customers.find(c => c.id === item.customerId);
                return customer ? customer.name : t('unknownCustomer');
            }
        },
        { header: t('interviewDate'), accessor: (item: Interview) => item.formTarihi },
        { header: t('interviewer'), accessor: (item: Interview) => item.gorusmeyiYapan },
        {
            header: t('actions'),
            accessor: (item: Interview) => (
                <div className="flex gap-2">
                    <Button 
                        variant="info" 
                        size="sm" 
                        onClick={() => setView({ page: 'gorusme-formu', id: item.id })} 
                        icon="fas fa-eye" 
                        title={currentUser?.role === 'admin' ? `${t('view')}/${t('edit')}` : t('view')} 
                    />
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-end mb-6">
                <Button variant="primary" onClick={() => setView({ page: 'gorusme-formu', id: 'create' })} icon="fas fa-plus">{t('addInterview')}</Button>
            </div>
            <DataTable
                columns={columns}
                data={interviews}
                emptyStateMessage={t('noInterviewYet')}
            />
        </div>
    );
};

export default InterviewList;