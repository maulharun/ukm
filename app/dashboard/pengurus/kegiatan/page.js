'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Search, FilePlus, Loader,
    FileText, Trash2, Edit, X,
    Download, Upload
} from 'lucide-react';
import Navbar from '@/app/components/Dashboard/Navbar';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Footer from '@/app/components/Dashboard/Footer';
import Image from 'next/image';

export default function KegiatanPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUKM, setCurrentUKM] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activityForm, setActivityForm] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        banner: null,
        status: 'upcoming' // upcoming, ongoing, completed
    });

    // Fetch activities
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('users'));
                if (!userData?.ukm?.[0]) {
                    setError('No UKM data found');
                    setLoading(false);
                    return;
                }

                setCurrentUKM(userData.ukm[0]);
                const response = await fetch(`/api/pengurus/kegiatan?ukm=${userData.ukm[0]}`);
                const data = await response.json();

                if (data.success) {
                    setActivities(data.activities);
                } else {
                    setError(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to fetch activities');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    // File validation
    const validateFile = (file) => {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            return 'File size exceeds 2MB limit';
        }
        if (!allowedTypes.includes(file.type)) {
            return 'Only JPEG and PNG files are allowed';
        }
        return null;
    };

    // Handle file change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const error = validateFile(file);
        if (error) {
            setUploadError(error);
            return;
        }

        setSelectedFile(file);
        setActivityForm({ ...activityForm, banner: file });
        setUploadError('');
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadError('');

        try {
            const formData = new FormData();
            Object.keys(activityForm).forEach(key => {
                formData.append(key, activityForm[key]);
            });
            formData.append('ukm', currentUKM);

            const response = await fetch('/api/pengurus/kegiatan', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setShowUploadModal(false);
                setActivities([...activities, data.activity]);
                setActivityForm({
                    title: '',
                    description: '',
                    date: '',
                    location: '',
                    banner: null,
                    status: 'upcoming'
                });
                setSelectedFile(null);
            } else {
                setUploadError(data.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError('Error creating activity');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle activity deletion
    const handleDelete = async (id) => {
        if (!id || !confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
            return;
        }

        try {
            const response = await fetch(`/api/pengurus/kegiatan?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setActivities(activities.filter(activity => activity._id !== id));
            } else {
                console.error('Delete failed:', data.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Banner Preview (for modal form)
    const renderBannerPreview = () => {
        if (selectedFile) {
            // Preview from input file (user just picked)
            const imageUrl = URL.createObjectURL(selectedFile);
            return (
                <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                        src={imageUrl}
                        alt="Preview Banner"
                        fill
                        sizes="100vw"
                        className="object-cover"
                        unoptimized // for blob: or local previews
                    />
                </div>
            );
        }
        if (activityForm.banner && typeof activityForm.banner === "string") {
            // Preview from existing banner (edit mode)
            return (
                <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                        src={activityForm.banner}
                        alt="Preview Banner"
                        fill
                        sizes="100vw"
                        className="object-cover"
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} userRole="pengurus" userUKM={currentUKM} />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userUKM={currentUKM} />

                <main className="flex-1 p-6">
                    {/* Header Section */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Kegiatan {currentUKM}</h1>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                            Kelola kegiatan UKM Anda di sini
                        </p>
                    </div>

                    {/* Search and Add Section */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau deskripsi kegiatan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-gray-700 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FilePlus className="w-5 h-5 mr-2" />
                            Tambah Kegiatan
                        </button>
                    </div>

                    {/* Activities List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800">Belum ada kegiatan</h3>
                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Mulai tambahkan kegiatan UKM Anda
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activities
                                .filter(activity =>
                                    (activity.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                    (activity.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                )
                                .map(activity => (
                                    <div key={activity._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        {activity.banner && typeof activity.banner === "string" && (
                                            <div className="h-48 relative rounded-t-lg overflow-hidden bg-gray-100">
                                                <Image
                                                    src={activity.banner}
                                                    alt={activity.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800">{activity.title}</h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                                    activity.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {activity.status === 'upcoming' ? 'Akan Datang' :
                                                        activity.status === 'ongoing' ? 'Sedang Berlangsung' :
                                                            'Selesai'}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{activity.description}</p>
                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {activity.date ? new Date(activity.date).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : '-'}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(activity._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActivityForm(activity);
                                                        setShowUploadModal(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </main>

                {/* Activity Modal */}
                <AnimatePresence>
                    {showUploadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {activityForm.id ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                                    </h2>
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
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                                            Nama Kegiatan
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Masukkan nama kegiatan"
                                            value={activityForm.title}
                                            onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                                            className="w-full px-3 py-2.5 text-gray-700 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            required
                                            placeholder="Jelaskan detail kegiatan"
                                            value={activityForm.description}
                                            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                                            className="w-full px-3 py-2.5 text-gray-700 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tanggal Kegiatan
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={activityForm.date}
                                            onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lokasi
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={activityForm.location}
                                            onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={activityForm.status}
                                            onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
                                        >
                                            <option value="upcoming">Akan Datang</option>
                                            <option value="ongoing">Sedang Berlangsung</option>
                                            <option value="completed">Selesai</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Banner Kegiatan
                                        </label>
                                        {renderBannerPreview()}
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                                            <div className="space-y-1 text-center">
                                                <div className="flex text-sm text-gray-600">
                                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                        <span>Upload a file</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG up to 2MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadModal(false)}
                                            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isUploading ? 'Menyimpan...' : 'Simpan'}
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