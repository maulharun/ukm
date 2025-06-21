"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertCircle } from "lucide-react";
import Navbar from "@/app/components/Dashboard/Navbar";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Footer from "@/app/components/Dashboard/Footer";

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUKM, setCurrentUKM] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const userData = JSON.parse(localStorage.getItem('users') || '{}');
        const ukmName = userData?.ukm?.[0] || 'UKM Universitas';
        setCurrentUKM(ukmName);

        const notifResponse = await fetch('/api/ukm/notifikasi-ukm');
        if (!notifResponse.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const notifData = await notifResponse.json();
        if (notifData.success) {
          const filteredNotifications = notifData.notifications.filter(
            (notif) => notif.ukm === ukmName
          );
          setNotifications(filteredNotifications);
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCheck className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Bell className="w-6 h-6 text-blue-500" />;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch('/api/ukm/notifikasi-ukm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          isRead: true
        })
      });

      if (!res.ok) throw new Error('Failed to update notification');

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} userRole="pengurus" userUKM={currentUKM} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userUKM={currentUKM} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Notifikasi
            </h1>
            <p className="text-gray-600 mt-1">{currentUKM}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-100">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Belum Ada Notifikasi
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Anda akan menerima notifikasi ketika ada aktivitas baru di UKM Anda
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                  className={`group bg-white rounded-xl shadow-sm border transition-all duration-200 
                    ${!notif.isRead 
                      ? 'border-l-4 border-l-blue-500 border-y-gray-100 border-r-gray-100 bg-blue-50/40' 
                      : 'border-gray-100'} 
                    hover:shadow-md`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-medium leading-6 
                            ${!notif.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Baru
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${!notif.isRead ? 'text-blue-800' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>

                        {notif.memberData && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                              Detail Anggota
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <p className="text-gray-700">
                                  <span className="font-medium">Nama:</span>{" "}
                                  {notif.memberData.name}
                                </p>
                                <p className="text-gray-700">
                                  <span className="font-medium">NIM:</span>{" "}
                                  {notif.memberData.nim}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-700">
                                  <span className="font-medium">Program Studi:</span>{" "}
                                  {notif.memberData.prodi}
                                </p>
                                <p className="text-gray-700">
                                  <span className="font-medium">Fakultas:</span>{" "}
                                  {notif.memberData.fakultas}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          {new Date(notif.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'full',
                            timeStyle: 'short'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer className="mt-auto" />
      </div>
    </div>
  );
}