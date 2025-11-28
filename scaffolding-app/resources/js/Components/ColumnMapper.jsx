import { useState, useEffect } from 'react';

export default function ColumnMapper({ csvHeaders, dbColumns, autoMapping, onConfirm, onCancel }) {
    const [mapping, setMapping] = useState(autoMapping);

    // Actualizar el mapping cuando cambie el autoMapping (nuevo archivo)
    useEffect(() => {
        setMapping(autoMapping);
    }, [autoMapping]);

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleMappingChange = (dbColumn, csvIndex) => {
        setMapping(prev => ({
            ...prev,
            [dbColumn]: csvIndex !== '' ? parseInt(csvIndex) : null
        }));
    };

    const isComplete = dbColumns
        .filter(col => col.required)
        .every(col => mapping[col.name] !== null && mapping[col.name] !== undefined);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Column Mapping</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <div className="space-y-5">
                        {dbColumns.map((dbCol) => {
                            const csvIndex = mapping[dbCol.name];

                            return (
                                <div key={dbCol.name} className="flex items-start justify-between gap-6">
                                    {/* Left side - Database field info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {dbCol.name}
                                            </span>
                                            {dbCol.required && (
                                                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-medium">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Type: {dbCol.type}
                                        </div>
                                    </div>

                                    {/* Right side - CSV column selector */}
                                    <div className="flex-1">
                                        <select
                                            value={csvIndex ?? ''}
                                            onChange={(e) =>
                                                handleMappingChange(dbCol.name, e.target.value)
                                            }
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                backgroundPosition: 'right 0.5rem center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundSize: '1.5em 1.5em',
                                                paddingRight: '2.5rem'
                                            }}
                                        >
                                            <option value="">Select CSV column</option>
                                            {csvHeaders.map((header, index) => (
                                                <option key={index} value={index}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(mapping)}
                        disabled={!isComplete}
                        className={`flex-1 px-6 py-2.5 rounded-lg transition font-medium ${
                            isComplete
                                ? 'bg-blue-900 hover:bg-blue-800 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        style={isComplete ? { backgroundColor: '#1E3A8A' } : {}}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
