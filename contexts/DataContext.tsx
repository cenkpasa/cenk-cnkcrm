

import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Customer, Appointment, Interview, Offer, Task, SalesFunnelStage } from '../types';
import { db } from '../services/dbService';
import { useNotificationCenter } from './NotificationCenterContext';
import { v4 as uuidv4 } from 'uuid';
import { automationService } from '../services/automationService';

// Export the DataContextType interface
export interface DataContextType {
    customers: Customer[];
    addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<string>;
    updateCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (customerId: string) => Promise<void>;
    bulkAddCustomers: (newCustomers: Omit<Customer, 'id' | 'createdAt'>[]) => Promise<number>;
    updateCustomerStage: (customerId: string, newStage: SalesFunnelStage, currentUserId: string) => Promise<void>;
    
    appointments: Appointment[];
    addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
    updateAppointment: (appointment: Appointment) => Promise<void>;
    deleteAppointment: (appointmentId: string) => Promise<void>;

    interviews: Interview[];
    addInterview: (interview: Omit<Interview, 'id' | 'createdAt'>) => Promise<void>;
    updateInterview: (interview: Interview) => Promise<void>;
    
    offers: Offer[];
    addOffer: (offer: Omit<Offer, 'id' | 'teklifNo' | 'createdAt'>) => Promise<void>;
    updateOffer: (offer: Offer) => Promise<void>;
    bulkAddOffers: (newOffersData: Omit<Offer, 'id' | 'createdAt' | 'teklifNo'>[]) => Promise<number>;

    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
    const { addNotification } = useNotificationCenter();
    
    const customers = useLiveQuery(() => db.customers.orderBy('createdAt').reverse().toArray(), []) || [];
    const appointments = useLiveQuery(() => db.appointments.toArray(), []) || [];
    const interviews = useLiveQuery(() => db.interviews.toArray(), []) || [];
    const offers = useLiveQuery(() => db.offers.toArray(), []) || [];
    const tasks = useLiveQuery(() => db.tasks.orderBy('dueDate').toArray(), []) || [];

    // Customer Actions
    const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<string> => {
        const newCustomer: Customer = { 
            ...customerData, 
            id: uuidv4(), 
            createdAt: new Date().toISOString(),
            stage: 'potential'
        };
        const newId = await db.customers.add(newCustomer);
        addNotification({
            messageKey: 'activityCustomerAdded',
            replacements: { name: newCustomer.name },
            type: 'customer',
            link: { page: 'customers', id: newId }
        });
        return newId;
    };

    const updateCustomer = async (updatedCustomer: Customer) => {
        await db.customers.put(updatedCustomer);
    };

    const updateCustomerStage = async (customerId: string, newStage: SalesFunnelStage, currentUserId: string) => {
        await db.customers.update(customerId, { stage: newStage });
        const automationResult = await automationService.runAutomationsForStageChange(customerId, newStage, currentUserId);
        automationResult.notifications.forEach(notif => addNotification(notif));
    };

    const deleteCustomer = async (customerId: string) => {
        await db.customers.delete(customerId);
    };

    const bulkAddCustomers = async (newCustomersData: Omit<Customer, 'id' | 'createdAt'>[]) => {
        const currentCustomers = await db.customers.toArray();
        const existingEmails = new Set(currentCustomers.map(c => c.email?.toLowerCase()).filter(Boolean));
        const existingNames = new Set(currentCustomers.map(c => c.name.toLowerCase()));

        const customersToAdd: Customer[] = [];
        for (const newCust of newCustomersData) {
            const isDuplicate = (newCust.email && existingEmails.has(newCust.email.toLowerCase())) || existingNames.has(newCust.name.toLowerCase());
            if (!isDuplicate) {
                customersToAdd.push({
                    ...newCust,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    stage: 'potential'
                });
            }
        }

        if (customersToAdd.length > 0) {
            await db.customers.bulkAdd(customersToAdd);
        }
        return customersToAdd.length;
    };

    // Appointment Actions
    const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
        const newAppointment: Appointment = {
            ...appointmentData,
            id: uuidv4(),
            createdAt: new Date().toISOString()
        };
        await db.appointments.add(newAppointment);
        addNotification({
            messageKey: 'activityAppointmentAdded',
            replacements: { title: newAppointment.title },
            type: 'appointment',
            link: { page: 'appointments' }
        });
    };

    const updateAppointment = async (updatedAppointment: Appointment) => {
        await db.appointments.put(updatedAppointment);
    };

    const deleteAppointment = async (appointmentId: string) => {
        await db.appointments.delete(appointmentId);
    };

    // Interview Actions
    const addInterview = async (interviewData: Omit<Interview, 'id' | 'createdAt'>) => {
        const newInterview: Interview = {
            ...interviewData,
            id: uuidv4(),
            createdAt: new Date().toISOString()
        };
        const newId = await db.interviews.add(newInterview);
        const customer = await db.customers.get(newInterview.customerId);
        addNotification({
            messageKey: 'activityInterviewAdded',
            replacements: { customer: customer?.name || '' },
            type: 'interview',
            link: { page: 'gorusme-formu', id: newId }
        });
    };

    const updateInterview = async (updatedInterview: Interview) => {
        await db.interviews.put(updatedInterview);
    };

    // Offer Actions
    const addOffer = async (offerData: Omit<Offer, 'id'|'createdAt'|'teklifNo'>) => {
        const newOffer: Offer = {
            ...offerData,
            id: uuidv4(),
            teklifNo: 'TEK-' + Date.now().toString().slice(-6),
            createdAt: new Date().toISOString()
        };
        const newId = await db.offers.add(newOffer);
        addNotification({
            messageKey: 'activityOfferAdded',
            replacements: { teklifNo: newOffer.teklifNo },
            type: 'offer',
            link: { page: 'teklif-yaz', id: newId }
        });
    };

    const updateOffer = async (updatedOffer: Offer) => {
        await db.offers.put(updatedOffer);
    };
    
    const bulkAddOffers = async (newOffersData: Omit<Offer, 'id'|'createdAt'|'teklifNo'>[]) => {
        const offersToAdd = newOffersData.map(newOffer => ({
             ...newOffer,
             id: uuidv4(),
             createdAt: new Date().toISOString(),
             teklifNo: 'TEK-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 4)
        }));

        if (offersToAdd.length > 0) {
            await db.offers.bulkAdd(offersToAdd);
        }
        return offersToAdd.length;
    }

    // Task Actions
    const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
        const newTask: Task = {
            ...taskData,
            id: uuidv4(),
            createdAt: new Date().toISOString()
        };
        await db.tasks.add(newTask);
        addNotification({
            messageKey: 'activityTaskAdded',
            replacements: { title: newTask.title },
            type: 'system',
            link: { page: 'tasks' }
        });
    };

    const updateTask = async (updatedTask: Task) => {
        await db.tasks.put(updatedTask);
    };

    const deleteTask = async (taskId: string) => {
        const taskToDelete = await db.tasks.get(taskId);
        await db.tasks.delete(taskId);
        if (taskToDelete) {
             addNotification({
                messageKey: 'activityTaskDeleted',
                replacements: { title: taskToDelete.title },
                type: 'system',
            });
        }
    };
    
    const value: DataContextType = {
        customers, addCustomer, updateCustomer, deleteCustomer, bulkAddCustomers, updateCustomerStage,
        appointments, addAppointment, updateAppointment, deleteAppointment,
        interviews, addInterview, updateInterview,
        offers, addOffer, updateOffer, bulkAddOffers,
        tasks, addTask, updateTask, deleteTask,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};