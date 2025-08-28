import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Offer, OfferItem } from '../../types';
import Button from '../common/Button';
import { getOfferHtml } from '../../services/pdfService';
import { ViewState } from '../../types';
import { generateFollowUpEmail, enhanceDescription } from '../../services/aiService';
import { ASSETS } from '../../constants';
import Modal from '../common/Modal';
import { v4 as uuidv4 } from 'uuid';
import Loader from '../common/Loader';
import Input from '../common/Input';
import CnkLogo from '../assets/CnkLogo';

interface OfferFormProps {
    setView: (view: ViewState) => void;
    offerId?: string;
}

type OfferFormData = Omit<Offer, 'id' | 'createdAt' | 'teklifNo' | 'toplam' | 'kdv' | 'genelToplam'>;

const OfferForm = ({ setView, offerId }: OfferFormProps) => {
    const { t } = useLanguage();
    const { offers, customers, addOffer, updateOffer } = useData();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    
    const isCreateMode = offerId === 'create';
    const isReadOnly = !isCreateMode && currentUser?.role !== 'admin';

    const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OfferFormData>({
        defaultValues: {
            customerId: '',
            firma: { yetkili: '', telefon: '', eposta: '', vade: 'Peşin', teklifTarihi: new Date().toISOString().slice(0,10) },
            teklifVeren: { yetkili: currentUser?.name || '', telefon: '0312 395 83 63', eposta: 'satis@cnkkesicitakim.com.tr' },
            items: [],
            notlar: 'Fiyatlarımıza KDV dahil değildir.',
            aiFollowUpEmail: ''
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const watchedItems = watch("items");
    const watchedForm = watch();

    const [aiEmail, setAiEmail] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [enhancingItemId, setEnhancingItemId] = useState<string|null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const { toplam, kdv, genelToplam } = useMemo(() => {
        const subTotal = (watchedItems || []).reduce((acc, item) => acc + (item.miktar * item.fiyat || 0), 0);
        const vat = subTotal * 0.20;
        const grandTotal = subTotal + vat;
        return { toplam: subTotal, kdv: vat, genelToplam: grandTotal };
    }, [watchedItems]);

    useEffect(() => {
        const offer = offers.find(o => o.id === offerId);
        if (offer) {
            reset(offer);
            setAiEmail(offer.aiFollowUpEmail || '');
        }
    }, [offerId, offers, reset]);

    useEffect(() => {
        (watchedItems || []).forEach((item, index) => {
            const newTutar = (item.miktar || 0) * (item.fiyat || 0);
            if (item.tutar !== newTutar) {
                 setValue(`items.${index}.tutar`, newTutar);
            }
        });
    }, [watchedItems, setValue]);


    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const custId = e.target.value;
        setValue('customerId', custId);
        const customer = customers.find(c => c.id === custId);
        if(customer) {
            setValue('firma.yetkili', customer.name || '');
            setValue('firma.telefon', customer.phone1 || '');
            setValue('firma.eposta', customer.email || '');
        }
    };
    
    const handleEnhanceDescription = async (index: number) => {
        const item = watchedItems?.[index];
        if (!item || !item.cins) return;
        setEnhancingItemId(item.id);
        try {
            const result = await enhanceDescription(item.cins);
            if (result.success) {
                setValue(`items.${index}.cins`, result.text);
                showNotification('descriptionEnhanced', 'success');
            } else {
                showNotification('aiError', 'error');
            }
        } catch(error) {
            showNotification('aiError', 'error');
        } finally {
            setEnhancingItemId(null);
        }
    };

    const handleGenerateEmail = async () => {
        if(!watchedForm.customerId) return;
        const customer = customers.find(c => c.id === watchedForm.customerId);
        setIsAiLoading(true);
        try {
            const result = await generateFollowUpEmail({...watchedForm, toplam, kdv, genelToplam} as Offer, customer);
            if(result.success) {
                setAiEmail(result.text);
            } else {
                showNotification('aiError', 'error');
            }
        } catch(e) {
            showNotification('aiError', 'error');
        } finally {
            setIsAiLoading(false);
        }
    }

    const onSubmit: SubmitHandler<OfferFormData> = (data) => {
        if (!data.customerId || data.items.length === 0) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        const offerData: Omit<Offer, 'id' | 'createdAt' | 'teklifNo'> = {
            ...data,
            toplam,
            kdv,
            genelToplam,
            aiFollowUpEmail: aiEmail,
        };

        if (isCreateMode) {
            addOffer(offerData);
        } else if(offerId) {
            const existingOffer = offers.find(o => o.id === offerId);
            if (existingOffer) {
                updateOffer({ ...existingOffer, ...offerData });
                showNotification('offerUpdated', 'success');
            }
        }
        setView({ page: 'teklif-yaz' });
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-end items-center mb-6">
                <Button onClick={() => setView({ page: 'teklif-yaz' })} variant="secondary" icon="fas fa-arrow-left">{t('backToList')}</Button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="bg-cnk-panel-light p-6 rounded-xl shadow-lg border border-cnk-border-light space-y-6">
                <fieldset disabled={isReadOnly}>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-4">
                        <div>
                            <CnkLogo className="h-12" />
                            <h2 className="text-2xl font-bold text-cnk-accent-primary mt-2">{t('createOffer')}</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <label className="font-semibold text-right">{t('offerDate')}:</label>
                            <input {...register('firma.teklifTarihi')} type="date" className="p-1 border rounded-md"/>
                             <label className="font-semibold text-right">{t('vade')}:</label>
                            <input {...register('firma.vade')} className="p-1 border rounded-md"/>
                        </div>
                    </div>
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                         <div>
                            <h3 className="font-semibold text-lg mb-2">{t('offerTo')}</h3>
                            <select {...register("customerId", { required: true })} onChange={handleCustomerChange} className="w-full border border-slate-400 p-2 mb-2 rounded-md">
                                <option value="">{t('selectCustomer')}</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.customerId && <p className="text-red-500 text-xs">{t('fieldsRequired')}</p>}
                            <div className="space-y-2">
                                <Input label={t('yetkili')} {...register('firma.yetkili')} />
                                <Input label={t('phone')} {...register('firma.telefon')} />
                                <Input label={t('email')} {...register('firma.eposta')} />
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">Teklif Veren</h3>
                            <div className="space-y-2">
                                <Input label={t('yetkili')} {...register('teklifVeren.yetkili')} />
                                <Input label={t('phone')} {...register('teklifVeren.telefon')} />
                                <Input label={t('email')} {...register('teklifVeren.eposta')} />
                            </div>
                        </div>
                    </div>
                    {/* Items Table */}
                    <div className="mt-6">
                         <h3 className="font-semibold text-lg mb-2">Teklif Kalemleri</h3>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-cnk-bg-light">
                                    <tr>
                                        <th className="p-2 text-left">{t('description')}</th>
                                        <th className="p-2 w-24">{t('quantity')}</th>
                                        <th className="p-2 w-28">{t('unit')}</th>
                                        <th className="p-2 w-32">{t('unitPrice')}</th>
                                        <th className="p-2 w-32">{t('total')}</th>
                                        <th className="p-2 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, index) => (
                                        <tr key={field.id}>
                                            <td>
                                                <div className="flex items-center">
                                                    <textarea {...register(`items.${index}.cins`, { required: true })} rows={1} className="w-full p-1 border rounded-md" />
                                                    <Button type="button" size="sm" variant="info" icon="fas fa-robot" title={t('enhanceDescription')} onClick={() => handleEnhanceDescription(index)} isLoading={enhancingItemId === field.id} className="ml-2"/>
                                                </div>
                                            </td>
                                            <td><input type="number" {...register(`items.${index}.miktar`, { valueAsNumber: true })} className="w-full p-1 border rounded-md" /></td>
                                            <td><input {...register(`items.${index}.birim`)} className="w-full p-1 border rounded-md" /></td>
                                            <td><input type="number" step="0.01" {...register(`items.${index}.fiyat`, { valueAsNumber: true })} className="w-full p-1 border rounded-md" /></td>
                                            <td><input readOnly value={watchedItems?.[index]?.tutar.toFixed(2) || '0.00'} className="w-full p-1 border rounded-md bg-gray-100" /></td>
                                            <td><Button type="button" variant="danger" size="sm" icon="fas fa-trash" onClick={() => remove(index)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Button type="button" onClick={() => append({ id: uuidv4(), cins: '', miktar: 1, birim: 'Adet', fiyat: 0, tutar: 0, teslimSuresi: 'Stoktan' })} className="mt-2" icon="fas fa-plus">{t('addRow')}</Button>
                    </div>
                     {/* Totals & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t('notes')}</h3>
                            <textarea {...register('notlar')} rows={5} className="w-full p-2 border rounded-md"></textarea>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between"><span className="font-semibold">{t('subtotal')}:</span><span>{toplam.toLocaleString('tr-TR', {style:'currency', currency:'TRY'})}</span></div>
                                <div className="flex justify-between"><span className="font-semibold">{t('vat')} (20%):</span><span>{kdv.toLocaleString('tr-TR', {style:'currency', currency:'TRY'})}</span></div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span className="font-semibold">{t('grandTotal')}:</span><span className="text-cnk-accent-primary">{genelToplam.toLocaleString('tr-TR', {style:'currency', currency:'TRY'})}</span></div>
                            </div>
                        </div>
                    </div>
                </fieldset>
                
                {/* Actions */}
                <div className="flex flex-wrap justify-between items-start gap-4 pt-4 border-t mt-4">
                    {!isCreateMode && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t('aiAssistant')}</h3>
                            <Button type="button" onClick={handleGenerateEmail} isLoading={isAiLoading} icon="fas fa-robot">{t('generateFollowUpEmail')}</Button>
                            {aiEmail && (
                                <div className="mt-2 p-3 bg-cnk-bg-light rounded-md">
                                    <h4 className="font-semibold">{t('aiGeneratedEmail')}</h4>
                                    <p className="text-sm whitespace-pre-wrap">{aiEmail}</p>
                                    <Button type="button" size="sm" variant="success" className="mt-2" icon="fas fa-save">{t('saveEmail')}</Button>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button type="button" variant="secondary" onClick={() => setIsPreviewOpen(true)}>{t('preview')}</Button>
                        {!isReadOnly && <Button type="submit" variant="primary">{t('saveOffer')}</Button>}
                    </div>
                </div>
            </form>
            {isPreviewOpen &&
                <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={t('offerPreview')} size="5xl">
                    <div dangerouslySetInnerHTML={{ __html: getOfferHtml({...watchedForm, toplam, kdv, genelToplam} as Offer, customers.find(c => c.id === watchedForm.customerId), t, ASSETS.CNK_LOGO_BASE64) }}></div>
                </Modal>
            }
        </div>
    );
};

export default OfferForm;