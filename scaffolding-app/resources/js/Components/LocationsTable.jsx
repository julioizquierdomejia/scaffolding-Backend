import { useState } from 'react';

export default function LocationsTable({ locations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredLocations = locations.filter(location => {
        const matchesSearch =
            location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || location.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch(status) {
            case 'active':
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'inactive':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
            case 'maintenance':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
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

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
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
                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                        <option value="maintenance">En mantenimiento</option>
                    </select>
                </div>
            </div>

            <div className="text-gray-400 text-sm mb-4">
                Mostrando {filteredLocations.length} de {locations.length} ubicaciones
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Nombre</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Dirección</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Coordenadas</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Estado</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLocations.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-500">
                                    No se encontraron ubicaciones
                                </td>
                            </tr>
                        ) : (
                            filteredLocations.map((location) => (
                                <tr
                                    key={location.id}
                                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <td className="py-3 px-4 text-white font-medium">
                                        {location.name}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300">
                                        {location.address || <span className="text-gray-600">N/A</span>}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                                        {location.latitude}, {location.longitude}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(location.status)}`}>
                                            {getStatusLabel(location.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-400 text-sm max-w-xs truncate">
                                        {location.notes || <span className="text-gray-600">-</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
