import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { usePersonnel } from '../../contexts/PersonnelContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { KmRecord } from '../../types';
import Button from '../common/Button';
import DataTable from '../common/DataTable';

interface VehicleKmTabProps {
    userId: string;
}

type KmRecordFormData = {
    km: number;
    type: 'morning' | 'evening';
};

const VehicleKmTab = ({ userId }: VehicleKmTabProps) => {
    const { t } = useLanguage();
    const { getKmRecordsForUser, addKmRecord } = usePersonnel();
    const { register, handleSubmit, reset } = useForm<KmRecordFormData>();

    const userKmRecords = getKmRecordsForUser(userId);

    const onSubmit: SubmitHandler<KmRecordFormData> = async (data) => {
        await addKmRecord({ ...data, userId });
        reset();
    };

    const columns = [
        { header: t('date'), accessor: (item: KmRecord) => new Date(item.date).toLocaleDateString() },
        { header: t('type'), accessor: (item: KmRecord) => t(item.type) },
        { header: t('kmValue'), accessor: (item: KmRecord) => item.km.toLocaleString('tr-TR') },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-bold mb-2">{t('addKmRecord')}</h4>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-cnk-bg-light p-4 rounded-lg">
                     <div>
                        <label htmlFor="km">{t('kmValue')}</label>
                        <input type="number" {...register('km', { required: true, valueAsNumber: true })} id="km" className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="type">{t('type')}</label>
                        <select {...register('type')} id="type" className="w-full mt-1 p-2 border rounded-md">
                            <option value="morning">{t('morning')}</option>
                            <option value="evening">{t('evening')}</option>
                        </select>
                    </div>
                    <Button type="submit">{t('save')}</Button>
                </form>
            </div>
            <div>
                <h4 className="font-bold mb-2">{t('kmRecords')}</h4>
                <DataTable columns={columns} data={userKmRecords} itemsPerPage={5} />
            </div>
        </div>
    );
};

export default VehicleKmTab;