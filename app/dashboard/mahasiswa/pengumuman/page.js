"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertCircle } from "lucide-react";
import Navbar from "@/app/components/Dashboard/Navbar";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Footer from "@/app/components/Dashboard/Footer";

export default function PengumumanPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setIsLoading(true);
                const userData = JSON.parse(localStorage.getItem('users'));

                if (!userData?.id) {
                    throw new Error('User not authenticated');
                }

                const res = await fetch(`/api/users/notifikasi-users?userId=${userData.id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.message);

                setNotifications(data.notifications);
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
            const res = await fetch('/api/users/notifikasi-users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
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
            <Sidebar isOpen={sidebarOpen} userRole="mahasiswa" />

            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="p-8 pt-20">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">
                            Pengumuman & Notifikasi
                        </h1>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    Belum ada notifikasi
                                </h3>
                                <p className="text-gray-500">
                                    Anda belum memiliki notifikasi atau pengumuman apapun
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        onClick={() => !notif.isRead && markAsRead(notif._id)}
                                        className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-200 cursor-pointer
        ${!notif.isRead
                                                ? 'border-l-4 border-blue-500 bg-blue-50 hover:bg-blue-100'
                                                : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className={`text-lg font-semibold ${!notif.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    {!notif.isRead && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                            Baru
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`${!notif.isRead ? 'text-blue-800' : 'text-gray-600'}`}>
                                                    {notif.message}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                                    <span>
                                                        {new Date(notif.createdAt).toLocaleString('id-ID', {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        })}
                                                    </span>
                                                    {notif.ukmName && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{notif.ukmName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}