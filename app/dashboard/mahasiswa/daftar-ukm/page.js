'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Image as ImageIcon } from 'lucide-react';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Navbar from '@/app/components/Dashboard/Navbar';
import Footer from '@/app/components/Dashboard/Footer';
import Image from 'next/image';

export default function DaftarUKM() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ukmList, setUkmList] = useState([]);
  const [isLoadingUKM, setIsLoadingUKM] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUKM, setSelectedUKM] = useState('');
  const [userUKM, setUserUKM] = useState([]);
  const [availableUKMs, setAvailableUKMs] = useState([]);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [ktmFile, setKtmFile] = useState(null);
  const [sertifikatFile, setSertifikatFile] = useState(null);
  const [ktmPreview, setKtmPreview] = useState(null);
  const [sertifikatPreview, setSertifikatPreview] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [incompleteFields, setIncompleteFields] = useState([]);
  const [userData, setUserData] = useState({
    name: '',
    nim: '',
    fakultas: '',
    prodi: '',
    email: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingUKM(true);
        const userData = JSON.parse(localStorage.getItem('users'));

        if (!userData?.id) {
          router.push('/login');
          return;
        }

        const userRes = await fetch(`/api/users/${userData.id}`);
        const data = await userRes.json();

        if (!userRes.ok) throw new Error(data.message || 'Gagal mengambil data profil');

        // Create profile data object
        const profileData = {
          name: data.name || '',
          email: data.email || '',
          nim: data.nim || '',
          fakultas: data.fakultas || '',
          prodi: data.prodi || '',
          ukm: Array.isArray(data.ukm) ? data.ukm : []
        };

        // Set user data and validate profile
        setUserData(profileData);
        const { isComplete, missing } = validateProfile(profileData);
        setIsProfileComplete(isComplete);
        setIncompleteFields(missing);

        // Create list of user's registered UKMs
        const userUkmList = Array.isArray(data.ukm)
          ? data.ukm
            .filter(ukm => ukm && ukm.name)
            .map(ukm => ukm.name.toLowerCase())
          : [];
        setUserUKM(userUkmList);

        // Fetch and filter available UKMs
        const ukmRes = await fetch('/api/ukm');
        const ukmData = await ukmRes.json();

        if (ukmData.success) {
          setUkmList(ukmData.ukm);

          if (selectedUKM) {
            const isRegistered = userUkmList.includes(selectedUKM.toLowerCase());
            if (isRegistered) {
              setDuplicateWarning(`Anda sudah terdaftar di UKM ${selectedUKM}`);
              setAlreadyMember(true);
            }
          }

          const availableUkms = ukmData.ukm.filter(ukm =>
            ukm.name && !userUkmList.includes(ukm.name.toLowerCase())
          );
          setAvailableUKMs(availableUkms);
        }

      } catch (error) {
        console.error('Error:', error);
        setError('Gagal memuat data UKM');
      } finally {
        setIsLoadingUKM(false);
      }
    };

    fetchData();
  }, [router, selectedUKM]);

  const handleUKMSelection = (e) => {
    const selectedValue = e.target.value;
    setSelectedUKM(selectedValue);

    if (!selectedValue) return;

    // Check user's existing UKM memberships
    const userUkmData = userData.ukm || [];

    // Check if user is already registered in this UKM
    const existingMembership = userUkmData.find(
      ukm => ukm.name.toLowerCase() === selectedValue.toLowerCase()
    );

    if (existingMembership) {
      setDuplicateWarning(`Anda sudah terdaftar di UKM ${selectedValue}`);
      setAlreadyMember(true);
      // Reset form values to prevent submission
      setSelectedUKM('');
      setKtmFile(null);
      setKtmPreview(null);
      setSertifikatFile(null);
      setSertifikatPreview(null);
      setAlasan('');
    } else {
      setDuplicateWarning('');
      setAlreadyMember(false);
    }
  };

  useEffect(() => {
    const fetchAndFilterUKMs = async () => {
      try {
        setIsLoadingUKM(true);

        const userStoredData = JSON.parse(localStorage.getItem('users'));
        if (!userStoredData?.id) {
          router.push('/login');
          return;
        }

        // Fetch user data
        const userRes = await fetch(`/api/users/${userStoredData.id}`);
        const userData = await userRes.json();

        // Get user's UKM list from new structure
        const userUkmList = (userData?.user?.ukm || []).map(ukmObj =>
          ukmObj.name.toLowerCase()
        );
        setUserUKM(userUkmList);

        // Fetch all UKMs with new structure
        const ukmRes = await fetch('/api/ukm');
        const ukmData = await ukmRes.json();

        if (ukmData.success && Array.isArray(ukmData.ukm)) {
          // Filter available UKMs based on new structure
          const available = ukmData.ukm.filter(ukm => {
            const ukmName = ukm.name.toLowerCase();
            const isMember = userUkmList.includes(ukmName);
            return !isMember;
          });

          setUkmList(ukmData.ukm);
          setAvailableUKMs(available);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Gagal memuat data UKM');
      } finally {
        setIsLoadingUKM(false);
      }
    };

    fetchAndFilterUKMs();
  }, [router]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`Ukuran file ${type === 'ktm' ? 'KTM' : 'Sertifikat'} maksimal 5MB`);
      e.target.value = '';
      return;
    }

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError(`Format file ${type === 'ktm' ? 'KTM' : 'Sertifikat'} harus JPG, PNG atau PDF`);
      e.target.value = '';
      return;
    }

    if (type === 'ktm') {
      setKtmFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setKtmPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setKtmPreview(null);
      }
    } else {
      setSertifikatFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSertifikatPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setSertifikatPreview(null);
      }
    }

    setError(''); // Clear any previous errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userData = JSON.parse(localStorage.getItem('users'));
      if (!userData?.id) {
        throw new Error('Sesi login tidak valid');
      }

      // Fetch latest user profile first
      const userRes = await fetch(`/api/users/${userData.id}`);
      const data = await userRes.json();

      if (!userRes.ok) throw new Error(data.message || 'Gagal mengambil data profil');

      // Prepare form data with latest user profile
      const formDataToSend = new FormData();
      formDataToSend.append('userId', userData.id);
      formDataToSend.append('nama', data.name || '');
      formDataToSend.append('email', data.email || '');
      formDataToSend.append('nim', data.nim || '');
      formDataToSend.append('fakultas', data.fakultas || '');
      formDataToSend.append('prodi', data.prodi || '');
      formDataToSend.append('ukmName', selectedUKM);
      formDataToSend.append('alasan', alasan);

      if (ktmFile) {
        const ktmFileName = `${data.nim}-ktm-${Date.now()}${ktmFile.name.substring(ktmFile.name.lastIndexOf('.'))}`;
        formDataToSend.append('ktmFile', ktmFile, ktmFileName);
      }

      if (sertifikatFile) {
        const sertifikatFileName = `${data.nim}-sertifikat-${Date.now()}${sertifikatFile.name.substring(sertifikatFile.name.lastIndexOf('.'))}`;
        formDataToSend.append('sertifikatFile', sertifikatFile, sertifikatFileName);
      }

      const res = await fetch('/api/ukm/register', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal mendaftar UKM');
      }

      // Update local storage with latest data
      const updatedUserData = {
        ...userData,
        name: data.name,
        email: data.email,
        nim: data.nim,
        fakultas: data.fakultas,
        prodi: data.prodi,
        ukm: Array.isArray(data.ukm) ? [...data.ukm, { name: selectedUKM }] : [{ name: selectedUKM }]
      };
      localStorage.setItem('users', JSON.stringify(updatedUserData));

      setSuccessMessage('Pendaftaran UKM berhasil dikirim');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfile = (profile) => {
    const requiredFields = {
      name: 'Nama Lengkap',
      nim: 'NIM',
      fakultas: 'Fakultas',
      prodi: 'Program Studi',
      email: 'Email'
    };
    const missing = [];
    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!profile[key]) missing.push(label);
    });

    return { isComplete: missing.length === 0, missing };
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-tr from-blue-50 via-white to-blue-100">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-8 mt-14">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Pendaftaran UKM</h1>

            {duplicateWarning && (
              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                {duplicateWarning}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md text-green-700">
                {successMessage}
              </div>
            )}
            {!isProfileComplete && (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Profil Belum Lengkap
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Lengkapi data berikut sebelum mendaftar:</p>
                      <ul className="list-disc list-inside mt-1">
                        {incompleteFields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <div className="flex space-x-3">
                        <a
                          href="/dashboard/mahasiswa/profil"
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Lengkapi Profil
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Data Pendaftar</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nama Lengkap</p>
                  <p className="font-medium text-gray-700 mb-2">{userData.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NIM</p>
                  <p className="font-medium text-gray-700 mb-2">{userData.nim || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fakultas</p>
                  <p className="font-medium text-gray-700 mb-2">{userData.fakultas || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Program Studi</p>
                  <p className="font-medium text-gray-700 mb-2">{userData.prodi || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-700 mb-2">{userData.email || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pilih UKM
                  </label>
                  <select
                    value={selectedUKM}
                    onChange={handleUKMSelection}
                    className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 px-6 py-4"
                    disabled={isLoadingUKM}
                    required
                  >
                    <option value="">Pilih UKM</option>
                    {isLoadingUKM ? (
                      <option disabled>Loading...</option>
                    ) : availableUKMs.length > 0 ? (
                      availableUKMs.map((ukm) => (
                        <option key={ukm._id} value={ukm.name}>
                          {ukm.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Tidak ada UKM tersedia</option>
                    )}
                  </select>

                  {duplicateWarning && (
                    <p className="mt-2 text-sm text-red-600">
                      {duplicateWarning}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload KTM
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'ktm')}
                      className="w-full px-4 py-3 text-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">Format: JPG, JPEG, PNG, PDF (Max: 5MB)</p>
                    {ktmPreview && (
                      <div className="mt-3 relative">
                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                          {/* Use next/image for image preview */}
                          {ktmFile && ktmFile.type.startsWith('image/') ? (
                            <Image
                              src={ktmPreview}
                              alt="KTM Preview"
                              fill
                              className="object-cover"
                              sizes="192px"
                              style={{ objectFit: 'cover' }}
                              unoptimized={ktmPreview.startsWith('blob:') || ktmPreview.startsWith('data:')}
                            />
                          ) : (
                            <div className="flex flex-col justify-center items-center h-full w-full">
                              <ImageIcon className="w-16 h-16 text-gray-400" />
                              <span className="text-xs text-gray-500 mt-2">Preview tidak tersedia untuk PDF</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Preview KTM</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Sertifikat
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'sertifikat')}
                      className="w-full px-4 py-3 text-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-sm text-gray-500">Format: JPG, JPEG, PNG, PDF (Max: 5MB)</p>
                    {sertifikatPreview && (
                      <div className="mt-3 relative">
                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                          {/* Use next/image for image preview */}
                          {sertifikatFile && sertifikatFile.type.startsWith('image/') ? (
                            <Image
                              src={sertifikatPreview}
                              alt="Sertifikat Preview"
                              fill
                              className="object-cover"
                              sizes="192px"
                              style={{ objectFit: 'cover' }}
                              unoptimized={sertifikatPreview.startsWith('blob:') || sertifikatPreview.startsWith('data:')}
                            />
                          ) : (
                            <div className="flex flex-col justify-center items-center h-full w-full">
                              <ImageIcon className="w-16 h-16 text-gray-400" />
                              <span className="text-xs text-gray-500 mt-2">Preview tidak tersedia untuk PDF</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Preview Sertifikat</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alasan Mendaftar
                  </label>
                  <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    required
                    placeholder="Tuliskan alasan anda mendaftar UKM ini..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !selectedUKM ||
                    !ktmFile ||
                    !alasan ||
                    duplicateWarning ||
                    alreadyMember ||
                    !isProfileComplete
                  }
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl 
    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
    focus:ring-offset-2 disabled:bg-blue-400 transition-all duration-150 
    flex items-center justify-center space-x-2"
                >
                  {!isProfileComplete ? (
                    'Lengkapi Profil Terlebih Dahulu'
                  ) : isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Mendaftar...</span>
                    </>
                  ) : duplicateWarning ? (
                    'Anda Sudah Terdaftar'
                  ) : (
                    'Daftar UKM'
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
        <Footer className="mt-auto" />
      </div>
    </div>
  );
}