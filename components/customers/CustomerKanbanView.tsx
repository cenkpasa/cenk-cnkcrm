import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Customer, SalesFunnelStage } from '../../types';
import { SALES_FUNNEL_STAGES } from '../../constants';

interface CustomerKanbanViewProps {
    onCustomerClick: (customer: Customer) => void;
}

const CustomerCard = ({ customer, onCustomerClick }: { customer: Customer; onCustomerClick: (customer: Customer) => void }) => {
    return (
        <div 
            onClick={() => onCustomerClick(customer)}
            className="bg-cnk-panel-light p-3 mb-3 rounded-lg shadow-sm border border-cnk-border-light hover:shadow-md hover:border-cnk-accent-primary cursor-pointer transition-all"
        >
            <p className="font-semibold text-sm text-cnk-txt-primary-light">{customer.name}</p>
            <p className="text-xs text-cnk-txt-muted-light truncate">{customer.commercialTitle || '...'}</p>
            <div className="mt-2 pt-2 border-t border-cnk-border-light flex justify-between items-center">
                <span className="text-xs text-cnk-txt-muted-light">{customer.phone1 || customer.email || 'No contact'}</span>
            </div>
        </div>
    );
};

const CustomerKanbanView = ({ onCustomerClick }: CustomerKanbanViewProps) => {
    const { customers, updateCustomerStage } = useData();
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const columns = useMemo(() => {
        const groupedCustomers: Record<SalesFunnelStage, Customer[]> = {
            potential: [], contacted: [], proposal: [], negotiation: [], won: [], lost: []
        };

        customers.forEach(customer => {
            const stage = customer.stage || 'potential';
            if (groupedCustomers[stage]) {
                groupedCustomers[stage].push(customer);
            }
        });
        return groupedCustomers;
    }, [customers]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination || (source.droppableId === destination.droppableId)) {
            return;
        }
        if (currentUser) {
            updateCustomerStage(draggableId, destination.droppableId as SalesFunnelStage, currentUser.id);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto p-2 bg-cnk-bg-light rounded-lg">
                {Object.entries(SALES_FUNNEL_STAGES).map(([stageId, stageInfo]) => (
                    <div key={stageId} className="w-72 bg-slate-100 rounded-lg p-3 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`w-3 h-3 rounded-full ${stageInfo.color}`}></span>
                            <h3 className="font-bold text-sm text-cnk-txt-secondary-light uppercase tracking-wider">{t(stageInfo.titleKey)}</h3>
                            <span className="ml-auto text-sm font-semibold bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                                {columns[stageId as SalesFunnelStage].length}
                            </span>
                        </div>
                        <Droppable droppableId={stageId}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[200px] transition-colors duration-200 rounded-md ${snapshot.isDraggingOver ? 'bg-slate-200' : ''}`}
                                >
                                    {columns[stageId as SalesFunnelStage].map((customer, index) => (
                                        <Draggable key={customer.id} draggableId={customer.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1}}
                                                >
                                                    <CustomerCard customer={customer} onCustomerClick={onCustomerClick} />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default CustomerKanbanView;
