'use client';
import {
  Users,
  UserCircle,
  Calendar,
  Layout,
  ClipboardList,
  FileText,
  Building,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Menu configurations for each role
const menuConfig = {
  mahasiswa: [
    { icon: Layout, label: 'Dashboard', href: '/dashboard/mahasiswa' },
    { icon: Building, label: 'Daftar UKM', href: '/dashboard/mahasiswa/daftar-ukm' },
    { icon: Calendar, label: 'Jadwal Kegiatan', href: '/dashboard/mahasiswa/jadwal', },
    { icon: Bell, label: 'Pengumuman', href: '/dashboard/mahasiswa/pengumuman', showBadge: true, globalUnreadCount: 0 },
    { icon: FileText, label: 'Dokumentasi', href: '/dashboard/mahasiswa/dokumentasi' },
    { icon: UserCircle, label: 'Profil', href: '/dashboard/mahasiswa/profil' },
  ],
  pengurus: [
    { icon: Layout, label: 'Dashboard', href: '/dashboard/pengurus' },
    { icon: Users, label: 'Anggota UKM', href: '/dashboard/pengurus/members' },
    { icon: Calendar, label: 'Kelola Kegiatan', href: '/dashboard/pengurus/kegiatan' },
    { icon: Bell, label: 'Notifikasi', href: '/dashboard/pengurus/pengumuman', showBadge: true, globalUnreadCount: 0 },
    { icon: FileText, label: 'Dokumentasi', href: '/dashboard/pengurus/dokumentasi' },
  ],
  admin: [
    { icon: Layout, label: 'Dashboard', href: '/dashboard/admin/' },
    { icon: Building, label: 'Kelola UKM', href: '/dashboard/admin/kelola-ukm' },
    { icon: Users, label: 'Kelola Pengguna', href: '/dashboard/admin/users' },
    { icon: ClipboardList, label: 'Validasi Pendaftaran', href: '/dashboard/admin/validasi', showBadge: true, pendingCount: 0 },
  ]
};

export default function Sidebar({ isOpen, userRole = 'mahasiswa', userUKM }) {
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentUKM, setCurrentUKM] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (userRole === 'pengurus') {
      try {
        const userData = JSON.parse(localStorage.getItem('users'));
        setCurrentUKM(userData?.ukm?.[0]?.name || 'UKM Universitas');
      } catch (error) {
        console.error('Error loading UKM data:', error);
        setCurrentUKM('UKM Universitas');
      }
    }
  }, [userRole]);

  const menuItems = menuConfig[userRole] || menuConfig.mahasiswa;

 useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('users'));

        // Handle admin notifications
        if (userRole === 'admin') {
          try {
            const regResponse = await fetch('/api/ukm/validasi');
            const regData = await regResponse.json();
            
            if (regData.success) {
              // Map and filter registrations with pending status
              const pendingRegistrations = regData.registrations
                .map(reg => ({
                  _id: reg._id,
                  userId: reg.userId || '',
                  nama: reg.nama || '',
                  email: reg.email || '',
                  nim: reg.nim || '',
                  fakultas: reg.fakultas || '',
                  prodi: reg.prodi || '',
                  ukm: reg.ukm || '',
                  status: reg.status || 'pending',
                  createdAt: reg.createdAt || new Date()
                }))
                .filter(reg => reg.status === 'pending');
        
              setPendingCount(pendingRegistrations.length);
            }
          } catch (error) {
            console.error('Error fetching pending registrations:', error);
            setPendingCount(0);
          }
        }

        // Handle mahasiswa notifications
        if (userRole === 'mahasiswa' && userData?.id) {
          const response = await fetch(`/api/users/notifikasi-users?userId=${userData.id}`);
          const data = await response.json();
          if (data.success) {
            const unreadCount = data.notifications.filter(notif => !notif.isRead).length;
            setGlobalUnreadCount(unreadCount);
          }
        }

        // Handle pengurus notifications
        if (userRole === 'pengurus' && userUKM) {
          const response = await fetch(`/api/ukm/notifikasi-ukm?ukm=${encodeURIComponent(userUKM)}`);
          const data = await response.json();
          if (data.success) {
            const unreadCount = data.notifications.filter(notif => 
              !notif.isRead && notif.ukm === userUKM
            ).length;
            setGlobalUnreadCount(unreadCount);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [userRole, userUKM, refreshTrigger]); 

  const renderBadge = (item) => {
    if ((item.label === 'Pengumuman' || item.label === 'Kelola Pengumuman') && globalUnreadCount > 0) {
      return (
        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
          {globalUnreadCount}
        </span>
      );
    }
    if (item.label === 'Validasi Pendaftaran' && pendingCount > 0) {
      return (
        <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-medium rounded-full">
          {pendingCount}
        </span>
      );
    }
    return null;
  };
   return (
    <aside className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-blue-900 to-blue-800 
      text-white z-40 transform transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
      border-r border-white/5 shadow-2xl backdrop-blur-sm`}>
      <div className="p-6 h-full flex flex-col">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-white/95 px-2">
          <Building className="w-6 h-6 text-indigo-400" />
          <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            UKM Universitas
          </span>
        </h2>

        <ul className="space-y-1.5 flex-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl 
                  hover:bg-white/10 transition-colors duration-200`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-indigo-300" />
                  <span>{item.label}</span>
                </div>
                {renderBadge(item)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="pt-4 mt-auto border-t border-white/10">
          <div className="px-4 py-3 text-xs text-white/50">
            © 2024 UKM Universitas
          </div>
        </div>
      </div>
    </aside>
  );
}