import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Interview } from '../../types';
import Button from '../common/Button';
import { ViewState } from '../../types';
import { summarizeText } from '../../services/aiService';
import Loader from '../common/Loader';
import BworksLogo from '../assets/BworksLogo';
import VoiceNoteModal from '../ai/VoiceNoteModal';
import ActivityTimeline from '../customers/ActivityTimeline';
import { INTERVIEW_SEKTOR_OPTIONS } from '../../constants';

interface InterviewFormProps {
    setView: (view: ViewState) => void;
    interviewId?: string;
}

type InterviewFormData = Omit<Interview, 'id' | 'createdAt'>;

const InterviewForm = ({ setView, interviewId }: InterviewFormProps) => {
    const { interviews, customers, addInterview, updateInterview } = useData();
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    
    const isCreateMode = interviewId === 'create';
    const isReadOnly = !isCreateMode && currentUser?.role !== 'admin';

    const { register, handleSubmit, reset, setValue, watch, getValues } = useForm<InterviewFormData>({
        defaultValues: {
            customerId: '',
            formTarihi: new Date().toISOString().slice(0, 10),
            fuar: '',
            sektor: [],
            ziyaretci: { firmaAdi: '', adSoyad: '', bolumu: '', telefon: '', adres: '', email: '', web: '' },
            aksiyonlar: { katalogGonderilecek: false, teklifGonderilecek: false, ziyaretEdilecek: false, bizZiyaretEdecek: { tarih: '', adSoyad: '' } },
            notlar: '',
            gorusmeyiYapan: currentUser?.name || '',
            aiSummary: ''
        }
    });

    const watchedSektor = watch("sektor", []);
    const watchedNotes = watch("notlar");
    const customerId = watch("customerId");

    const [aiSummary, setAiSummary] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    
    useEffect(() => {
        const interview = interviews.find(i => i.id === interviewId);
        if (interview) {
             reset(interview);
             setAiSummary(interview.aiSummary || '');
        }
    }, [interviewId, interviews, reset]);
    
    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const custId = e.target.value;
        setValue('customerId', custId);
        const customer = customers.find(c => c.id === custId);
        setValue('ziyaretci.firmaAdi', customer?.name || '');
        setValue('ziyaretci.telefon', customer?.phone1 || '');
        setValue('ziyaretci.adres', customer?.address || '');
        setValue('ziyaretci.email', customer?.email || '');
    };

    const handleSektorChange = (sektorOption: string) => {
        const currentSektor = getValues('sektor') || [];
        const newSektor = currentSektor.includes(sektorOption)
            ? currentSektor.filter(s => s !== sektorOption)
            : [...currentSektor, sektorOption];
        setValue('sektor', newSektor);
    };
    
    const handleVoiceNoteInsert = (text: string) => {
        const currentNotes = getValues('notlar');
        setValue('notlar', currentNotes ? `${currentNotes}\n${text}` : text);
        setIsVoiceModalOpen(false);
    };

    const onSubmit: SubmitHandler<InterviewFormData> = (data) => {
        if (isCreateMode) {
            addInterview(data);
            showNotification('interviewSaved', 'success');
        } else if(interviewId) {
            const existingInterview = interviews.find(i => i.id === interviewId);
            if (existingInterview) {
                updateInterview({ ...existingInterview, ...data });
                showNotification('interviewUpdated', 'success');
            }
        }
        setView({ page: 'gorusme-formu' });
    };

    const handleGenerateSummary = async () => {
        if (!watchedNotes) return;
        setIsAiLoading(true);
        try {
            const result = await summarizeText(watchedNotes);
            if(result.success) setAiSummary(result.text);
            else showNotification('aiError', 'error');
        } catch(error) {
            showNotification('aiError', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSaveSummary = () => {
        if (!interviewId) return;
        const existingInterview = interviews.find(i => i.id === interviewId);
        if (existingInterview) {
            updateInterview({ ...existingInterview, aiSummary: aiSummary });
            showNotification('summarySaved', 'success');
        }
    };

    const gridBg = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40 L40 40 M40 0 L40 40' fill='none' stroke='%23d1d5db' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`;

    return (
        <div className="max-w-7xl mx-auto">
            {isVoiceModalOpen && <VoiceNoteModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} onInsert={handleVoiceNoteInsert} />}
            <div className="flex justify-end items-center mb-6">
                <Button onClick={() => setView({ page: 'gorusme-formu' })} variant="secondary" icon="fas fa-arrow-left">{t('backToList')}</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <fieldset disabled={isReadOnly} className="border-2 border-slate-600 p-4 font-sans text-sm disabled:bg-slate-50">
                            <div className="flex justify-between items-start border-b-2 border-slate-600 pb-2">
                                <div className="flex items-center">
                                    <div className="h-12 mr-4"><BworksLogo /></div>
                                    <span className="text-3xl font-bold">{t('interviewForm').toUpperCase()}</span>
                                </div>
                                <div className="text-right">
                                    <span>{t('date').toUpperCase()}: </span><input type="text" {...register("formTarihi")} className="w-28 border-b border-slate-400 focus:outline-none bg-transparent" readOnly={isReadOnly} />
                                    <br/>
                                    <span>{t('fair').toUpperCase()}: </span><input type="text" {...register("fuar")} className="w-28 border-b border-slate-400 focus:outline-none bg-transparent" readOnly={isReadOnly} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="col-span-1 border-r-2 border-slate-600 pr-4">
                                    <div className="border border-slate-600 p-2">
                                        <h3 className="font-bold text-center">{t('sector').toUpperCase()}</h3>
                                        {INTERVIEW_SEKTOR_OPTIONS.map(opt => (
                                            <div key={opt} className="flex items-center my-1">
                                                <input type="checkbox" id={opt} checked={watchedSektor.includes(opt)} onChange={() => handleSektorChange(opt)} disabled={isReadOnly} className="h-4 w-4 rounded" />
                                                <label htmlFor={opt} className="ml-2">{opt}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center"><input type="checkbox" {...register("aksiyonlar.katalogGonderilecek")} disabled={isReadOnly} className="h-4 w-4 rounded"/><label htmlFor="katalogGonderilecek" className="ml-2">Katalog gönderilecek</label></div>
                                        <div className="flex items-center"><input type="checkbox" {...register("aksiyonlar.teklifGonderilecek")} disabled={isReadOnly} className="h-4 w-4 rounded"/><label htmlFor="teklifGonderilecek" className="ml-2">Teklif gönderilecek</label></div>
                                        <div className="flex items-center"><input type="checkbox" {...register("aksiyonlar.ziyaretEdilecek")} disabled={isReadOnly} className="h-4 w-4 rounded"/><label htmlFor="ziyaretEdilecek" className="ml-2">Ziyaret edilecek</label></div>
                                    </div>
                                </div>
                                
                                <div className="col-span-2">
                                    <div className="border border-slate-600 p-2">
                                        <h3 className="font-bold">{t('visitor').toUpperCase()}</h3>
                                        <select {...register("customerId", { required: true })} onChange={handleCustomerChange} disabled={isReadOnly} className="w-full border border-slate-400 p-1 mb-2">
                                            <option value="">{t('selectCustomer')}</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center">
                                           <span>{t('nameCompanyName')}:</span><input type="text" {...register("ziyaretci.firmaAdi")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                           <span>{t('fullName')}:</span><input type="text" {...register("ziyaretci.adSoyad")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                           <span>{t('department')}:</span><input type="text" {...register("ziyaretci.bolumu")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                           <span>{t('phone')}:</span><input type="text" {...register("ziyaretci.telefon")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                           <span>{t('address')}:</span><input type="text" {...register("ziyaretci.adres")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                           <span>{t('email')}:</span><input type="text" {...register("ziyaretci.email")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                           <span>{t('website')}:</span><input type="text" {...register("ziyaretci.web")} readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent"/>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center border border-slate-600 p-2">
                                       <div className="flex items-center">
                                           <input type="checkbox" disabled className="h-4 w-4 rounded"/>
                                           <span className="ml-2">Bizi ziyaret edecek</span>
                                       </div>
                                       <div className="text-right">
                                           <span>TARİH: <input type="text" className="w-24 border-b border-slate-400 focus:outline-none bg-transparent" readOnly/></span>
                                           <span>Ad Soyad: <input type="text" className="w-24 border-b border-slate-400 focus:outline-none bg-transparent" readOnly/></span>
                                       </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 relative">
                                {!isReadOnly && <Button onClick={() => setIsVoiceModalOpen(true)} size="sm" icon="fas fa-microphone" className="absolute top-2 right-2 z-10">{t('addVoiceNote')}</Button>}
                                <textarea 
                                    {...register("notlar")}
                                    readOnly={isReadOnly}
                                    rows={12} 
                                    className="w-full p-2 border-2 border-t-0 border-slate-600 focus:outline-none resize-none leading-normal"
                                    style={{ backgroundImage: gridBg, backgroundSize: '16px 16px', backgroundRepeat: 'repeat' }}
                                ></textarea>
                            </div>

                            <div className="mt-2 flex justify-between items-center">
                                <div>
                                    <span>{t('interviewer').toUpperCase()}: </span>
                                    <input {...register("gorusmeyiYapan", { required: true })} type="text" readOnly={isReadOnly} className="border-b border-slate-400 focus:outline-none bg-transparent" />
                                </div>
                                {!isReadOnly && <Button type="submit" icon="fas fa-save">{t('save')}</Button>}
                            </div>

                        </fieldset>
                    </form>

                    {!isCreateMode && (
                        <div className="mt-6 border-t-2 border-slate-600 pt-4">
                            <h3 className="text-xl font-bold text-primary mb-2">{t('aiAssistant')}</h3>
                            <Button onClick={handleGenerateSummary} isLoading={isAiLoading} icon="fas fa-robot">{t('summarizeNotes')}</Button>
                            
                            {(isAiLoading || aiSummary) && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-semibold text-text-dark mb-2">{t('aiSummary')}</h4>
                                    {isAiLoading ? <Loader/> : (
                                        <>
                                            <textarea 
                                                value={aiSummary}
                                                onChange={(e) => setAiSummary(e.target.value)}
                                                rows={8}
                                                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <Button onClick={handleSaveSummary} variant="success" size="sm" icon="fas fa-save" className="mt-2">{t('saveSummary')}</Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-4">
                    {!isCreateMode && customerId && (
                        <div className="sticky top-20 bg-cnk-panel-light p-4 rounded-xl shadow-sm border border-cnk-border-light">
                            <h3 className="text-lg font-semibold text-cnk-txt-primary-light mb-3">{t('activityTimeline')}</h3>
                            <ActivityTimeline customerId={customerId} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewForm;