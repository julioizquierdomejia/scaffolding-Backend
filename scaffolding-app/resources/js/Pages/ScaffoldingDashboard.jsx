import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ColumnMapper from '@/Components/ColumnMapper';

// Scaffolding Dashboard - With column mapping, progress bar and error handling
export default function ScaffoldingDashboard({ auth }) {
    const [stats, setStats] = useState({
        total_locations: 0,
        active_sites: 0,
        inactive_sites: 0,
        maintenance_sites: 0,
        api_status: 'online',
        coverage: 0
    });
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [mappingData, setMappingData] = useState(null);
    const [showMapper, setShowMapper] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState([]);

    const API_BASE = 'http://localhost:8000/api/v1';

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const getErrorMessage = (error, status) => {
        const errorMap = {
            400: 'Solicitud inválida',
            401: 'No autorizado',
            403: 'Acceso denegado',
            404: 'Endpoint no encontrado',
            413: 'Archivo muy grande',
            415: 'Tipo no soportado',
            422: 'Datos inválidos',
            429: 'Muchas solicitudes',
            500: 'Error del servidor',
            502: 'Servidor caído',
            503: 'Servicio no disponible',
        };

        if (status && errorMap[status]) {
            return errorMap[status];
        }

        if (error.message.includes('Failed to fetch')) {
            return 'Sin conexión';
        }
        if (error.message.includes('NetworkError')) {
            return 'Error de red';
        }
        if (error.message.includes('timeout')) {
            return 'Tiempo agotado';
        }

        return 'Error desconocido';
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        setSelectedFile(file);
        setAnalyzing(true);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/analyze-csv`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                const errorMsg = getErrorMessage(new Error(text), response.status);
                setErrors([errorMsg]);
                throw new Error(errorMsg);
            }

            const result = await response.json();
            setMappingData(result);

            if (result.requires_manual_mapping) {
                setShowMapper(true);
            } else {
                await uploadWithMapping(file, result.auto_mapping);
            }
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const uploadWithMapping = async (file, mapping) => {
        setUploading(true);
        setShowMapper(false);
        setUploadProgress(0);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mapping', JSON.stringify(mapping));

        const startTime = Date.now();

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 200);

        try {
            const response = await fetch(`${API_BASE}/upload-with-mapping`, {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const result = await response.json().catch(() => ({ message: 'Error desconocido' }));
                const errorMsg = getErrorMessage(new Error(result.message), response.status);
                setErrors([errorMsg]);
                setUploadProgress(0);
                return;
            }

            const result = await response.json();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            setUploadProgress(100);

            setTimeout(() => {
                alert(`✅ Archivo subido exitosamente!\n\nProcesados: ${result.data.processed} registros\nTiempo: ${duration}s\nVelocidad: ${Math.round(result.data.processed / duration)} registros/s`);
                loadStats();
                setSelectedFile(null);
                setMappingData(null);
                setUploadProgress(0);
            }, 500);

        } catch (error) {
            clearInterval(progressInterval);
            const errorMsg = getErrorMessage(error, null);
            setErrors([errorMsg]);
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleMappingConfirm = (mapping) => {
        uploadWithMapping(selectedFile, mapping);
    };

    const handleMappingCancel = () => {
        setShowMapper(false);
        setSelectedFile(null);
        setMappingData(null);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const activeGrowth = stats.active_sites > 0 ? '+12%' : '+0%';
    const coverageGrowth = stats.coverage > 0 ? '+8%' : '+0%';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Scaffolding Dashboard
                </h2>
            }
        >
            <Head title="Scaffolding Route Management System" />

            <div className="min-h-screen bg-gray-900 text-white p-5">
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-10">
                        <div className="w-15 h-15 bg-amber-500 mx-auto mb-5 rounded-xl flex items-center justify-center text-3xl">
                            📍
                        </div>
                        <h1 className="text-amber-500 text-3xl font-bold mb-2">
                            Scaffolding Route Management System
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Upload scaffolding locations and provide real-time data to mobile applications for optimized route planning and navigation
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                            <div className="text-amber-500 text-2xl mb-4">📍</div>
                            <div className="text-gray-500 text-xs mb-2">Total Locations</div>
                            <div className="text-4xl font-bold">{stats.total_locations}</div>
                            <div className="text-gray-600 text-xs mt-1">Scaffolding points</div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                            <div className="absolute top-5 right-5 text-emerald-500 text-xs font-bold">
                                {activeGrowth}
                            </div>
                            <div className="text-amber-500 text-2xl mb-4">⚡</div>
                            <div className="text-gray-500 text-xs mb-2">Active Sites</div>
                            <div className="text-4xl font-bold">{stats.active_sites}</div>
                            <div className="text-gray-600 text-xs mt-1">Currently operational</div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                            <div className="text-amber-500 text-2xl mb-4">💾</div>
                            <div className="text-gray-500 text-xs mb-2">API Status</div>
                            <div className="text-amber-500 text-2xl font-bold">Online</div>
                            <div className="text-gray-600 text-xs mt-1">Ready for mobile app</div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                            <div className="absolute top-5 right-5 text-emerald-500 text-xs font-bold">
                                {coverageGrowth}
                            </div>
                            <div className="text-amber-500 text-2xl mb-4">📊</div>
                            <div className="text-gray-500 text-xs mb-2">Coverage</div>
                            <div className="text-4xl font-bold">{stats.coverage}%</div>
                            <div className="text-gray-600 text-xs mt-1">Route availability</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-amber-500 text-lg mb-5 flex items-center gap-2">
                                📁 Upload Excel File
                            </h2>

                            <div className="bg-zinc-950 p-3 rounded-lg mb-5">
                                <div className="text-gray-500 text-xs mb-2">Expected columns:</div>
                                <div className="text-amber-500 text-xs font-mono">
                                    name, latitude, longitude, address (optional), status (optional), notes (optional)
                                </div>
                            </div>

                            <div
                                className={`border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-all ${
                                    dragActive
                                        ? 'border-amber-500 bg-zinc-800'
                                        : 'border-zinc-700 hover:border-amber-500 hover:bg-zinc-800'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                <div className="text-5xl text-amber-500 mb-5">⬆️</div>
                                <div className="text-white text-base mb-2">Click to upload or drag and drop</div>
                                <div className="text-gray-600 text-xs">Excel files (.xlsx, .xls, .csv)</div>
                            </div>

                            <input
                                type="file"
                                id="fileInput"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                            />

                            {errors.length > 0 && (
                                <div className="mt-4 bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-red-500 text-2xl">⚠️</div>
                                        <div className="flex-1">
                                            <div className="text-red-400 font-bold mb-2">Errores detectados</div>
                                            <div className="space-y-1">
                                                {errors.map((error, index) => (
                                                    <div key={index} className="text-red-300 text-sm flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                        {error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {analyzing && (
                                <div className="text-center p-5">
                                    <div className="text-amber-500 text-lg font-bold mb-2">🔍 Analizando CSV...</div>
                                    <div className="text-gray-400 text-sm">Leyendo cabeceras y haciendo match</div>
                                </div>
                            )}

                            {uploading && (
                                <div className="p-5">
                                    <div className="text-amber-500 text-lg font-bold mb-4 text-center">⚡ Procesando archivo...</div>

                                    <div className="mb-2">
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>Progreso</span>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="text-gray-400 text-xs text-center mt-3">
                                        Usando bulk insert para procesar más rápido
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-amber-500 text-lg mb-5 flex items-center gap-2">
                                ⚙️ API Documentation
                            </h2>

                            <div className="bg-zinc-950 p-4 rounded-lg mb-4">
                                <div className="text-gray-500 text-xs mb-2">Base URL</div>
                                <div className="bg-zinc-900 p-3 rounded font-mono text-xs text-amber-500 break-all">
                                    {API_BASE}
                                </div>
                            </div>

                            <div className="bg-zinc-950 p-4 rounded-lg mb-4">
                                <div className="text-gray-500 text-xs mb-2">
                                    <span className="inline-block bg-emerald-500 text-black px-2 py-1 rounded text-xs font-bold mr-2">
                                        GET
                                    </span>
                                    Fetch all scaffolding locations
                                </div>
                                <div className="bg-zinc-900 p-3 rounded font-mono text-xs text-amber-500">
                                    /scaffolding_locations
                                </div>
                            </div>

                            <div className="bg-black p-4 rounded font-mono text-xs overflow-x-auto text-emerald-500">
                                {`fetch('${API_BASE}/scaffolding_locations'){\n`}
                                {`  headers: {\n`}
                                {`    'apikey': 'YOUR_ANON_KEY',\n`}
                                {`    'Content-Type': 'application/json'\n`}
                                {`  }\n`}
                                {`}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showMapper && mappingData && (
                <ColumnMapper
                    csvHeaders={mappingData.csv_headers}
                    dbColumns={mappingData.db_columns}
                    autoMapping={mappingData.auto_mapping}
                    onConfirm={handleMappingConfirm}
                    onCancel={handleMappingCancel}
                />
            )}
        </AuthenticatedLayout>
    );
}
