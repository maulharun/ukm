"use client";

import { useState, useEffect } from "react";
import { Loader, FileText, FileCheck2, FileX2, Eye, X } from "lucide-react";
import Image from "next/image";
import Navbar from "@/app/components/Dashboard/Navbar";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Footer from "@/app/components/Dashboard/Footer";

function StatusBadge({ status }) {
  const color =
    status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : status === "approved"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
  const text =
    status === "pending"
      ? "Menunggu"
      : status === "approved"
        ? "Diterima"
        : "Ditolak";
  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}
    >
      {text}
    </span>
  );
}

function ConfirmationModal({ isOpen, type, loading, onClose, onConfirm }) {
  const [alasanPenolakan, setAlasanPenolakan] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (type === "reject" && !alasanPenolakan.trim()) {
      alert('Alasan penolakan harus diisi');
      return;
    }

    onConfirm(alasanPenolakan.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {type === "approve" ? "Terima Pendaftaran" : "Tolak Pendaftaran"}
        </h3>

        <form onSubmit={handleSubmit}>
          {type === "reject" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={alasanPenolakan}
                onChange={(e) => setAlasanPenolakan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Tuliskan alasan penolakan..."
                required={type === "reject"}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg 
                ${type === "approve"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
                } disabled:opacity-50 flex items-center gap-2`}
              disabled={loading || (type === "reject" && !alasanPenolakan.trim())}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>
                  {type === "approve" ? "Terima Pendaftaran" : "Tolak Pendaftaran"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DataDialog({ item, onClose, onShowConfirm }) {
  const handleAction = (actionType) => {
    try {
      if (!item._id) {
        throw new Error('Invalid item ID');
      }
      onShowConfirm(item._id, actionType);
      onClose();
    } catch (error) {
      alert('Terjadi kesalahan saat memproses aksi');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short"
    });
  };

  // Helper for file preview
  const renderFilePreview = (fileUrl, altText) => {
    if (!fileUrl) return null;
    const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
    if (isPDF) {
      return (
        <div className="bg-gray-50 p-4 flex items-center justify-center">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FileText className="w-8 h-8 mr-2" />
            <span>Lihat PDF</span>
          </a>
        </div>
      );
    } else {
      return (
        <div className="relative w-full h-72 bg-gray-50">
          <Image
            src={fileUrl}
            alt={altText}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-6 text-gray-900">
          Detail Pendaftaran
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 border-b pb-2">
              Data Pribadi
            </h3>
            <div className="grid gap-y-2 text-sm">
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">Nama Lengkap:</div>
                <div className="text-gray-900">{item.nama}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">NIM:</div>
                <div className="text-gray-900">{item.nim}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">Fakultas:</div>
                <div className="text-gray-900">{item.fakultas}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">Program Studi:</div>
                <div className="text-gray-900">{item.prodi}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">Email:</div>
                <div className="text-gray-900">{item.email}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">UKM:</div>
                <div className="text-gray-900">{item.ukm}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="font-medium text-gray-700">Status:</div>
                <div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              {item.status === "approved" && (
                <div className="grid grid-cols-2">
                  <div className="font-medium text-gray-700">Tanggal Diterima:</div>
                  <div className="text-green-600">
                    {formatDate(item.tanggalDiterima)}
                  </div>
                </div>
              )}
              {item.status === "rejected" && (
                <div className="col-span-2 mt-2">
                  <div className="font-medium text-gray-700 mb-1">
                    Alasan Penolakan:
                  </div>
                  <div className="text-red-600 bg-red-50 p-2 rounded-lg">
                    {item.alasanPenolakan}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Alasan Mendaftar:
              </h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
                {item.alasan}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 border-b pb-2">
              Dokumen
            </h3>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">KTM:</h4>
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                {renderFilePreview(item.ktmFile, "KTM")}
              </div>
            </div>

            {item.sertifikatFile && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Sertifikat:</h4>
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  {renderFilePreview(item.sertifikatFile, "Sertifikat")}
                </div>
              </div>
            )}
          </div>
        </div>

        {item.status === "pending" && (
          <div className="mt-8 pt-6 border-t flex justify-end gap-3">
            <button
              onClick={() => handleAction("reject")}
              className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <FileX2 className="w-4 h-4" />
              Tolak Pendaftaran
            </button>
            <button
              onClick={() => handleAction("approve")}
              className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              Terima Pendaftaran
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ValidasiPage() {
  const [pendaftaran, setPendaftaran] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: null,
    _id: null,
  });
  const [error, setError] = useState("");

  const fetchPendaftaran = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ukm/validasi');
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to fetch registrations');

      // Map registration data to match UI structure
      const registrations = data.registrations.map(reg => ({
        _id: reg._id || '',
        userId: reg.userId || '',
        nama: reg.nama || '',
        email: reg.email || '',
        nim: reg.nim || '',
        fakultas: reg.fakultas || '',
        prodi: reg.prodi || '',
        ukm: reg.ukm || '',
        alasan: reg.alasan || '',
        ktmFile: reg.ktmFile || '',
        sertifikatFile: reg.sertifikatFile || '',
        status: reg.status || 'pending',
        createdAt: reg.createdAt || new Date().toISOString(),
        tanggalDiterima: reg.tanggalDiterima || null,
        updatedAt: reg.updatedAt || new Date().toISOString(),
        updatedBy: reg.updatedBy || 'Administrator',
        alasanPenolakan: reg.alasanPenolakan || ''
      }));

      setPendaftaran(registrations);
    } catch (error) {
      setError('Gagal memuat data pendaftaran');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchPendaftaran();
  }, []);

  const handleValidasi = async (_id, status, alasanPenolakan = "") => {
    try {
      setIsLoading(true);
      setError('');

      const payload = {
        registrationId: _id,
        status: status,
        alasanPenolakan: alasanPenolakan,
        updatedBy: 'Administrator',
        tanggalDiterima: status === 'approved' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      const res = await fetch('/api/ukm/validasi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui status');

      await fetchPendaftaran();
      setConfirmModal({ show: false, type: null, _id: null });
      setSelectedDetail(null);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showConfirmModal = (_id, type) => {
    if (!_id) return;
    setConfirmModal({ show: true, type, _id });
  };

  const filteredData = pendaftaran.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <div className="flex h-screen bg-gradient-to-tr from-blue-50 via-white to-blue-100">
      <Sidebar isOpen={sidebarOpen} userRole="admin" />

      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"
          }`}
      >
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                Validasi Pendaftaran UKM
              </h1>
              <select
                className="px-4 py-2 rounded-lg border border-gray-200 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Diterima</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="w-10 h-10 animate-spin text-blue-500" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <FileX2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Tidak ada data pendaftaran
                </h3>
                <p className="text-gray-500">
                  Belum ada pendaftaran UKM yang {filter === "all" ? "masuk" : filter === "pending" ? "menunggu" : filter === "approved" ? "diterima" : "ditolak"}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Nama
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          NIM
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Fakultas
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Program Studi
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          UKM
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.nama}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.nim}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.fakultas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.prodi}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.ukm}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedDetail(item)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {confirmModal.show && (
          <ConfirmationModal
            isOpen={confirmModal.show}
            type={confirmModal.type}
            loading={isLoading}
            onClose={() => {
              setConfirmModal({ show: false, type: null, _id: null });
              setError('');
            }}
            onConfirm={(alasanPenolakan) => {
              handleValidasi(
                confirmModal._id,
                confirmModal.type === "approve" ? "approved" : "rejected",
                alasanPenolakan
              );
            }}
          />
        )}

        {selectedDetail && (
          <DataDialog
            item={selectedDetail}
            onClose={() => setSelectedDetail(null)}
            onShowConfirm={showConfirmModal}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}