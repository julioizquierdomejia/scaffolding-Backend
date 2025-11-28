import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ColumnMapper from '@/Components/ColumnMapper';
import UploadModal from '@/Components/UploadModal';
import FilterModal from '@/Components/FilterModal';
import LocationsMap from '@/Components/LocationsMap';

// Scaffolding Dashboard - One-page design matching Figma
export default function ScaffoldingDashboard({ auth }) {
    const { auth: authProp } = usePage().props;
    const user = authProp?.user || auth?.user;
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
    const [locations, setLocations] = useState([]);
    const [allLocations, setAllLocations] = useState([]); // Store all locations for filtering
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'map'
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [showApiModal, setShowApiModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [timeRangeFilter, setTimeRangeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [geoFilters, setGeoFilters] = useState({
        filterType: 'area',
        latMin: '',
        latMax: '',
        lngMin: '',
        lngMax: '',
        centerLat: '',
        centerLng: '',
        radiusKm: ''
    });

    const API_BASE = '/api/v1';

    useEffect(() => {
        loadStats();
        loadLocations();
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

    const loadLocations = async () => {
        setLoadingLocations(true);
        try {
            const response = await fetch(`${API_BASE}/scaffolding_locations`);
            const data = await response.json();
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoadingLocations(false);
        }
    };

    const getErrorMessage = (error, status) => {
        const errorMap = {
            400: 'Invalid request',
            401: 'Unauthorized',
            403: 'Access denied',
            404: 'Endpoint not found',
            413: 'File too large',
            415: 'Unsupported type',
            422: 'Invalid data',
            429: 'Too many requests',
            500: 'Server error',
            502: 'Server down',
            503: 'Service unavailable',
        };

        if (status && errorMap[status]) {
            return errorMap[status];
        }

        if (error.message.includes('Failed to fetch')) {
            return 'No connection';
        }
        if (error.message.includes('NetworkError')) {
            return 'Network error';
        }
        if (error.message.includes('timeout')) {
            return 'Request timeout';
        }

        return 'Unknown error';
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        // Close upload modal
        setShowUploadModal(false);

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

            // Siempre mostrar el mapper para que el usuario confirme el mapeo
            setShowMapper(true);
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
                alert(`✅ File uploaded successfully!\n\nProcessed: ${result.data.processed} records\nTime: ${duration}s\nSpeed: ${Math.round(result.data.processed / duration)} records/s`);
                loadStats();
                loadLocations();
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

    // Haversine formula to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in kilometers
    };

    const handleFilterApply = (filters) => {
        setGeoFilters(filters);
        setShowFilterModal(false);

        // Apply filters to locations
        if (allLocations.length === 0) {
            setAllLocations(locations);
        }

        const baseLocations = allLocations.length > 0 ? allLocations : locations;

        // Filter by Area
        if (filters.filterType === 'area' && (filters.latMin || filters.latMax || filters.lngMin || filters.lngMax)) {
            const filtered = baseLocations.filter(loc => {
                const lat = parseFloat(loc.latitude);
                const lng = parseFloat(loc.longitude);

                if (filters.latMin && lat < parseFloat(filters.latMin)) return false;
                if (filters.latMax && lat > parseFloat(filters.latMax)) return false;
                if (filters.lngMin && lng < parseFloat(filters.lngMin)) return false;
                if (filters.lngMax && lng > parseFloat(filters.lngMax)) return false;

                return true;
            });
            setLocations(filtered);
        }
        // Filter by Radius
        else if (filters.filterType === 'radius' && filters.centerLat && filters.centerLng && filters.radiusKm) {
            const centerLat = parseFloat(filters.centerLat);
            const centerLng = parseFloat(filters.centerLng);
            const radius = parseFloat(filters.radiusKm);

            const filtered = baseLocations.filter(loc => {
                const lat = parseFloat(loc.latitude);
                const lng = parseFloat(loc.longitude);
                const distance = calculateDistance(centerLat, centerLng, lat, lng);
                return distance <= radius;
            });
            setLocations(filtered);
        }
        // No filters applied
        else {
            setLocations(baseLocations);
        }

        // Apply time range filter if active
        applyTimeRangeFilter(baseLocations.length > 0 ? baseLocations : locations, timeRangeFilter);
    };

    const applyTimeRangeFilter = (locationsToFilter, range) => {
        if (range === 'all') return;

        const now = new Date();
        let cutoffDate = new Date();

        switch (range) {
            case '7days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case '90days':
                cutoffDate.setDate(now.getDate() - 90);
                break;
            case '1year':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return;
        }

        const filtered = locationsToFilter.filter(loc => {
            if (!loc.created_at) return true;
            const locDate = new Date(loc.created_at);
            return locDate >= cutoffDate;
        });

        setLocations(filtered);
    };

    const handleTimeRangeChange = (range) => {
        setTimeRangeFilter(range);

        if (allLocations.length === 0) {
            setAllLocations(locations);
        }

        const baseLocations = allLocations.length > 0 ? allLocations : locations;

        if (range === 'all') {
            setLocations(baseLocations);
        } else {
            applyTimeRangeFilter(baseLocations, range);
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

    return (
        <>
            <Head title="Scaffolding Route Management System" />

            {/* Main container with light background - Fixed viewport height */}
            <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 flex-shrink-0">
                    <div className="max-w-full mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/adk-logo.jpg"
                                    alt="ADK Technology"
                                    className="h-10 w-auto"
                                />
                            </div>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                                >
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{backgroundColor: '#DBEAFE', color: '#1E3A8A'}}>
                                        {user?.name?.substring(0, 2).toUpperCase() || 'AM'}
                                    </div>
                                    <span className="font-medium">{user?.name || 'Administrador'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <Link
                                            href={route('profile.edit')}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Log Out
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content - Flex grow to fill remaining space */}
                <main className="flex-1 overflow-hidden flex flex-col px-[90px] py-6">
                    {/* Scaffolding Route Management System Section */}
                    <div className="mb-6 flex-shrink-0">
                        {/* Page Title and Description */}
                        <div className="mb-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold mb-3" style={{color: '#1E3A8A'}}>
                                        Scaffolding Route Management System
                                    </h1>
                                    <p className="text-gray-500 text-sm">
                                        Upload scaffolding location and provide real-time data to mobile applications for optimized route planning and navigation
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowApiModal(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-md hover:border-gray-400"
                                >
                                    <svg className="w-5 h-5 transition-transform duration-300 hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    API Documentation
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                    style={{backgroundColor: '#1E3A8A'}}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1E40AF'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1E3A8A'}
                                >
                                    <svg className="w-5 h-5 transition-transform duration-300 hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload excel
                                </button>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-4 gap-5">
                            {/* Total Locations */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-blue-300 cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-600 mb-1">Total Locations</div>
                                        <div className="text-xs text-gray-500 mb-3">Scaffolding point</div>
                                        <div className="text-4xl font-bold text-gray-900 transition-all duration-300">
                                            {loadingLocations ? (
                                                <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            ) : (
                                                stats.total_locations || 0
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12" style={{backgroundColor: '#1E3A8A'}}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Active Sites */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-green-300 cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-600 mb-1">Active Sites</div>
                                        <div className="text-xs text-gray-500 mb-3">Currently operational</div>
                                        <div className="text-4xl font-bold text-gray-900 transition-all duration-300">
                                            {loadingLocations ? (
                                                <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            ) : (
                                                stats.active_sites || 0
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12" style={{backgroundColor: '#1E3A8A'}}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Number of downloads */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-purple-300 cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-600 mb-1">Number of downloads</div>
                                        <div className="text-xs text-gray-500 mb-3">Number of app downloads</div>
                                        <div className="text-4xl font-bold text-gray-900 transition-all duration-300">0</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12" style={{backgroundColor: '#1E3A8A'}}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* App Download Revenue */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-yellow-300 cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-600 mb-1">App Download Revenue</div>
                                        <div className="text-xs text-gray-500 mb-3">USD amount</div>
                                        <div className="text-4xl font-bold text-gray-900 transition-all duration-300">$ 0</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12" style={{backgroundColor: '#1E3A8A'}}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Imported Data Section - Show when loading or has data */}
                    {(loadingLocations || locations.length > 0) && (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="mb-4 flex-shrink-0">
                                <h2 className="text-2xl font-bold mb-2" style={{color: '#1E3A8A'}}>Imported Data</h2>
                                <p className="text-gray-500 mb-4">View all scaffolds in the table or on the map.</p>

                                {/* Table/Map Tabs and Search/Filter Bar */}
                                <div className="flex items-center justify-between mb-4">
                            {/* Tabs and Results Counter */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-6 py-2 rounded-md font-medium transition ${
                                            viewMode === 'table'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Table
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`px-6 py-2 rounded-md font-medium transition ${
                                            viewMode === 'map'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Map
                                    </button>
                                </div>

                                {/* Results Counter */}
                                <div className="px-3 py-2 rounded-lg text-base font-semibold" style={{ backgroundColor: '#FFE3B4', color: '#F59E0B' }}>
                                    {locations.length.toLocaleString()} results
                                </div>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex items-center gap-4">
                                {/* Search Bar */}
                                <div className="relative w-80">
                                    <input
                                        type="text"
                                        placeholder="Search by name o direction"
                                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => {
                                            const searchTerm = e.target.value.toLowerCase();
                                            if (searchTerm === '') {
                                                loadLocations();
                                            } else {
                                                setLocations(prev => prev.filter(loc =>
                                                    loc.name?.toLowerCase().includes(searchTerm) ||
                                                    loc.address?.toLowerCase().includes(searchTerm)
                                                ));
                                            }
                                        }}
                                    />
                                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Time Range Dropdown */}
                                <select
                                    value={timeRangeFilter}
                                    onChange={(e) => handleTimeRangeChange(e.target.value)}
                                    className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                >
                                    <option value="all">All time</option>
                                    <option value="7days">Last 7 days</option>
                                    <option value="30days">Last 30 days</option>
                                    <option value="90days">Last 90 days</option>
                                    <option value="1year">Last year</option>
                                </select>

                                {/* Filter Button with Modal */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilterModal(!showFilterModal)}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 bg-white"
                                    >
                                        <span>Filters</span>
                                        <svg
                                            className={`w-4 h-4 transition-transform ${showFilterModal ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Filter Modal */}
                                    {showFilterModal && (
                                        <FilterModal
                                            onApply={handleFilterApply}
                                            onCancel={() => setShowFilterModal(false)}
                                            initialFilters={geoFilters}
                                        />
                                    )}
                                </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Table Section - Flex container with scroll */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                                {/* Table Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                                    <div className="text-sm text-gray-600">
                                        All {locations.length} results
                                    </div>
                                </div>

                                {/* Table or Map Content - Scrollable area */}
                                {viewMode === 'table' ? (
                                    <div className="overflow-auto flex-1">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordenadas</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        <div className="flex items-center gap-1">
                                                            Status
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {loadingLocations ? (
                                                    <>
                                                        {[...Array(5)].map((_, index) => (
                                                            <tr key={index} className="animate-pulse">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </>
                                                ) : locations.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-12 text-center">
                                                            <div className="text-gray-400">No locations found. Upload a file to get started.</div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    locations.slice(0, 10).map((location, index) => (
                                                        <tr key={location.id || index} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {location.name || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {location.address || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                                {location.latitude ? Number(location.latitude).toFixed(4) : 'N/A'}, {location.longitude ? Number(location.longitude).toFixed(4) : 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    location.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                    location.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {location.status === 'active' ? 'Active' :
                                                                     location.status === 'inactive' ? 'Inactive' :
                                                                     location.status === 'maintenance' ? 'Maintenance' : 'Active'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative">
                                        <LocationsMap locations={locations} simpleView={true} />
                                    </div>
                                )}

                                {/* Pagination */}
                                {locations.length > 10 && viewMode === 'table' && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                                        <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button className="px-3 py-1 text-sm text-white bg-blue-600 rounded">1</button>
                                            <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded">2</button>
                                            <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded">3</button>
                                            <span className="px-2 text-gray-500">...</span>
                                            <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded">10</button>
                                        </div>
                                        <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Upload Progress */}
                {uploading && (
                        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-96 z-50">
                            <div className="text-lg font-semibold text-gray-900 mb-4">Uploading file...</div>
                            <div className="mb-2">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progress</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analyzing */}
                    {analyzing && (
                        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-96 z-50">
                            <div className="text-lg font-semibold text-gray-900 mb-2">Analyzing CSV...</div>
                            <div className="text-sm text-gray-600">Reading headers and matching columns</div>
                        </div>
                    )}

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg border border-red-200 p-6 w-96 z-50">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <div className="text-red-800 font-semibold mb-2">Errors detected</div>
                                    <div className="space-y-1">
                                        {errors.map((error, index) => (
                                            <div key={index} className="text-red-700 text-sm">{error}</div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setErrors([])}
                                        className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                {/* API Documentation Modal */}
                {showApiModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-xl font-semibold text-gray-900">API Documentation</h2>
                                <button
                                    onClick={() => setShowApiModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="px-6 py-4 space-y-6">
                                {/* Base URL */}
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">Base URL</div>
                                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-800">
                                        {window.location.origin}{API_BASE}
                                    </div>
                                </div>

                                {/* Endpoints */}
                                <div className="space-y-4">
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">GET</span>
                                            <span className="font-mono text-sm">/scaffolding_locations</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">Fetch all scaffolding locations</p>
                                        <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                            <pre className="text-green-400 text-xs font-mono">
{`fetch('${window.location.origin}${API_BASE}/scaffolding_locations', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})`}
                                            </pre>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">GET</span>
                                            <span className="font-mono text-sm">/stats</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">Get system statistics</p>
                                        <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                            <pre className="text-green-400 text-xs font-mono">
{`fetch('${window.location.origin}${API_BASE}/stats', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})`}
                                            </pre>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">POST</span>
                                            <span className="font-mono text-sm">/upload-with-mapping</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">Upload CSV file with column mapping</p>
                                        <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                            <pre className="text-green-400 text-xs font-mono">
{`const formData = new FormData();
formData.append('file', file);
formData.append('mapping', JSON.stringify(mapping));

fetch('${window.location.origin}${API_BASE}/upload-with-mapping', {
  method: 'POST',
  body: formData
})`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setShowApiModal(false)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <UploadModal
                        onFileSelect={handleFileSelect}
                        onCancel={() => setShowUploadModal(false)}
                    />
                )}

                {/* Column Mapper Modal */}
                {showMapper && mappingData && (
                    <ColumnMapper
                        csvHeaders={mappingData.csv_headers}
                        dbColumns={mappingData.db_columns}
                        autoMapping={mappingData.auto_mapping}
                        onConfirm={handleMappingConfirm}
                        onCancel={handleMappingCancel}
                    />
                )}
            </div>
        </>
    );
}
