import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';
import Loader from '../components/common/Loader';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import UserDashboard from '../components/dashboard/UserDashboard';

interface DashboardProps {
    setView: (view: ViewState) => void;
}

const Dashboard = ({ setView }: DashboardProps) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <Loader fullScreen />;
    }

    if (!currentUser) {
        return <p>Kullanıcı bilgileri yüklenemedi.</p>;
    }

    return currentUser.role === 'admin' 
        ? <AdminDashboard setView={setView} /> 
        : <UserDashboard setView={setView} />;
};

export default Dashboard;