import { useState, useMemo } from 'react';

export default function LocationsTable({ locations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const filteredLocations = useMemo(() => {
        return locations.filter(location => {
            const matchesSearch =
                location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || location.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [locations, searchTerm, statusFilter]);

    // Calcular paginación
    const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLocations = filteredLocations.slice(startIndex, endIndex);

    // Resetear a página 1 cuando cambien los filtros
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

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
                return 'Active';
            case 'inactive':
                return 'Inactive';
            case 'maintenance':
                return 'Maintenance';
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
                        placeholder="🔍 Search by name or address..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                <div>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                    </select>
                </div>
            </div>

            <div className="text-gray-400 text-sm mb-4 flex items-center justify-between">
                <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredLocations.length)} of {filteredLocations.length} locations
                    {filteredLocations.length !== locations.length && ` (${locations.length} total)`}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Name</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Address</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Coordinates</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Status</th>
                            <th className="text-left py-3 px-4 text-amber-500 font-semibold">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentLocations.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-500">
                                    No locations found
                                </td>
                            </tr>
                        ) : (
                            currentLocations.map((location) => (
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

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            currentPage === 1
                                ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                : 'bg-amber-500 text-black hover:bg-amber-600'
                        }`}
                    >
                        ← Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Primera página */}
                        {currentPage > 3 && (
                            <>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    className="w-10 h-10 rounded-lg bg-zinc-800 text-white hover:bg-amber-500 hover:text-black transition-all"
                                >
                                    1
                                </button>
                                {currentPage > 4 && <span className="text-gray-500">...</span>}
                            </>
                        )}

                        {/* Páginas cercanas */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                return page === currentPage ||
                                    page === currentPage - 1 ||
                                    page === currentPage + 1 ||
                                    page === currentPage - 2 ||
                                    page === currentPage + 2;
                            })
                            .map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                        page === currentPage
                                            ? 'bg-amber-500 text-black'
                                            : 'bg-zinc-800 text-white hover:bg-amber-500 hover:text-black'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                        {/* Última página */}
                        {currentPage < totalPages - 2 && (
                            <>
                                {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="w-10 h-10 rounded-lg bg-zinc-800 text-white hover:bg-amber-500 hover:text-black transition-all"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            currentPage === totalPages
                                ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                : 'bg-amber-500 text-black hover:bg-amber-600'
                        }`}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
