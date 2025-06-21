'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Navbar from '@/app/components/Dashboard/Navbar';
import Footer from '@/app/components/Dashboard/Footer';
import { Users } from 'lucide-react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState([
    { title: 'Total Anggota', value: '-', icon: Users, color: 'bg-blue-500' }
  ]);
  const [allEvents, setAllEvents] = useState([]);
  const [ukmPengurus, setUkmPengurus] = useState(''); // nama UKM yang dikelola pengurus

  useEffect(() => {
    // Ambil data user pengurus dari localStorage, misal: { ... , ukm: "Basket" }
    const userData = JSON.parse(localStorage.getItem('users'));
    const ukmName = userData?.ukm || ''; // jika field ukm berupa string nama ukm
    setUkmPengurus(ukmName);

    if (!ukmName) return;

    // Fetch total anggota untuk UKM ini
    fetch(`/api/ukm/members?ukm=${encodeURIComponent(ukmName)}`)
      .then(res => res.json())
      .then(data => {
        setStats(prev => prev.map(stat =>
          stat.title === 'Total Anggota'
            ? { ...stat, value: data.total ?? '-' }
            : stat
        ));
      });

      if (!ukmName) return;

      // Fetch total anggota untuk UKM ini
      fetch(`/api/ukm/anggota?ukm=${encodeURIComponent(ukmName)}`)
        .then(res => res.json())
        .then(data => {
          setStats(prev => prev.map(stat =>
            stat.title === 'Total Anggota'
              ? { ...stat, value: data.total ?? '-' }
              : stat
          ));
        });

      // Fetch event untuk UKM ini saja
      fetch(`/api/pengurus/kegiatan?ukm=${encodeURIComponent(ukmName)}`)
        .then(res => res.json())
        .then(data => {
          setAllEvents(Array.isArray(data.activities) ? data.activities : []);
        });
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} userRole="pengurus" userUKM={ukmPengurus} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Navbar toggleSidebar={toggleSidebar} userUKM={ukmPengurus} />
          <main className="flex-1 pt-20 px-4 sm:px-6 pb-10">
            <div className="max-w-7xl mx-auto w-full">
              {/* Header */}
              <header className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Dashboard Pengurus UKM {ukmPengurus}
                </h2>
                <p className="text-gray-500 mt-2 text-base">
                  Selamat datang di dashboard pengurus UKM <span className="font-semibold">{ukmPengurus}</span>. Lihat statistik anggota dan event UKM Anda di sini.
                </p>
              </header>

              {/* Statistik */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-5 bg-white/60 backdrop-blur-md px-7 py-7 rounded-3xl shadow-lg border border-gray-100 transition-all hover:scale-[1.03] hover:shadow-2xl hover:bg-white"
                  >
                    <div className={`flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${stat.color} from-white/80 to-white/10 shadow-inner group-hover:shadow-xl transition`}>
                      <stat.icon className="w-8 h-8 text-white drop-shadow" strokeWidth={2.4} />
                    </div>
                    <div>
                      <div className="text-[15px] text-gray-500 font-semibold mb-1 tracking-wide">{stat.title}</div>
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Semua Event UKM */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Event UKM {ukmPengurus}</h3>
                <div className="space-y-3">
                  {allEvents.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">Tidak ada event UKM.</div>
                  ) : (
                    allEvents.map((event, i) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition">
                        <div>
                          <div className="font-semibold text-gray-800">{event.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{event.ukm}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{event.status}</div>
                        </div>
                        <span className="text-sm font-semibold text-green-600 mt-2 md:mt-0">
                          {new Date(event.date).toLocaleDateString('id-ID', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }