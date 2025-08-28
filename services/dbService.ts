import Dexie, { type Table } from 'dexie';
import { User, Customer, Appointment, Interview, Offer, ErpSettings, StockItem, Invoice, Notification, LeaveRequest, KmRecord, LocationRecord, AISettings, EmailDraft, Reconciliation, CalculatorState, CalculationHistoryItem, Task } from '../types';
import { MOCK_USERS, MOCK_CUSTOMERS } from '../constants';

export class AppDatabase extends Dexie {
    users!: Table<User, string>;
    customers!: Table<Customer, string>;
    appointments!: Table<Appointment, string>;
    interviews!: Table<Interview, string>;
    offers!: Table<Offer, string>;
    erpSettings!: Table<ErpSettings, 'default'>;
    stockItems!: Table<StockItem, string>;
    invoices!: Table<Invoice, string>;
    notifications!: Table<Notification, string>;
    leaveRequests!: Table<LeaveRequest, string>;
    kmRecords!: Table<KmRecord, string>;
    locationHistory!: Table<LocationRecord, string>;
    aiSettings!: Table<AISettings, string>;
    emailDrafts!: Table<EmailDraft, string>;
    reconciliations!: Table<Reconciliation, string>;
    calculatorState!: Table<CalculatorState, 'default'>;
    calculationHistory!: Table<CalculationHistoryItem, number>;
    tasks!: Table<Task, string>;

    constructor() {
        super('CnkCrmDatabase');
        this.version(1).stores({
            users: 'id, &username',
            customers: 'id, name, createdAt, status, stage',
            appointments: 'id, customerId, start, userId',
            interviews: 'id, customerId, formTarihi',
            offers: 'id, customerId, teklifNo, createdAt',
            erpSettings: 'id',
            stockItems: 'id, name',
            invoices: 'id, customerId, userId, date',
            notifications: 'id, timestamp, isRead',
            leaveRequests: 'id, userId, requestDate, status',
            kmRecords: 'id, userId, date',
            locationHistory: 'id, userId, timestamp',
            aiSettings: 'userId',
            emailDrafts: 'id, createdAt, status, relatedObjectId',
            reconciliations: 'id, customerId, status, period, createdAt',
            calculatorState: 'id',
            calculationHistory: '++id, timestamp',
            tasks: 'id, assignedTo, customerId, dueDate, status',
        });
    }
}

export const db = new AppDatabase();

// This function ensures the database is correctly seeded, especially the default users.
export const seedDatabase = async () => {
    try {
        await db.transaction('rw', db.users, db.customers, db.erpSettings, async () => {
            // "Bulletproof" user seeding: always ensure default users exist.
            await db.users.bulkPut(MOCK_USERS);
            
            // Seed other data only if the database appears to be completely new.
            const customerCount = await db.customers.count();
            if (customerCount === 0) {
                console.log("Database is empty. Seeding initial customer data...");
                const customersToSeed: Customer[] = MOCK_CUSTOMERS.map((c, i) => ({
                    ...c,
                    id: String(i + 1),
                    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                }));
                await db.customers.bulkAdd(customersToSeed);
                await db.erpSettings.put({ id: 'default', server: '192.168.1.100', databasePath: 'C:\\WOLVOX8\\WOLVOX.FDB', username: 'SYSDBA', isConnected: false });
            }
        });
        console.log("Database initialization check complete.");
    } catch (error) {
        console.error("Failed to seed database:", error);
        throw error; // Re-throw the error to be caught by the initializer
    }
};