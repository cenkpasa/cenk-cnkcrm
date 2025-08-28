import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Customer, ViewState } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CustomerForm from '../components/forms/CustomerForm';
import CustomerDetailModal from '../components/customers/CustomerDetailModal';
import ExcelMappingModal from '../components/customers/ExcelMappingModal';
import ImportConfirmationModal from '../components/customers/ImportConfirmationModal';
import CustomerKanbanView from '../components/customers/CustomerKanbanView';
import * as XLSX from 'xlsx';

interface CustomersProps {
    setView: (view: ViewState) => void;
}

const Customers = ({ setView }: CustomersProps) => {
    const { customers, deleteCustomer, bulkAddCustomers } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();
    
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isMapperModalOpen, setIsMapperModalOpen] = useState(false);
    const [isConfirmImportModalOpen, setIsConfirmImportModalOpen] = useState(false);

    const [excelData, setExcelData] = useState<{jsonData: any[], headers: string[]}>({jsonData: [], headers: []});
    const [mappedCustomers, setMappedCustomers] = useState<Omit<Customer, 'id' | 'createdAt'>[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAdd = () => {
        setSelectedCustomer(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        if (currentUser?.role !== 'admin') {
            showNotification('permissionDenied', 'error');
            return;
        }
        setSelectedCustomer(customer);
        setIsDetailModalOpen(false);
        setIsFormModalOpen(true);
    };
    
    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailModalOpen(true);
    };
    
    const openDeleteConfirm = (customerId: string) => {
        if (currentUser?.role !== 'admin') {
            showNotification('permissionDenied', 'error');
            return;
        }
        setCustomerToDelete(customerId);
        setIsConfirmDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (customerToDelete) {
            await deleteCustomer(customerToDelete);
            showNotification('customerDeleted', 'success');
        }
        setIsConfirmDeleteOpen(false);
        setCustomerToDelete(null);
    };

    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target?.result, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                const headers: string[] = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][])[0] || [];
                
                setExcelData({ jsonData, headers });
                setIsMapperModalOpen(true);
            } catch (error) {
                showNotification('excelUploadError', 'error');
            }
        };
        reader.readAsBinaryString(file);
        event.target.value = '';
    };

    const handleMappingConfirmed = (mappedData: Omit<Customer, 'id' | 'createdAt'>[]) => {
        setMappedCustomers(mappedData);
        setIsMapperModalOpen(false);
        setIsConfirmImportModalOpen(true);
    };

    const handleImportConfirmed = async () => {
        const addedCount = await bulkAddCustomers(mappedCustomers);
        showNotification('excelUploadSuccess', 'success', { count: String(addedCount) });
        setIsConfirmImportModalOpen(false);
        setMappedCustomers([]);
    };

    const columns = [
        { header: t('nameCompanyName'), accessor: (item: Customer) => <span className="font-medium text-cnk-accent-primary">{item.name}</span> },
        { header: t('email'), accessor: (item: Customer) => item.email || '-' },
        { header: t('phone'), accessor: (item: Customer) => item.phone1 || '-' },
        { header: t('createdAt'), accessor: (item: Customer) => new Date(item.createdAt).toLocaleDateString() },
        {
            header: t('actions'),
            accessor: (item: Customer) => (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleViewDetails(item)} icon="fas fa-eye" title={t('view')} aria-label={t('view')} />
                    {currentUser?.role === 'admin' && (
                        <>
                           <Button variant="info" size="sm" onClick={() => handleEdit(item)} icon="fas fa-edit" title={t('edit')} aria-label={t('edit')} />
                           <Button variant="danger" size="sm" onClick={() => openDeleteConfirm(item.id)} icon="fas fa-trash" title={t('delete')} aria-label={t('delete')} />
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">{t('customerList')}</h1>
                    <div className="bg-cnk-bg-light p-1 rounded-lg flex gap-1 border border-cnk-border-light">
                        <Button size="sm" variant={viewMode === 'list' ? 'primary' : 'secondary'} className={viewMode === 'list' ? '' : '!bg-transparent shadow-none border-none'} onClick={() => setViewMode('list')} icon="fas fa-list">{t('listView')}</Button>
                        <Button size="sm" variant={viewMode === 'kanban' ? 'primary' : 'secondary'} className={viewMode === 'kanban' ? '' : '!bg-transparent shadow-none border-none'} onClick={() => setViewMode('kanban')} icon="fas fa-columns">{t('funnelView')}</Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden"/>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon="fas fa-upload">{t('addFromExcel')}</Button>
                    <Button variant="primary" onClick={handleAdd} icon="fas fa-plus">{t('addNewCustomer')}</Button>
                </div>
            </div>

            {viewMode === 'list' ? (
                 <DataTable columns={columns} data={customers} emptyStateMessage={t('noCustomerYet')} />
            ) : (
                <CustomerKanbanView onCustomerClick={handleViewDetails} />
            )}
            
            <CustomerForm isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} customer={selectedCustomer} />
            
            {selectedCustomer && (
                <CustomerDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} customer={selectedCustomer} onEdit={handleEdit} setView={setView} />
            )}

             <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title={t('areYouSure')} footer={
                <><Button variant="secondary" onClick={() => setIsConfirmDeleteOpen(false)}>{t('cancel')}</Button><Button variant="danger" onClick={handleDelete}>{t('delete')}</Button></>
            }>
                <p>{t('deleteConfirmation')}</p>
            </Modal>
            
            <ExcelMappingModal isOpen={isMapperModalOpen} onClose={() => setIsMapperModalOpen(false)} jsonData={excelData.jsonData} headers={excelData.headers} onConfirm={handleMappingConfirmed} />
            
            <ImportConfirmationModal isOpen={isConfirmImportModalOpen} onClose={() => setIsConfirmImportModalOpen(false)} dataToImport={mappedCustomers} onConfirm={handleImportConfirmed} />
        </div>
    );
};

export default Customers;