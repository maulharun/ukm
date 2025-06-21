"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    switch (user.role) {
      case 'mahasiswa':
        router.replace('/dashboard/mahasiswa');
        break;
      case 'pengurus_ukm':
        router.replace('/dashboard/pengurus');
        break;
      case 'admin':
        router.replace('/dashboard/admin');
        break;
      default:
        router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-600">
        Mengarahkan ke dashboard...
      </div>
    </div>
  );
}