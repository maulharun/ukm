'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MahasiswaLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is logged in
        const userData = localStorage.getItem('users');
        if (!userData) {
          router.push('/login');
          return;
        }

        // Validate user role
        const user = JSON.parse(userData);
        if (user.role !== 'mahasiswa') {
          // Redirect based on role
          if (user.role === 'admin') {
            router.push('/dashboard/admin');
          } else if (user.role === 'pengurus') {
            router.push('/dashboard/pengurus');
          }
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}