import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReactNode } from 'react';

interface ExportColumn<T> {
    header: string;
    accessor: (item: T) => string | number | ReactNode;
}

const getExportValue = (value: ReactNode): string => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'object' && value && 'props' in value) {
        return String((value as any).props.children || '');
    }
    return '';
};


export const exportToExcel = <T,>(data: T[], columns: ExportColumn<T>[], fileName: string) => {
    const exportData = data.map(row => {
        const newRow: Record<string, any> = {};
        columns.forEach(col => {
            newRow[col.header] = getExportValue(col.accessor(row));
        });
        return newRow;
    });
    
    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Rapor');
    writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPdf = <T,>(data: T[], columns: ExportColumn<T>[], title: string, fileName: string) => {
    const doc = new jsPDF();
    
    doc.text(title, 14, 20);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => getExportValue(col.accessor(row)))),
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue color
    });

    doc.save(`${fileName}.pdf`);
};