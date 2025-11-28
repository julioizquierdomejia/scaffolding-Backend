import { useState, useEffect } from 'react';

export default function UploadModal({ onFileSelect, onCancel }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelection = (file) => {
        // Validate file type
        const validTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(fileExtension)) {
            alert('Please select a valid Excel file (.xlsx, .xls, .csv)');
            return;
        }

        setSelectedFile(file);

        // Simulate upload progress
        setUploading(true);
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setUploading(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const handleConfirm = () => {
        if (selectedFile && !uploading) {
            onFileSelect(selectedFile);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Upload Excel File</h2>
                        <p className="text-sm text-gray-500 mt-1">Sube tus documentos</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {/* Drag & Drop Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-gray-50'
                        }`}
                    >
                        {/* Upload Icon */}
                        <div className="flex justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>

                        {/* Upload Text */}
                        <div className="mb-2">
                            <span className="text-blue-600 font-medium hover:text-blue-700 cursor-pointer">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    Upload a file
                                </label>
                            </span>
                            <span className="text-gray-600"> or drag and drop</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Excel files (.xlsx, .xls, .csv)
                        </p>

                        <input
                            id="file-upload"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={(e) => e.target.files[0] && handleFileSelection(e.target.files[0])}
                        />
                    </div>

                    {/* Selected File Display */}
                    {selectedFile && (
                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-4">
                                {/* Excel Icon */}
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-12 bg-green-500 rounded flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <text x="2" y="14" fontSize="10" fontWeight="bold" fill="white">XLS</text>
                                        </svg>
                                    </div>
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatFileSize(selectedFile.size)}
                                        {uploading && ` - ${uploadProgress}% uploaded`}
                                        {!uploading && uploadProgress === 100 && ' - Ready'}
                                    </p>
                                </div>

                                {/* Loading Spinner */}
                                {uploading && (
                                    <div className="flex-shrink-0">
                                        <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}

                                {/* Checkmark when done */}
                                {!uploading && uploadProgress === 100 && (
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedFile || uploading}
                        className={`flex-1 px-6 py-2.5 rounded-lg transition font-medium ${
                            selectedFile && !uploading
                                ? 'bg-blue-900 hover:bg-blue-800 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        style={selectedFile && !uploading ? { backgroundColor: '#1E3A8A' } : {}}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
