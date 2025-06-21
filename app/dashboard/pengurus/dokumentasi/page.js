'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Upload, Calendar, Users,
    Search, Filter, Download, Loader, Images,
    FileVideo, FilePlus, Trash2, Edit, X, Play
} from 'lucide-react';
import Navbar from '@/app/components/Dashboard/Navbar';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Footer from '@/app/components/Dashboard/Footer';
import Image from 'next/image';

export default function DokumentasiPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUKM, setCurrentUKM] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        kegiatan: '',
        tahun: new Date().getFullYear(),
        files: []
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];

        if (file.size > maxSize) {
            return `File ${file.name} exceeds 10MB limit`;
        }
        if (!allowedTypes.includes(file.type)) {
            return `File ${file.name} type not supported`;
        }
        return null;
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setUploadError('');

        // Check total files (existing + new)
        const totalFiles = selectedFiles.length + newFiles.length;
        if (totalFiles > 10) {
            setUploadError('Maksimal 10 file yang dapat diupload');
            return;
        }

        // Validate new files
        for (let file of newFiles) {
            const error = validateFile(file);
            if (error) {
                setUploadError(error);
                return;
            }
        }

        // Combine existing files with new files
        const updatedFiles = [...selectedFiles, ...newFiles];

        // Create new FileList-like object
        const dataTransfer = new DataTransfer();
        updatedFiles.forEach(file => dataTransfer.items.add(file));

        setSelectedFiles(updatedFiles);
        setUploadForm({
            ...uploadForm,
            files: dataTransfer.files
        });

        // Reset file input
        e.target.value = '';
    };

    // Fetch documents
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('users'));
                if (!userData?.ukm?.[0]) {
                    setError('No UKM data found');
                    return;
                }

                setCurrentUKM(userData.ukm[0]);
                const response = await fetch(`/api/pengurus/dokumentasi?ukm=${userData.ukm[0]}`);
                const data = await response.json();

                if (data.success) {
                    setDocuments(data.documents);
                } else {
                    setError(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to fetch documents');
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const removeFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const dataTransfer = new DataTransfer();
        newFiles.forEach(file => dataTransfer.items.add(file));

        setSelectedFiles(newFiles);
        setUploadForm({
            ...uploadForm,
            files: dataTransfer.files
        });
    }

    const clearAllFiles = () => {
        setSelectedFiles([]);
        setUploadForm({
            ...uploadForm,
            files: new DataTransfer().files
        });
    };

    // Handle file upload
    const handleUpload = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('description', uploadForm.description);
            formData.append('kegiatan', uploadForm.kegiatan);
            formData.append('tahun', uploadForm.tahun);
            formData.append('ukm', currentUKM);

            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/pengurus/dokumentasi', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setShowUploadModal(false);
                // Refresh documents list
                const docsResponse = await fetch(`/api/pengurus/dokumentasi?ukm=${currentUKM}`);
                const docsData = await docsResponse.json();
                if (docsData.success) {
                    setDocuments(docsData.documents);
                }
            } else {
                setUploadError(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError('Error uploading files');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle document deletion
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await fetch(`/api/pengurus/dokumentasi?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                setDocuments(documents.filter(doc => doc.id !== id));
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Update DocumentPreview component
    const DocumentPreview = ({ fileType, fileUrl }) => {
        // Use path relative from public (no window.location.origin)
        const fullUrl = fileUrl; // fileUrl should be "/uploads/dokumentasi/..."

        // Detect file type from file extension
        const getFileType = (url) => {
            const ext = url.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
            if (['mp4', 'webm'].includes(ext)) return 'video';
            if (ext === 'pdf') return 'pdf';
            return 'other';
        };

        const type = fileType || getFileType(fileUrl);

        switch (type) {
            case 'image':
                return (
                    <div className="relative w-full h-full">
                        <Image
                            src={fullUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            width={500}
                            height={300}
                            loading="lazy"
                        />
                    </div>
                );
            case 'video':
                return (
                    <div className="relative w-full h-full">
                        <video
                            src={fullUrl}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                        >
                            Your browser does not support video playback.
                        </video>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="relative w-full h-full">
                        <iframe
                            src={fullUrl}
                            className="w-full h-full"
                            title="PDF preview"
                        >
                            <div className="flex items-center justify-center h-full">
                                <FileText className="w-12 h-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">PDF Preview</p>
                            </div>
                        </iframe>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <FileText className="w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">File Preview</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} userRole="pengurus" userUKM={currentUKM} />
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userUKM={currentUKM} />

                <main className="p-6">
                    {/* Header Section */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Dokumentasi {currentUKM}</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Kelola dokumentasi kegiatan UKM Anda di sini
                        </p>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        {/* Search Input */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari dokumentasi, judul, atau kata kunci..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Filter & Upload Actions */}
                        <div className="flex gap-3 items-center">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition text-base shadow-sm"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="image">Gambar</option>
                                <option value="video">Video</option>
                                <option value="pdf">PDF</option>
                            </select>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition"
                            >
                                <FilePlus className="w-5 h-5" />
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>

                    {/* Documents List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-red-600">{error}</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FileText className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Belum ada dokumentasi</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Upload dokumentasi pertama Anda dengan klik tombol Upload
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {documents
                                .filter(doc => {
                                    if (filterType === 'all') return true;
                                    return doc.type === filterType;
                                })
                                .filter(doc =>
                                    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(doc => (
                                    <div key={doc.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="h-48 relative rounded-t-lg overflow-hidden bg-gray-100">
                                            <DocumentPreview
                                                fileType={doc.fileType}
                                                fileUrl={doc.fileUrl}
                                            />
                                            {doc.fileType === 'video' && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Play className="w-12 h-12 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(doc.createdAt)}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <a
                                                        href={doc.fileUrl}
                                                        download
                                                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </main>

                {/* Upload Modal */}
                <AnimatePresence>
                    {showUploadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-4 text-gray-800">
                                    <h2 className="text-xl font-bold">Upload Dokumen</h2>
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="p-1 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {uploadError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                        {uploadError}
                                    </div>
                                )}

                                <form onSubmit={handleUpload} className="space-y-4">
                                    {/* Form Fields */}
                                    <div className="block text-base font-semibold text-gray-800 mb-2">
                                        <label className="block text-base font-semibold text-gray-800 mb-2">
                                            Judul Dokumentasi
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Masukkan judul dokumentasi"
                                        />
                                    </div>

                                    <div className="block text-base font-semibold text-gray-800 mb-2">
                                        <label className="block text-base font-semibold text-gray-800 mb-2">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            required
                                            value={uploadForm.description}
                                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                            placeholder="Masukkan deskripsi dokumentasi"
                                        />
                                    </div>

                                    <div className="block text-base font-semibold text-gray-800 mb-2">
                                        <label className="block text-base font-semibold text-gray-800 mb-2">
                                            Nama Kegiatan
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={uploadForm.kegiatan}
                                            onChange={(e) => setUploadForm({ ...uploadForm, kegiatan: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Masukkan nama kegiatan"
                                        />
                                    </div>

                                    <div className="block text-base font-semibold text-gray-800 mb-2">
                                        <label className="block text-base font-semibold text-gray-800 mb-2">
                                            Tahun Kegiatan
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="2000"
                                            max="2099"
                                            value={uploadForm.tahun}
                                            onChange={(e) => setUploadForm({ ...uploadForm, tahun: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-gray-800 mb-2">
                                            Upload File (Maksimal 10 file)
                                        </label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                                            <div className="space-y-3 text-center">
                                                {isUploading ? (
                                                    <div className="space-y-3">
                                                        <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${uploadProgress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            Mengupload... {uploadProgress}%
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex flex-col space-y-2">
                                                            <label className="relative cursor-pointer">
                                                                <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                                                    <Upload className="w-5 h-5 mr-2" />
                                                                    Pilih File
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*,video/*,application/pdf"
                                                                    onChange={handleFileChange}
                                                                    className="sr-only"
                                                                    disabled={isUploading}
                                                                />
                                                            </label>
                                                            <p className="text-sm text-gray-600">
                                                                Format: PDF, Gambar, atau Video
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Maksimal: 10MB per file
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* File Preview */}
                                        {uploadForm.files.length > 0 && (
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        File Terpilih ({uploadForm.files.length}/10)
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUploadForm({ ...uploadForm, files: [] });
                                                            setSelectedFiles([]);
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Hapus Semua
                                                    </button>
                                                </div>
                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                    {Array.from(uploadForm.files).map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                                            <div className="flex items-center flex-1 min-w-0">
                                                                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-700 truncate">
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {file.type.split('/')[0]} • {formatFileSize(file.size)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(index)}
                                                                className="ml-2 p-1 text-gray-400 hover:text-red-500"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadModal(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            disabled={isUploading}
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading || uploadForm.files.length === 0}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? 'Mengupload...' : 'Upload'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Footer />
            </div>
        </div>
    );
}