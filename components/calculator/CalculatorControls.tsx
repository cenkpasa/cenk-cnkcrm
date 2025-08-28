import React from 'react';

interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const LabeledInput = ({ label, ...props }: LabeledInputProps) => (
    <div className="flex flex-col">
        <label className="text-xs text-cnk-txt-muted-light mb-1">{label}</label>
        <input 
            type="text"
            className="w-full rounded-md border-cnk-border-light bg-cnk-bg-light px-3 py-2 text-cnk-txt-primary-light shadow-sm focus:border-cnk-accent-primary focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
            {...props} 
        />
    </div>
);

interface LabeledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
}

export const LabeledSelect = ({ label, children, ...props }: LabeledSelectProps) => (
     <div className="flex flex-col">
        <label className="text-xs text-cnk-txt-muted-light mb-1">{label}</label>
        <select 
            className="w-full rounded-md border-cnk-border-light bg-cnk-bg-light px-3 py-2 text-cnk-txt-primary-light shadow-sm focus:border-cnk-accent-primary focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
            {...props}
        >
            {children}
        </select>
    </div>
);


interface OutputBoxProps {
    label: string;
    value: string | undefined;
    unit: string;
}

export const OutputBox = ({ label, value, unit }: OutputBoxProps) => (
    <div className="flex flex-col bg-cnk-bg-light p-2 rounded-md border border-cnk-border-light">
        <label className="text-xs text-cnk-txt-muted-light">{label}</label>
        <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-cnk-accent-primary">{value || '–'}</span>
            <span className="text-sm text-cnk-txt-muted-light">{unit}</span>
        </div>
    </div>
);
