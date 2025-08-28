import React from 'react';
import { Customer } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import DataTable from '../common/DataTable';

interface ImportConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataToImport: Omit<Customer, 'id' | 'createdAt'>[];
    onConfirm: () => void; 
}

const ImportConfirmationModal = ({ isOpen, onClose, dataToImport, onConfirm }: ImportConfirmationModalProps) => {
    const { t } = useLanguage();
    
    const columns = [
        { header: t('nameCompanyName'), accessor: (item: any) => item.name },
        { header: t('email'), accessor: (item: any) => item.email || '-' },
        { header: t('phone1'), accessor: (item: any) => item.phone1 || '-' },
        { header: t('address'), accessor: (item: any) => item.address || '-' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('importConfirmation')}
            size="4xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="success" onClick={onConfirm} icon="fas fa-check">{t('confirmAndSave')}</Button>
                </>
            }
        >
            <p className="mb-4 text-cnk-txt-secondary-light">{t('recordsToBeImported')}</p>
            <div className="max-h-96 overflow-y-auto">
                <DataTable columns={columns} data={dataToImport} />
            </div>
        </Modal>
    );
};

export default ImportConfirmationModal;
