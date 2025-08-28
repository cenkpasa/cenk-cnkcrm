import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';
import { CalculatorState, CalculationHistoryItem } from '../types';
import { debounce } from '../utils/debounce';
import { LabeledInput, LabeledSelect, OutputBox } from '../components/calculator/CalculatorControls';
import Button from '../components/common/Button';

const DEFAULT_INPUTS = {
    turning: { Dm: '', n: '', vc: '', fn: '', ap: '', lm: '', KAPR: '90', kc: '', kc10: '', mc: '' },
    milling: { Dcap: '', n: '', vc: '', fz: '', zc: '', vf: '', ae: '', ap: '', kc: '' },
    drilling: { DC: '', n: '', vc: '', fn: '', kc: '' },
    boring: { DC: '', ap: '', fn: '', fz: '', zc: '', n: '', vc: '', kc: '' },
    tolerance: { D: '', shaft: '0', hole: '0', round: '3' }
};

const CalculationToolsPage = () => {
    const savedState = useLiveQuery(() => db.calculatorState.get('default'));
    const history = useLiveQuery(() => db.calculationHistory.orderBy('timestamp').reverse().limit(200).toArray(), []);

    const [unit, setUnit] = useState<'metric' | 'inch'>('metric');
    const [activeTab, setActiveTab] = useState('turning');
    const [inputs, setInputs] = useState(DEFAULT_INPUTS);
    const [outputs, setOutputs] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        if (savedState) {
            setUnit(savedState.unit);
            setActiveTab(savedState.activeTab);
            const mergedInputs = JSON.parse(JSON.stringify(DEFAULT_INPUTS));
            for (const tab in savedState.inputs) {
                if (mergedInputs[tab]) {
                    for (const field in savedState.inputs[tab]) {
                        if (field in mergedInputs[tab]) {
                            mergedInputs[tab][field] = savedState.inputs[tab][field];
                        }
                    }
                }
            }
            setInputs(mergedInputs);
        }
    }, [savedState]);

    const saveState = useCallback(debounce(async (state: Omit<CalculatorState, 'id'>) => {
        await db.calculatorState.put({ id: 'default', ...state });
    }, 500), []);

    useEffect(() => {
        saveState({ unit, activeTab, inputs });
    }, [unit, activeTab, inputs, saveState]);
    
    const handleInputChange = (tab: string, field: string, value: string) => {
        setInputs(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: value }}));
    };

    const addHistory = async (module: string, summary: string) => {
        const item: Omit<CalculationHistoryItem, 'id'> = { timestamp: Date.now(), module, unit, summary };
        await db.calculationHistory.add(item as CalculationHistoryItem);
    };

    const clearHistory = async () => {
        await db.calculationHistory.clear();
    };

    const toNum = (v: string) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
    const fmt = (x: number, digits = 3) => Number.isFinite(x) ? x.toFixed(digits) : '–';

    const calculate = useCallback(() => {
        let o: Record<string, any> = {};
        const VFactor = unit === 'metric' ? 1000 : 12;

        if (activeTab === 'turning') {
            const i = inputs.turning;
            const Dm = toNum(i.Dm), fn = toNum(i.fn), ap = toNum(i.ap), lm = toNum(i.lm);
            let n = toNum(i.n), vc = toNum(i.vc), kc = toNum(i.kc);
            if (Number.isFinite(vc) && Number.isFinite(Dm)) n = (vc * VFactor) / (Math.PI * Dm);
            else if (Number.isFinite(n) && Number.isFinite(Dm)) vc = (Math.PI * Dm * n) / VFactor;
            
            o.n = n; o.vc = vc;
            o.Q = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn)) ? (vc * ap * fn * (unit === 'metric' ? 1 : 12)) : NaN;
            o.Pc = (Number.isFinite(o.Q) && Number.isFinite(kc)) ? (o.Q * kc) / (unit === 'metric' ? 60e3 : 396e3) : NaN;
            o.Tc = (Number.isFinite(lm) && Number.isFinite(fn) && Number.isFinite(n)) ? (lm / (fn * n)) : NaN;
            if(!isNaN(Dm)) addHistory('Tornalama', `Dm=${Dm}, n=${fmt(n)}, vc=${fmt(vc)}, Pc=${fmt(o.Pc)}`);
        }
        
        setOutputs(prev => ({...prev, [activeTab]: Object.keys(o).reduce((acc, key) => ({...acc, [key]: fmt(o[key]) }), {})}));
    }, [inputs, unit, activeTab]);

    const tabs = [
        { id: 'turning', label: 'Tornalama' },
        { id: 'milling', label: 'Frezeleme' },
    ];
    
    return (
        <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold">İmalat Hesaplayıcı</h1>
                <div className="flex items-center gap-2">
                    <span>Birim:</span>
                    <label><input type="radio" name="unit" value="metric" checked={unit === 'metric'} onChange={() => setUnit('metric')} /> Metrik</label>
                    <label><input type="radio" name="unit" value="inch" checked={unit === 'inch'} onChange={() => setUnit('inch')} /> İnç</label>
                </div>
            </div>
            
            <div className="flex gap-2 p-1 bg-cnk-bg-light rounded-lg border">
                {tabs.map(tab => (
                    <button key={tab.id} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-cnk-accent-primary text-white' : 'hover:bg-slate-200'}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeTab === 'turning' && (
                        <>
                            <LabeledInput label={`Dm (${unit === 'metric' ? 'mm' : 'in'})`} value={inputs.turning.Dm} onChange={(e) => handleInputChange('turning', 'Dm', e.target.value)} />
                            <LabeledInput label={`fn (${unit === 'metric' ? 'mm/dev' : 'in/rev'})`} value={inputs.turning.fn} onChange={(e) => handleInputChange('turning', 'fn', e.target.value)} />
                            <LabeledInput label={`ap (${unit === 'metric' ? 'mm' : 'in'})`} value={inputs.turning.ap} onChange={(e) => handleInputChange('turning', 'ap', e.target.value)} />
                            <LabeledInput label={`lm (${unit === 'metric' ? 'mm' : 'in'})`} value={inputs.turning.lm} onChange={(e) => handleInputChange('turning', 'lm', e.target.value)} />
                            <LabeledInput label={`vc (${unit === 'metric' ? 'm/dk' : 'ft/min'})`} value={inputs.turning.vc} onChange={(e) => handleInputChange('turning', 'vc', e.target.value)} />
                            <LabeledInput label="n (rpm)" value={inputs.turning.n} onChange={(e) => handleInputChange('turning', 'n', e.target.value)} />
                            <LabeledInput label={`kc (${unit === 'metric' ? 'N/mm²' : 'lbf/in²'})`} value={inputs.turning.kc} onChange={(e) => handleInputChange('turning', 'kc', e.target.value)} />
                        </>
                    )}
                </div>
                <Button onClick={calculate} className="mt-4">Hesapla</Button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                     {activeTab === 'turning' && (
                        <>
                           <OutputBox label="n" value={outputs.turning?.n} unit="rpm" />
                           <OutputBox label="vc" value={outputs.turning?.vc} unit={unit === 'metric' ? 'm/dk' : 'ft/min'} />
                           <OutputBox label="Q" value={outputs.turning?.Q} unit={unit === 'metric' ? 'cm³/dk' : 'in³/dk'} />
                           <OutputBox label="Pc" value={outputs.turning?.Pc} unit={unit === 'metric' ? 'kW' : 'HP'} />
                           <OutputBox label="Tc" value={outputs.turning?.Tc} unit="dk" />
                        </>
                    )}
                </div>
            </div>
             <div className="mt-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Hesap Geçmişi</h3>
                    <Button size="sm" variant="danger" onClick={clearHistory}>Temizle</Button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                    {history?.map(h => (<p key={h.id} className="text-xs text-slate-500 border-b py-1">{h.summary}</p>))}
                </div>
             </div>
        </div>
    );
};

export default CalculationToolsPage;