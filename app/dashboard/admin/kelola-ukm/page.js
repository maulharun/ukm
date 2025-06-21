'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader, Users, X } from 'lucide-react';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Navbar from '@/app/components/Dashboard/Navbar';
import Footer from '@/app/components/Dashboard/Footer';

export default function KelolaUKM() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ukms, setUkms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedUKMMembers, setSelectedUKMMembers] = useState([]);
  const [selectedUKMName, setSelectedUKMName] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchUKMs();
  }, []);

  // Menampilkan pesan success selama 3 detik
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUKMs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ukm');
      const data = await res.json();
  
      if (data.success) {
        setUkms(data.ukm || []); // Ensure array even if empty
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setError(error.message);
      setUkms([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add useEffect for initial load
  useEffect(() => {
    fetchUKMs();
  }, []);

  const fetchMembers = (ukm) => {
    setSelectedUKMMembers(ukm.members || []);
    setSelectedUKMName(ukm.name);
    setShowMembersModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { _id: editId, ...formData } : formData;

      const res = await fetch('/api/ukm', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setSuccessMessage(result.message);
      setShowModal(false);
      resetForm();
      fetchUKMs();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus UKM ini?')) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/ukm?id=${id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setSuccessMessage(result.message);
      fetchUKMs();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ukm) => {
    setFormData({
      name: ukm.name,
      description: ukm.description,
      category: ukm.category
    });
    setEditId(ukm._id);
    setIsEdit(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '' });
    setIsEdit(false);
    setEditId(null);
  };

  // Komponen Modal untuk menampilkan daftar anggota
  const MembersModal = ({ ukm, onClose }) => {
    if (!ukm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Daftar Anggota UKM {ukm.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {ukm.members && ukm.members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fakultas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prodi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Bergabung
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ukm.members.map((member, index) => (
                    <tr key={member.nim} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.nim}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.fakultas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.prodi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.tanggalDiterima).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada anggota terdaftar</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Total Anggota: {ukm.members?.length || 0} orang
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} userRole="admin" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-8 mt-14">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
              {successMessage}
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Kelola UKM</h1>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Tambah UKM
            </button>
          </div>

          {/* UKM Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase">Nama UKM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase">Jumlah Anggota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ukms.map((ukm, index) => (
                    <tr key={ukm._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ukm.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ukm.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ukm.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => fetchMembers(ukm)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          {ukm.members?.length || 0} Anggota
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(ukm)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ukm._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* UKM Form Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 w-full max-w-md">
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                  {isEdit ? 'Edit UKM' : 'Tambah UKM Baru'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama UKM
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {isLoading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Members Modal */}
          {showMembersModal && (
            <MembersModal
              ukm={{ name: selectedUKMName, members: selectedUKMMembers }}
              onClose={() => setShowMembersModal(false)}
            />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}