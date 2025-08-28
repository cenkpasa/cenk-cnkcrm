import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LocationRecord } from '../types';
import { WORKPLACE_COORDS } from '../constants';
import Button from '../components/common/Button';
import { db } from '../services/dbService';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const MapView = ({ locations }: { locations: LocationRecord[] }) => {
    const mapUrl = useMemo(() => {
        let bbox = "25.6,35.8,44.8,42.1"; // Turkey
        let marker = "39.92,32.85"; // Ankara

        if (locations.length > 0) {
            const lastLocation = locations[locations.length - 1];
            marker = `${lastLocation.latitude},${lastLocation.longitude}`;
            bbox = `${lastLocation.longitude - 0.05},${lastLocation.latitude - 0.05},${lastLocation.longitude + 0.05},${lastLocation.latitude + 0.05}`;
        }
        
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
    }, [locations]);
    
    return (
        <div className="bg-cnk-panel-light rounded-lg shadow-inner flex-grow relative overflow-hidden">
             <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={mapUrl} title="Konum Haritası" />
        </div>
    );
};

const LocationTrackingPage = () => {
    const { users, currentUser } = useAuth();
    const { customers } = useData();
    const { t } = useLanguage();

    const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(currentUser?.id || null);
    const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    
    const filteredLocationHistory = useLiveQuery(() => {
        if (!selectedPersonnelId) return [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDateFilter: Date;
        if (filter === 'daily') startDateFilter = startOfToday;
        else if (filter === 'weekly') {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfToday.getDate() - (startOfToday.getDay() === 0 ? 6 : startOfToday.getDay() - 1));
            startDateFilter = startOfWeek;
        } else startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return db.locationHistory.where('userId').equals(selectedPersonnelId).and(r => new Date(r.timestamp) >= startDateFilter).sortBy('timestamp');
    }, [selectedPersonnelId, filter]) || [];


    const report = useMemo(() => {
        if (filteredLocationHistory.length < 1) return null;
        
        const sortedHistory = filteredLocationHistory;
        const startTime = new Date(sortedHistory[0].timestamp);
        const endTime = new Date(sortedHistory[sortedHistory.length - 1].timestamp);
        const totalDurationMs = endTime.getTime() - startTime.getTime();
        const totalHours = Math.floor(totalDurationMs / 3600000);
        const totalMinutes = Math.floor((totalDurationMs % 3600000) / 60000);

        const visits = sortedHistory.filter(r => r.isVisit).map(r => ({ time: new Date(r.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), customer: customers.find(c => c.id === r.customerId) }));
        const lastLocation = sortedHistory[sortedHistory.length - 1];
        const isAtWork = getDistance(lastLocation.latitude, lastLocation.longitude, WORKPLACE_COORDS.latitude, WORKPLACE_COORDS.longitude) < 1;

        return {
            startTime: startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            endTime: endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            totalHours, totalMinutes, visits, isAtWork,
            startStatusIsAtWork: getDistance(sortedHistory[0].latitude, sortedHistory[0].longitude, WORKPLACE_COORDS.latitude, WORKPLACE_COORDS.longitude) < 1
        };
    }, [filteredLocationHistory, customers]);
    
     if (currentUser?.role !== 'admin') {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-lg">{t('adminPrivilegeRequired')}</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-150px)]">
            <div className="lg:col-span-3">
                <div className="bg-cnk-panel-light rounded-lg shadow-lg p-3 space-y-2 h-full overflow-y-auto">
                    {users.map(p => (
                        <div key={p.id} onClick={() => setSelectedPersonnelId(p.id)}
                             className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${selectedPersonnelId === p.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-bg-light'}`}>
                            <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name.replace(/\s/g, "+")}&background=random`} alt={p.name} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                            <div><p className="font-semibold text-sm">{p.name}</p></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-9">
                {selectedPersonnelId ? (
                    <div className="flex flex-col h-full gap-4">
                       <MapView locations={filteredLocationHistory} />
                        <div className="bg-cnk-panel-light rounded-lg shadow-lg p-4 h-auto">
                            <div className="flex justify-end items-center mb-3">
                                <div className="flex gap-1">
                                    {(['daily', 'weekly', 'monthly'] as const).map(f => <Button key={f} size="sm" variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)}>{t(`${f}Report`)}</Button>)}
                                </div>
                            </div>
                            {report ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-cnk-bg-light p-3 rounded-md">
                                        <h4 className="font-semibold mb-2">{t('workHours')}</h4>
                                        <p><strong>{t('start')}:</strong> {report.startTime} ({report.startStatusIsAtWork ? t('atWork') : t('outsideWork')})</p>
                                        <p><strong>{t('end')}:</strong> {report.endTime} ({report.isAtWork ? t('atWork') : t('outsideWork')})</p>
                                        <p><strong>{t('totalDuration')}:</strong> {report.totalHours} saat {report.totalMinutes} dakika</p>
                                    </div>
                                    <div className="bg-cnk-bg-light p-3 rounded-md">
                                        <h4 className="font-semibold mb-2">{t('customerVisits')}</h4>
                                        {report.visits.length > 0 ? (<ul>{report.visits.map((v, i) => <li key={i}>- {v.time} @ {v.customer?.name}</li>)}</ul>) : <p>{t('noVisits')}</p>}
                                    </div>
                                </div>
                            ) : <p className="text-center p-4">{t('noLocationData')}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="bg-cnk-panel-light rounded-lg shadow-lg p-8 text-center h-full flex items-center justify-center">
                        <p>{t('selectPersonnelToTrack')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationTrackingPage;