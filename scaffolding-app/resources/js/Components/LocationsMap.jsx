import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Rectangle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix para los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente para ajustar el mapa a los marcadores
function FitBounds({ locations }) {
    const map = useMap();

    useEffect(() => {
        if (locations.length > 0) {
            const bounds = locations.map(loc => [
                parseFloat(loc.lat || loc.latitude),
                parseFloat(loc.lng || loc.longitude)
            ]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
    }, [locations, map]);

    return null;
}

export default function LocationsMap({ locations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ageFilter, setAgeFilter] = useState('all');

    // Estados para filtros geográficos
    const [geoFilterType, setGeoFilterType] = useState('none'); // 'none', 'radius', 'bbox'
    const [radiusLat, setRadiusLat] = useState('40.7580');
    const [radiusLng, setRadiusLng] = useState('-73.9855');
    const [radius, setRadius] = useState('5');
    const [minLat, setMinLat] = useState('40.70');
    const [maxLat, setMaxLat] = useState('40.80');
    const [minLng, setMinLng] = useState('-74.02');
    const [maxLng, setMaxLng] = useState('-73.93');
    const [geoFilteredLocations, setGeoFilteredLocations] = useState(null);
    const [isLoadingGeoFilter, setIsLoadingGeoFilter] = useState(false);
    const [showGeoFilters, setShowGeoFilters] = useState(false);

    // Usar ubicaciones filtradas geográficamente si existen, sino las originales
    const workingLocations = geoFilteredLocations || locations;

    // Aplicar filtro geográfico
    const applyGeoFilter = async () => {
        setIsLoadingGeoFilter(true);
        try {
            let url = '/api/v1/scaffolds';
            const params = new URLSearchParams();

            if (geoFilterType === 'radius') {
                params.append('lat', radiusLat);
                params.append('lng', radiusLng);
                params.append('radius', radius);
            } else if (geoFilterType === 'bbox') {
                params.append('minLat', minLat);
                params.append('maxLat', maxLat);
                params.append('minLng', minLng);
                params.append('maxLng', maxLng);
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await axios.get(url);
            setGeoFilteredLocations(response.data);
        } catch (error) {
            console.error('Error aplicando filtro geográfico:', error);
            alert('Error al aplicar filtro geográfico. Verifica los parámetros.');
        } finally {
            setIsLoadingGeoFilter(false);
        }
    };

    // Limpiar filtro geográfico
    const clearGeoFilter = () => {
        setGeoFilteredLocations(null);
        setGeoFilterType('none');
    };

    // Filtrar ubicaciones (filtros normales)
    const filteredLocations = useMemo(() => {
        return workingLocations.filter(location => {
            const lat = location.lat || location.latitude;
            const lng = location.lng || location.longitude;
            const name = location.name || '';
            const address = location.address || '';
            const status = location.status || 'active';
            const created_at = location.created_at;

            const matchesSearch =
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                address.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || status === statusFilter;

            // Calcular antigüedad en días
            const createdDate = new Date(created_at);
            const today = new Date();
            const ageInDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

            let matchesAge = true;
            if (ageFilter === 'new') matchesAge = ageInDays <= 30;
            else if (ageFilter === 'recent') matchesAge = ageInDays > 30 && ageInDays <= 90;
            else if (ageFilter === 'old') matchesAge = ageInDays > 90 && ageInDays <= 365;
            else if (ageFilter === 'very-old') matchesAge = ageInDays > 365;

            return matchesSearch && matchesStatus && matchesAge;
        });
    }, [workingLocations, searchTerm, statusFilter, ageFilter]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const total = filteredLocations.length;
        const totalActive = filteredLocations.filter(l => (l.status || 'active') === 'active').length;
        const totalInactive = filteredLocations.filter(l => l.status === 'inactive').length;
        const totalMaintenance = filteredLocations.filter(l => l.status === 'maintenance').length;

        const totalDays = filteredLocations.reduce((sum, location) => {
            if (!location.created_at) return sum;
            const createdDate = new Date(location.created_at);
            const today = new Date();
            const ageInDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
            return sum + ageInDays;
        }, 0);

        const avgAge = total > 0 ? Math.round(totalDays / total) : 0;

        return {
            total,
            active: totalActive,
            inactive: totalInactive,
            maintenance: totalMaintenance,
            avgAge
        };
    }, [filteredLocations]);

    // Centro por defecto (USA central)
    const defaultCenter = [39.8283, -98.5795];
    const defaultZoom = 4;

    // Crear icono de cluster personalizado
    const createClusterCustomIcon = (cluster) => {
        const count = cluster.getChildCount();
        let size = 40;
        let className = 'custom-cluster-icon';

        if (count < 10) {
            size = 40;
        } else if (count < 100) {
            size = 50;
        } else if (count < 1000) {
            size = 60;
        } else {
            size = 70;
        }

        return L.divIcon({
            html: `<div style="
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 3px 12px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${size * 0.35}px;
                font-weight: bold;
                color: white;
            ">${count}</div>`,
            className: className,
            iconSize: L.point(size, size, true),
        });
    };

    const getStatusIcon = (location) => {
        let color;
        const status = location.status || 'active';
        switch(status) {
            case 'active':
                color = '#10b981'; // emerald-500
                break;
            case 'inactive':
                color = '#6b7280'; // gray-500
                break;
            case 'maintenance':
                color = '#f59e0b'; // amber-500
                break;
            default:
                color = '#6b7280';
        }

        // Calcular tamaño basado en antigüedad
        let size = 20;
        if (location.created_at) {
            const createdDate = new Date(location.created_at);
            const today = new Date();
            const ageInDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

            if (ageInDays > 365) size = 40;
            else if (ageInDays > 180) size = 35;
            else if (ageInDays > 90) size = 30;
            else if (ageInDays > 30) size = 25;
        }

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'active':
                return 'Activo';
            case 'inactive':
                return 'Inactivo';
            case 'maintenance':
                return 'Mantenimiento';
            default:
                return status || 'Activo';
        }
    };

    const getAgeInDays = (createdAt) => {
        if (!createdAt) return 0;
        const createdDate = new Date(createdAt);
        const today = new Date();
        return Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
    };

    if (locations.length === 0) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-[600px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🗺️</div>
                    <div className="text-gray-400 text-lg">No hay ubicaciones para mostrar en el mapa</div>
                    <div className="text-gray-600 text-sm mt-2">Sube un archivo CSV para ver los andamios</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                    <div className="text-gray-500 text-xs mb-1">Total</div>
                    <div className="text-white text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 border border-emerald-500/30">
                    <div className="text-gray-500 text-xs mb-1">Activos</div>
                    <div className="text-emerald-400 text-2xl font-bold">{stats.active}</div>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 border border-amber-500/30">
                    <div className="text-gray-500 text-xs mb-1">Mantenimiento</div>
                    <div className="text-amber-400 text-2xl font-bold">{stats.maintenance}</div>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 border border-gray-500/30">
                    <div className="text-gray-500 text-xs mb-1">Inactivos</div>
                    <div className="text-gray-400 text-2xl font-bold">{stats.inactive}</div>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                    <div className="text-gray-500 text-xs mb-1">Edad Promedio</div>
                    <div className="text-white text-2xl font-bold">{stats.avgAge}<span className="text-sm text-gray-500">d</span></div>
                </div>
            </div>

            {/* Filtros Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                        <option value="maintenance">En mantenimiento</option>
                    </select>
                </div>
                <div>
                    <select
                        value={ageFilter}
                        onChange={(e) => setAgeFilter(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="all">Todas las antigüedades</option>
                        <option value="new">Nuevos (≤ 30 días)</option>
                        <option value="recent">Recientes (31-90 días)</option>
                        <option value="old">Antiguos (91-365 días)</option>
                        <option value="very-old">Muy antiguos (&gt; 365 días)</option>
                    </select>
                </div>
            </div>

            {/* Botón para mostrar filtros geográficos */}
            <div className="mb-4">
                <button
                    onClick={() => setShowGeoFilters(!showGeoFilters)}
                    className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <span>🌍</span>
                    <span>{showGeoFilters ? 'Ocultar' : 'Mostrar'} Filtros Geográficos</span>
                </button>
            </div>

            {/* Panel de Filtros Geográficos */}
            {showGeoFilters && (
                <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-blue-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <span>🗺️</span>
                            <span>Filtros Geográficos</span>
                        </h3>
                        {geoFilteredLocations && (
                            <button
                                onClick={clearGeoFilter}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                            >
                                ✕ Limpiar filtro
                            </button>
                        )}
                    </div>

                    {/* Pestañas */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setGeoFilterType('radius')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                geoFilterType === 'radius'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                            }`}
                        >
                            📍 Filtro por Radio
                        </button>
                        <button
                            onClick={() => setGeoFilterType('bbox')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                geoFilterType === 'bbox'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                            }`}
                        >
                            ▭ Filtro por Área
                        </button>
                    </div>

                    {/* Filtro por Radio */}
                    {geoFilterType === 'radius' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Latitud</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={radiusLat}
                                        onChange={(e) => setRadiusLat(e.target.value)}
                                        placeholder="Ej: 40.7580"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Longitud</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={radiusLng}
                                        onChange={(e) => setRadiusLng(e.target.value)}
                                        placeholder="Ej: -73.9855"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Radio (km)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={radius}
                                        onChange={(e) => setRadius(e.target.value)}
                                        placeholder="Ej: 5"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs">
                                💡 Busca todas las ubicaciones dentro de un radio específico desde un punto central
                            </p>
                        </div>
                    )}

                    {/* Filtro por Bounding Box */}
                    {geoFilterType === 'bbox' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Lat Mín</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={minLat}
                                        onChange={(e) => setMinLat(e.target.value)}
                                        placeholder="40.70"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Lat Máx</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={maxLat}
                                        onChange={(e) => setMaxLat(e.target.value)}
                                        placeholder="40.80"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Lng Mín</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={minLng}
                                        onChange={(e) => setMinLng(e.target.value)}
                                        placeholder="-74.02"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Lng Máx</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={maxLng}
                                        onChange={(e) => setMaxLng(e.target.value)}
                                        placeholder="-73.93"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs">
                                💡 Busca todas las ubicaciones dentro de un área rectangular
                            </p>
                        </div>
                    )}

                    {/* Botón aplicar */}
                    {geoFilterType !== 'none' && (
                        <button
                            onClick={applyGeoFilter}
                            disabled={isLoadingGeoFilter}
                            className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            {isLoadingGeoFilter ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    <span>Aplicando filtro...</span>
                                </>
                            ) : (
                                <>
                                    <span>🎯</span>
                                    <span>Aplicar Filtro Geográfico</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Indicador de filtro activo */}
            {geoFilteredLocations && (
                <div className="mb-4 p-3 bg-blue-950 border border-blue-500 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-300 text-sm">
                            <span>✓</span>
                            <span>
                                Filtro geográfico activo: {geoFilterType === 'radius' ?
                                    `Radio de ${radius} km desde (${radiusLat}, ${radiusLng})` :
                                    `Área: Lat ${minLat}-${maxLat}, Lng ${minLng}-${maxLng}`
                                }
                            </span>
                        </div>
                        <span className="text-blue-400 font-bold">{geoFilteredLocations.length} resultados</span>
                    </div>
                </div>
            )}

            {/* Leyenda */}
            <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="text-gray-400 text-xs font-semibold mb-2 uppercase">Estado</div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                        <span className="text-gray-300">Activos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white"></div>
                        <span className="text-gray-300">Mantenimiento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded-full border-2 border-white"></div>
                        <span className="text-gray-300">Inactivos</span>
                    </div>
                </div>
            </div>

            {filteredLocations.length === 0 ? (
                <div className="bg-zinc-950 rounded-lg p-12 text-center border border-zinc-800">
                    <div className="text-4xl mb-3">🔍</div>
                    <div className="text-gray-400">No se encontraron ubicaciones con los filtros seleccionados</div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setAgeFilter('all');
                            clearGeoFilter();
                        }}
                        className="mt-4 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Limpiar todos los filtros
                    </button>
                </div>
            ) : (
                <div className="rounded-xl overflow-hidden" style={{ height: '600px' }}>
                    <MapContainer
                        center={defaultCenter}
                        zoom={defaultZoom}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                        preferCanvas={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                        />

                        {/* Mostrar círculo de radio si está activo */}
                        {geoFilterType === 'radius' && geoFilteredLocations && (
                            <Circle
                                center={[parseFloat(radiusLat), parseFloat(radiusLng)]}
                                radius={parseFloat(radius) * 1000} // convertir km a metros
                                pathOptions={{
                                    color: '#3b82f6',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.1,
                                    weight: 2
                                }}
                            />
                        )}

                        {/* Mostrar rectángulo de bounding box si está activo */}
                        {geoFilterType === 'bbox' && geoFilteredLocations && (
                            <Rectangle
                                bounds={[
                                    [parseFloat(minLat), parseFloat(minLng)],
                                    [parseFloat(maxLat), parseFloat(maxLng)]
                                ]}
                                pathOptions={{
                                    color: '#3b82f6',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.1,
                                    weight: 2
                                }}
                            />
                        )}

                        <MarkerClusterGroup
                            chunkedLoading
                            iconCreateFunction={createClusterCustomIcon}
                            spiderfyOnMaxZoom={true}
                            showCoverageOnHover={false}
                            zoomToBoundsOnClick={true}
                            maxClusterRadius={50}
                            disableClusteringAtZoom={16}
                        >
                            {filteredLocations.map((location) => {
                                const lat = parseFloat(location.lat || location.latitude);
                                const lng = parseFloat(location.lng || location.longitude);
                                const name = location.name || 'Sin nombre';
                                const address = location.address || '';
                                const status = location.status || 'active';
                                const distance = location.distance;

                                return (
                                    <Marker
                                        key={location.id}
                                        position={[lat, lng]}
                                        icon={getStatusIcon(location)}
                                    >
                                        <Popup>
                                            <div className="p-2" style={{ minWidth: '200px' }}>
                                                <div className="font-bold text-lg mb-2">{name}</div>

                                                {address && (
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        📍 {address}
                                                    </div>
                                                )}

                                                <div className="text-xs text-gray-500 mb-2 font-mono">
                                                    {lat}, {lng}
                                                </div>

                                                {distance !== undefined && (
                                                    <div className="text-sm text-blue-600 font-semibold mb-2">
                                                        📏 {distance.toFixed(2)} km de distancia
                                                    </div>
                                                )}

                                                <div className="mb-2">
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                                        status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                        status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {getStatusLabel(status)}
                                                    </span>
                                                </div>

                                                {location.created_at && (
                                                    <div className="text-xs text-gray-600 mb-2">
                                                        ⏱️ {getAgeInDays(location.created_at)} días de antigüedad
                                                    </div>
                                                )}

                                                {location.notes && (
                                                    <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                                                        📝 {location.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MarkerClusterGroup>

                        <FitBounds locations={filteredLocations} />
                    </MapContainer>
                </div>
            )}
        </div>
    );
}
