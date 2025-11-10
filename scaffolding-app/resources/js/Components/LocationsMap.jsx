import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
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
    // Centro por defecto (USA central)
    const defaultCenter = [39.8283, -98.5795];
    const defaultZoom = 4;

    const getStatusIcon = (status) => {
        let color;
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

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 30px;
                height: 30px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
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
            <div className="mb-4">
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
                    <div className="ml-auto text-gray-400">
                        {locations.length} ubicaciones
                    </div>
                </div>
            </div>

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

                    {locations.map((location) => (
                        <Marker
                            key={location.id}
                            position={[parseFloat(location.latitude), parseFloat(location.longitude)]}
                            icon={getStatusIcon(location.status)}
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

                                    {location.notes && (
                                        <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                                            📝 {location.notes}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    <FitBounds locations={locations} />
                </MapContainer>
            </div>
        </div>
    );
}
