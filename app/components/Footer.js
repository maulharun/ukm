import React from 'react';

const Footer = React.memo(function Footer({ className = '' }) {
  return (
    <footer className={`w-full text-center text-sm text-gray-500 py-6 border-t border-gray-100 bg-white/50 backdrop-blur-sm ${className}`}>
      &copy; {new Date().getFullYear()} Ma&#39;soem University. Sistem Informasi UKM Mahasiswa.
    </footer>
  );
});

export default Footer;