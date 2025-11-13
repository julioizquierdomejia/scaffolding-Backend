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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-amber-500 mb-2">
                    Column Mapping
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                    Map your CSV columns to database fields. Required fields must be mapped to continue.
                </p>

                <div className="space-y-4 mb-6">
                    {dbColumns.map((dbCol) => {
                        const csvIndex = mapping[dbCol.name];
                        const isMapped = csvIndex !== null && csvIndex !== undefined;

                        return (
                            <div
                                key={dbCol.name}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white font-semibold">
                                                {dbCol.name}
                                            </span>
                                            {dbCol.required && (
                                                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Type: {dbCol.type}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-16 h-0.5 transition-all ${
                                                isMapped
                                                    ? 'bg-emerald-500'
                                                    : 'bg-zinc-700'
                                            }`}
                                        >
                                            {isMapped && (
                                                <div className="relative">
                                                    <div className="absolute -right-1 -top-1 w-2 h-2 bg-emerald-500 rounded-full" />
                                                </div>
                                            )}
                                        </div>

                                        <select
                                            value={csvIndex ?? ''}
                                            onChange={(e) =>
                                                handleMappingChange(dbCol.name, e.target.value)
                                            }
                                            className={`bg-zinc-800 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 ${
                                                isMapped
                                                    ? 'border-emerald-500 focus:ring-emerald-500'
                                                    : 'border-zinc-700 focus:ring-amber-500'
                                            }`}
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
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(mapping)}
                        disabled={!isComplete}
                        className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
                            isComplete
                                ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold'
                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                        }`}
                    >
                        {isComplete ? 'Confirm & Upload' : 'Complete Required Fields'}
                    </button>
                </div>
            </div>
        </div>
    );
}
