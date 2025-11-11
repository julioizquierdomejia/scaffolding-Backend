import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
            const bounds = locations.map(loc => [parseFloat(loc.latitude), parseFloat(loc.longitude)]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [locations, map]);

    return null;
}

export default function LocationsMap({ locations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ageFilter, setAgeFilter] = useState('all');

    // Filtrar ubicaciones
    const filteredLocations = useMemo(() => {
        return locations.filter(location => {
            const matchesSearch =
                location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || location.status === statusFilter;

            // Calcular antigüedad en días
            const createdDate = new Date(location.created_at);
            const today = new Date();
            const ageInDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

            let matchesAge = true;
            if (ageFilter === 'new') matchesAge = ageInDays <= 30;
            else if (ageFilter === 'recent') matchesAge = ageInDays > 30 && ageInDays <= 90;
            else if (ageFilter === 'old') matchesAge = ageInDays > 90 && ageInDays <= 365;
            else if (ageFilter === 'very-old') matchesAge = ageInDays > 365;

            return matchesSearch && matchesStatus && matchesAge;
        });
    }, [locations, searchTerm, statusFilter, ageFilter]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const totalActive = filteredLocations.filter(l => l.status === 'active').length;
        const totalInactive = filteredLocations.filter(l => l.status === 'inactive').length;
        const totalMaintenance = filteredLocations.filter(l => l.status === 'maintenance').length;

        const totalDays = filteredLocations.reduce((sum, location) => {
            const createdDate = new Date(location.created_at);
            const today = new Date();
            const ageInDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
            return sum + ageInDays;
        }, 0);

        const avgAge = filteredLocations.length > 0 ? Math.round(totalDays / filteredLocations.length) : 0;

        return {
            total: filteredLocations.length,
            active: totalActive,
            inactive: totalInactive,
            maintenance: totalMaintenance,
            avgAge
        };
    }, [filteredLocations]);

    // Centro por defecto (USA central)
    const defaultCenter = [39.8283, -98.5795];
    const defaultZoom = 4;

    const getStatusIcon = (location) => {
        let color;
        switch(location.status) {
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
        const createdDate = new Date(location.created_at);
        const today = new Date();
        const ageInDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

        let size = 20;
        if (ageInDays > 365) size = 40;
        else if (ageInDays > 180) size = 35;
        else if (ageInDays > 90) size = 30;
        else if (ageInDays > 30) size = 25;

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${size * 0.4}px;
                font-weight: bold;
                color: white;
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
                return status || 'N/A';
        }
    };

    const getAgeInDays = (createdAt) => {
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

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

            {/* Leyenda */}
            <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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
                    <div>
                        <div className="text-gray-400 text-xs font-semibold mb-2 uppercase">Antigüedad (tamaño)</div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                <span className="text-gray-300">≤30d</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                <span className="text-gray-300">31-90d</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-white rounded-full"></div>
                                <span className="text-gray-300">91-365d</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-5 h-5 bg-white rounded-full"></div>
                                <span className="text-gray-300">&gt;365d</span>
                            </div>
                        </div>
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
                        }}
                        className="mt-4 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="rounded-xl overflow-hidden" style={{ height: '600px' }}>
                    <MapContainer
                        center={defaultCenter}
                        zoom={defaultZoom}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {filteredLocations.map((location) => (
                            <Marker
                                key={location.id}
                                position={[parseFloat(location.latitude), parseFloat(location.longitude)]}
                                icon={getStatusIcon(location)}
                            >
                                <Popup>
                                    <div className="p-2" style={{ minWidth: '200px' }}>
                                        <div className="font-bold text-lg mb-2">{location.name}</div>

                                        {location.address && (
                                            <div className="text-sm text-gray-600 mb-2">
                                                📍 {location.address}
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-500 mb-2 font-mono">
                                            {location.latitude}, {location.longitude}
                                        </div>

                                        <div className="mb-2">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                                location.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                location.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {getStatusLabel(location.status)}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-600 mb-2">
                                            ⏱️ {getAgeInDays(location.created_at)} días de antigüedad
                                        </div>

                                        {location.notes && (
                                            <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                                                📝 {location.notes}
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        <FitBounds locations={filteredLocations} />
                    </MapContainer>
                </div>
            )}
        </div>
    );
}
