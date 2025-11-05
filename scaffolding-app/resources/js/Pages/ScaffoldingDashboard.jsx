import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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

    const handleFileSelect = async (file) => {
        if (!file) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert(`File uploaded successfully!\nProcessed: ${result.data.processed} records`);
                loadStats();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
        }
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

                            {uploading && (
                                <div className="text-center p-5 text-amber-500">Processing file...</div>
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
        </AuthenticatedLayout>
    );
}
