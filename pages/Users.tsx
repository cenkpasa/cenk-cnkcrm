import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '../types';
import Button from '../components/common/Button';
import UserForm from '../components/forms/UserForm';
import PersonnelDetail from '../components/users/PersonnelDetail';
import LeaveRequestManager from '../components/users/LeaveRequestManager';

const Users = () => {
    const { users, currentUser } = useAuth();
    const { t } = useLanguage();
    const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [personnelToEdit, setPersonnelToEdit] = useState<User | null>(null);

    useEffect(() => {
        if (users.length > 0 && !selectedPersonnelId) {
            setSelectedPersonnelId(users[0].id);
        }
    }, [users, selectedPersonnelId]);

    const handleAddNew = () => {
        setPersonnelToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (personnel: User) => {
        setPersonnelToEdit(personnel);
        setIsModalOpen(true);
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div>
                <p className="mt-4 rounded-lg bg-yellow-500/10 p-4 text-yellow-300">{t('adminPrivilegeRequired')}</p>
            </div>
        );
    }
    
    const selectedPersonnel = users.find(u => u.id === selectedPersonnelId);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold">{t('personnelManagement')}</h1>
                <Button onClick={handleAddNew} icon="fas fa-plus">{t('addNewPersonnel')}</Button>
            </div>
            
            <LeaveRequestManager />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Personnel List */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="bg-cnk-panel-light rounded-lg shadow-lg p-3 space-y-2 max-h-[75vh] overflow-y-auto">
                        {users.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonnelId(p.id)}
                                 className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedPersonnelId === p.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-bg-light'}`}>
                                <div className="flex items-center overflow-hidden">
                                    <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name.replace(/\s/g, "+")}&background=random`} alt={p.name} className="w-12 h-12 rounded-full mr-4 object-cover flex-shrink-0"/>
                                    <div className="truncate">
                                        <p className="font-semibold truncate">{p.name}</p>
                                        <p className={`${selectedPersonnelId === p.id ? 'text-blue-100' : 'text-cnk-txt-muted-light'} text-sm truncate`}>{p.jobTitle || t(p.role)}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.employmentStatus === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {p.employmentStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Details */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedPersonnel ? (
                        <PersonnelDetail personnel={selectedPersonnel} onEdit={() => handleEdit(selectedPersonnel)} />
                    ) : (
                        <div className="bg-cnk-panel-light rounded-lg shadow-lg p-8 text-center text-cnk-txt-muted-light h-full flex items-center justify-center">
                            <p>{t('selectPersonnelToView')}</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && <UserForm 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={personnelToEdit}
            />}
        </div>
    );
};

export default Users;