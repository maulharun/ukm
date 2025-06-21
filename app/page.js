import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      <main className="flex-grow px-6 md:px-12 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent animate-fade-in">
          Sistem Informasi UKM Mahasiswa
        </h1>
        <p className="text-xl md:text-2xl max-w-3xl text-gray-600 mb-12 leading-relaxed animate-fade-in-up">
          Jelajahi berbagai Unit Kegiatan Mahasiswa, daftarkan dirimu, dan ikuti agenda kegiatan kampus dengan mudah dan modern.
        </p>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
}