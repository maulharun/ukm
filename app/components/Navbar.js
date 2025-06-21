"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-white/70 backdrop-blur-xl shadow-sm border-b border-gray-50/20 px-6 py-3 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="UKM Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            UKM Mahasiswa
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg 
            className="w-6 h-6 text-gray-700 transition-transform duration-200 ease-in-out" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" className="transition-all duration-200" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" className="transition-all duration-200" />
            )}
          </svg>
        </button>

{/* Desktop Navigation */}
<div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/"
            className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all"
          >
            Beranda
          </Link>
          <Link 
            href="/login"
            className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all"
          >
            Login
          </Link>
          <Link 
            href="/register"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 font-medium text-center hover:shadow-lg hover:-translate-y-0.5"
          >
            Daftar
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-white/90 backdrop-blur-lg shadow-lg transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col space-y-4 p-6">
            <Link 
              href="/"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
            >
              Beranda
            </Link>
            <Link 
              href="/login"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 font-medium text-center w-full"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}