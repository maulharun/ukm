'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRedirectPath } from '@/app/utils/auth';
import { Mail, Lock, Loader, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await res.json();
      
      if (data.success) {
        // Save to localStorage for client-side auth
        localStorage.setItem('users', JSON.stringify(data.user));
        // Get correct redirect path based on role
        const redirectPath = getRedirectPath(data.user.role);
        router.push(redirectPath);
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md transform transition-all">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8 border border-gray-100">
          <div className="text-center space-y-2">
            <LogIn className="mx-auto h-12 w-12 text-blue-600 animate-pulse" />
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Welcome Back
            </h2>
            <p className="text-gray-500">Sign in to continue</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 peer-focus:text-blue-600" />
                <input
                  type="email"
                  required
                  id="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="peer w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                  placeholder="Email"
                />
                <label
                  htmlFor="email"
                  className="absolute left-12 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Email Address
                </label>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 peer-focus:text-blue-600" />
                <input
                  type="password"
                  required
                  id="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="peer w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                  placeholder="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-12 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Password
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 flex items-center justify-center space-x-2 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Sign in</span>
                </>
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Belum punya akun?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline">
                  Daftar disini
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}