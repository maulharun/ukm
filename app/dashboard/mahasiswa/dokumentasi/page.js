'use client';
import { useState, useEffect } from 'react';
import { Download, Loader, FileText, Search } from 'lucide-react';
import Navbar from '@/app/components/Dashboard/Navbar';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Footer from '@/app/components/Dashboard/Footer';
import Image from 'next/image';

export default function DokumentasiPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ukmList, setUkmList] = useState([]); // array of string
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        try {
            // Ambil UKM dari localStorage dan konversi ke array nama UKM (string)
            const userData = JSON.parse(localStorage.getItem('users'));
            // Kalau userData.ukm adalah array of object, ambil name-nya saja:
            const ukms = Array.isArray(userData?.ukm) ? userData.ukm.map(u => u.name) : [];
            setUkmList(ukms);

            if (!ukms.length) {
                setError('Anda belum terdaftar di UKM manapun.');
                setLoading(false);
                return;
            }

            // Query string untuk banyak ukm: ?ukm=ukm1&ukm=ukm2
            const ukmQueryString = ukms.map(ukm => `ukm=${encodeURIComponent(ukm)}`).join('&');
            fetch(`/api/mahasiswa/dokumentasi?${ukmQueryString}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setDocuments(data.documents || []);
                    } else {
                        setError(data.message || 'Gagal mengambil dokumentasi');
                    }
                })
                .catch(() => setError('Gagal mengambil dokumentasi'))
                .finally(() => setLoading(false));
        } catch (e) {
            setError('Gagal mengambil data UKM');
            setLoading(false);
        }
    }, []);

    const formatDate = (date) => {
        if (!date) return "-";
        const d = new Date(date);
        if (isNaN(d)) return "-";
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Preview helper
    const DocumentPreview = ({ fileType, fileUrl }) => {
        // Gunakan path relatif langsung untuk next/image, jangan window.location.origin
        // Untuk eksternal domain, daftarkan di next.config.js images.domains
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
                // next/image membutuhkan width dan height, gunakan default
                // src harus path relatif atau domain sudah didaftarkan
                return (
                    <div className="relative w-full h-full min-h-[192px]">
                        <Image
                            src={fileUrl}
                            alt="Preview Dokumentasi"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority={false}
                        />
                    </div>
                );
            case 'video':
                return (
                    <video
                        src={fileUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        style={{ minHeight: 192 }}
                    />
                );
            case 'pdf':
                return (
                    <iframe
                        src={fileUrl}
                        className="w-full h-full min-h-[192px]"
                        title="PDF preview"
                    />
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[192px]">
                        <FileText className="w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">File Preview</p>
                    </div>
                );
        }
    };

    // Filter & search logic
    const filteredDocuments = documents
        .filter(doc => filterType === 'all' ? true : doc.fileType === filterType)
        .filter(doc => (
            (doc.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (doc.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        ))
        // Pastikan hanya dari UKM yang terdaftar (redundant, tapi lebih aman)
        .filter(doc => ukmList.includes(doc.ukm));

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} userRole="mahasiswa" userUKM={ukmList} />
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userUKM={ukmList} />
                <main className="p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Dokumentasi UKM Anda</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Anda hanya dapat melihat dan mendownload dokumentasi dari UKM yang Anda ikuti.
                        </p>
                        {ukmList.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {ukmList.map((ukm, idx) => (
                                    <span key={idx} className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        {ukm}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Search & Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
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
                    ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FileText className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Belum ada dokumentasi</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Dokumentasi UKM Anda akan tampil di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDocuments.map(doc => (
                                <div key={doc.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="h-48 relative rounded-t-lg overflow-hidden bg-gray-100">
                                        <DocumentPreview
                                            fileType={doc.fileType}
                                            fileUrl={doc.fileUrl}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                                        <div className="text-xs text-blue-700 mb-1">{doc.ukm}</div>
                                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                {formatDate(doc.uploadedAt)}
                                            </div>
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
                            ))}
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </div>
    );
}