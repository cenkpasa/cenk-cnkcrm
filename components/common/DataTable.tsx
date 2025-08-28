import React, { ReactNode, useState } from 'react';
import EmptyState from './EmptyState';
import Button from './Button';

interface Column<T> {
    header: React.ReactNode;
    accessor: (item: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyStateMessage?: string;
    itemsPerPage?: number;
}

const DataTable = <T,>(props: DataTableProps<T>) => {
    const { columns, data, emptyStateMessage = "Gösterilecek veri yok.", itemsPerPage = 10 } = props;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-cnk-border-light bg-cnk-panel-light">
            <table className="w-full min-w-max text-sm text-left text-cnk-txt-secondary-light">
                <thead className="text-xs text-cnk-txt-primary-light uppercase bg-cnk-bg-light">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} scope="col" className="px-6 py-3 font-semibold">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.length > 0 ? (
                        paginatedData.map((item, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-cnk-border-light hover:bg-cnk-bg-light">
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                                        {col.accessor(item)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="p-4">
                                <EmptyState message={emptyStateMessage} icon="fas fa-database" />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-cnk-bg-light">
                    <span className="text-sm text-cnk-txt-muted-light">
                        Sayfa {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button onClick={handlePrevPage} disabled={currentPage === 1} size="sm">
                            <i className="fas fa-chevron-left"></i>
                        </Button>
                        <Button onClick={handleNextPage} disabled={currentPage === totalPages} size="sm">
                            <i className="fas fa-chevron-right"></i>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;