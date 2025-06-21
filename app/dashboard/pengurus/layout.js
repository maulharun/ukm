'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PengurusLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('users');
        if (!userData) {
          router.push('/login');
          return;
        }

        // Parse and validate user role
        const user = JSON.parse(userData);
        if (user.role !== 'pengurus') {
          // Redirect based on role
          if (user.role === 'admin') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard/mahasiswa');
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