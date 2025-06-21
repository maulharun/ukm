// Fungsi untuk mengambil data user dari localStorage
export function getUserData() {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('users');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }
  
  // Fungsi untuk mengecek apakah user sudah login
  export function isAuthenticated() {
    const userData = getUserData();
    return !!userData;
  }
  
  // Fungsi untuk validasi role
  export function checkAuth(allowedRoles) {
    const userData = getUserData();
    if (!userData) return false;
    return allowedRoles.includes(userData.role);
  }
  
  // Fungsi untuk redirect berdasarkan role
  export function getRedirectPath(role) {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'pengurus':
        return '/dashboard/pengurus';
      case 'mahasiswa':
        return '/dashboard/mahasiswa';
      default:
        return '/login';
    }
  }
  
  // Fungsi untuk logout
  export function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('users');
      window.location.href = '/login';
    }
  }