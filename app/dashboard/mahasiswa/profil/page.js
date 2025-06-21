'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader, User } from 'lucide-react';
import Image from 'next/image';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Navbar from '@/app/components/Dashboard/Navbar';

export default function MahasiswaProfile() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nim: '',
    fakultas: '',
    prodi: '',
    photoUrl: '',
    ukm: []
  });

  // Data fakultas dan program studi langsung di dalam kode
  const fakultasData = {
    "Fakultas Komputer": ["Sistem Informasi", "Komputerisasi Akuntansi", "Bisnis Digital"],
    "Fakultas Ekonomi Bisnis Islam": ["Perbankan Syariah", "Manajemen Bisnis Syariah"],
    "Fakultas Pertanian": ["Teknologi Pangan", "Agribisnis"],
    "Fakultas Keguruan dan Ilmu Pendidikan": ["Pendidikan Bahasa Inggris", "Bimbingan dan Konseling"],
    "Fakultas Teknik": ["Teknik Industri", "Teknik Informatika"]
  };

  const [prodiList, setProdiList] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem('users');
      if (!userData) {
        router.push('/login');
        return;
      }
      await fetchProfile();
    };
    checkAuth();
    // eslint-disable-next-line
  }, [router]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('users'));
      const res = await fetch(`/api/users/profil/${userData.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal mengambil data profil');

      setFormData({
        name: data.name || '',
        email: data.email || '',
        nim: data.nim || '',
        fakultas: data.fakultas || '',
        prodi: data.prodi || '',
        photoUrl: data.photoUrl || '',
        ukm: data.ukm || []
      });

      if (data.photoUrl) {
        setImagePreview(data.photoUrl);
      }

      // Jika fakultas sudah ada, ambil daftar program studi terkait
      if (data.fakultas) {
        setProdiList(fakultasData[data.fakultas] || []);
      }
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFakultasChange = (e) => {
    const selectedFakultas = e.target.value;
    setFormData({ ...formData, fakultas: selectedFakultas, prodi: '' });
    setProdiList(fakultasData[selectedFakultas] || []);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Format file harus JPG atau PNG');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setIsLoading(true);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Data URL, didukung oleh next/image untuk preview

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFormData(prev => ({
        ...prev,
        photoUrl: data.url
      }));

      setSuccessMessage('Foto berhasil diunggah');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userData = JSON.parse(localStorage.getItem('users'));

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('nim', formData.nim);
      formDataToSend.append('fakultas', formData.fakultas);
      formDataToSend.append('prodi', formData.prodi);
      if (imageFile) {
        formDataToSend.append('file', imageFile);
      }
      const res = await fetch(`/api/users/profil/${userData.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal memperbarui profil');
      }

      const data = await res.json();
      localStorage.setItem('users', JSON.stringify({
        ...userData,
        name: formData.name,
        email: formData.email,
        nim: formData.nim,
        fakultas: formData.fakultas,
        prodi: formData.prodi,
        photoUrl: data.photoUrl || userData.photoUrl
      }));

      setSuccessMessage('Profil berhasil diperbarui');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} userRole="mahasiswa" />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-8 mt-14">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil Mahasiswa</h1>

            {(error || successMessage) && (
              <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                {error || successMessage}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                        // unoptimized agar preview base64/file local bisa work
                        unoptimized={imagePreview.startsWith('blob:') || imagePreview.startsWith('data:')}
                        priority
                      />
                    ) : (
                      <User className="w-full h-full p-6 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Masukkan email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      NIM
                    </label>
                    <input
                      type="text"
                      value={formData.nim}
                      onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Masukkan NIM"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fakultas
                    </label>
                    <select
                      value={formData.fakultas}
                      onChange={handleFakultasChange}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Pilih Fakultas</option>
                      {Object.keys(fakultasData).map((fakultas) => (
                        <option key={fakultas} value={fakultas}>
                          {fakultas}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Program Studi
                    </label>
                    <select
                      value={formData.prodi}
                      onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Pilih Program Studi</option>
                      {prodiList.map((prodi) => (
                        <option key={prodi} value={prodi}>
                          {prodi}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 transition-all duration-150 flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </form>

              {/* UKM Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Keanggotaan UKM
                </h3>

                {formData.ukm && formData.ukm.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {formData.ukm.map((ukmItem, index) => (
                      <div
                        key={index}
                        className="flex items-center p-4 bg-blue-50 rounded-xl"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {ukmItem.name}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">
                      Belum terdaftar dalam UKM manapun
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}