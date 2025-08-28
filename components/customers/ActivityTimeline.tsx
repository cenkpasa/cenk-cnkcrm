import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Appointment, Offer, Interview } from '../../types';

type TimelineItemData = (Appointment | Offer | Interview) & { type: 'appointment' | 'offer' | 'interview' };

interface ActivityTimelineProps {
    customerId: string;
}

const ActivityTimeline = ({ customerId }: ActivityTimelineProps) => {
    const { appointments, offers, interviews } = useData();

    const timelineItems = useMemo(() => {
        const items: TimelineItemData[] = [];

        appointments.filter(a => a.customerId === customerId).forEach(a => items.push({ ...a, type: 'appointment' }));
        offers.filter(o => o.customerId === customerId).forEach(o => items.push({ ...o, type: 'offer' }));
        interviews.filter(i => i.customerId === customerId).forEach(i => items.push({ ...i, type: 'interview' }));

        return items.sort((a, b) => {
            const dateA = new Date(a.createdAt || (a as Appointment).start || (a as Interview).formTarihi).getTime();
            const dateB = new Date(b.createdAt || (b as Appointment).start || (b as Interview).formTarihi).getTime();
            return dateB - dateA;
        });
    }, [customerId, appointments, offers, interviews]);

    const getIconInfo = (type: TimelineItemData['type']) => {
        const iconMap = {
            appointment: { icon: 'fa-calendar-check', bg: 'bg-green-100', text: 'text-green-600' },
            offer: { icon: 'fa-file-invoice-dollar', bg: 'bg-purple-100', text: 'text-purple-600' },
            interview: { icon: 'fa-file-signature', bg: 'bg-orange-100', text: 'text-orange-600' },
        };
        return iconMap[type];
    };
    
    const TimelineItem = ({ item }: { item: TimelineItemData }) => {
        const iconInfo = getIconInfo(item.type);
        const date = new Date(item.createdAt || (item as Appointment).start || (item as Interview).formTarihi);

        const renderContent = () => {
            switch (item.type) {
                case 'appointment': return <p><strong>Randevu:</strong> {(item as Appointment).title}</p>;
                case 'offer': return <p><strong>Teklif:</strong> {(item as Offer).teklifNo}</p>;
                case 'interview': return <p><strong>Görüşme:</strong> {(item as Interview).gorusmeyiYapan} ile</p>;
                default: return null;
            }
        };

        return (
            <div className="relative">
                <div className={`absolute -left-[34px] top-1 w-8 h-8 rounded-full ${iconInfo.bg} ${iconInfo.text} flex items-center justify-center`}>
                    <i className={`fas ${iconInfo.icon}`}></i>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    {renderContent()}
                    <p className="text-xs text-slate-400 mt-1">{date.toLocaleString('tr-TR')}</p>
                </div>
            </div>
        );
    };

    if (timelineItems.length === 0) {
        return <div className="text-center p-4 text-sm text-slate-500 bg-slate-50 rounded-md">Bu müşteri için henüz bir etkinlik kaydedilmemiş.</div>;
    }

    return (
        <div className="border-l-2 border-slate-200 pl-6 space-y-6 max-h-96 overflow-y-auto pr-2">
            {timelineItems.map((item) => <TimelineItem key={`${item.type}-${item.id}`} item={item} />)}
        </div>
    );
};

export default ActivityTimeline;