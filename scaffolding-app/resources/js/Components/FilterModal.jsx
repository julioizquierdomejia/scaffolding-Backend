import { useState, useEffect } from 'react';

export default function FilterModal({ onApply, onCancel, initialFilters }) {
    const [activeTab, setActiveTab] = useState(initialFilters?.filterType || 'area'); // 'radius' or 'area'
    const [filters, setFilters] = useState({
        filterType: initialFilters?.filterType || 'area',
        // Area filters
        latMin: initialFilters?.latMin || '',
        latMax: initialFilters?.latMax || '',
        lngMin: initialFilters?.lngMin || '',
        lngMax: initialFilters?.lngMax || '',
        // Radius filters
        centerLat: initialFilters?.centerLat || '',
        centerLng: initialFilters?.centerLng || '',
        radiusKm: initialFilters?.radiusKm || ''
    });

    const handleInputChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCleanFilters = () => {
        setFilters({
            filterType: activeTab,
            latMin: '',
            latMax: '',
            lngMin: '',
            lngMax: '',
            centerLat: '',
            centerLng: '',
            radiusKm: ''
        });
    };

    const handleApply = () => {
        onApply({ ...filters, filterType: activeTab });
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFilters(prev => ({ ...prev, filterType: tab }));
    };

    return (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-96 z-50">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Filter options</h3>
                <button
                    onClick={handleCleanFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Clean Filters
                </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-gray-200">
                <div className="flex gap-1 -mb-px">
                    <button
                        onClick={() => handleTabChange('radius')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                            activeTab === 'radius'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Filter by Radius
                    </button>
                    <button
                        onClick={() => handleTabChange('area')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                            activeTab === 'area'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Filter by Area
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
                {activeTab === 'area' && (
                    <div className="space-y-4">
                        {/* Latitude Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Lat Min
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filters.latMin}
                                    onChange={(e) => handleInputChange('latMin', e.target.value)}
                                    placeholder="40.70"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Lat Max
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filters.latMax}
                                    onChange={(e) => handleInputChange('latMax', e.target.value)}
                                    placeholder="40.80"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Longitude Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Lng Min
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filters.lngMin}
                                    onChange={(e) => handleInputChange('lngMin', e.target.value)}
                                    placeholder="-74.02"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Lng Max
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filters.lngMax}
                                    onChange={(e) => handleInputChange('lngMax', e.target.value)}
                                    placeholder="-73.93"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'radius' && (
                    <div className="space-y-4">
                        {/* Center Coordinates */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Center Latitude
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={filters.centerLat}
                                onChange={(e) => handleInputChange('centerLat', e.target.value)}
                                placeholder="40.7128"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Center Longitude
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={filters.centerLng}
                                onChange={(e) => handleInputChange('centerLng', e.target.value)}
                                placeholder="-74.0060"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Radius */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Radius (kilometers)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={filters.radiusKm}
                                onChange={(e) => handleInputChange('radiusKm', e.target.value)}
                                placeholder="10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 px-4 py-2 text-white rounded-lg transition font-medium text-sm"
                    style={{ backgroundColor: '#1E3A8A' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1E40AF'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1E3A8A'}
                >
                    Apply
                </button>
            </div>
        </div>
    );
}
