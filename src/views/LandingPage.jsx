import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase'; // Pastikan import database
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const backgrounds = [
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 
    'https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'  
  ];

  // Effect 1: Mengganti slide setiap 5 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [backgrounds.length]);

  // Effect 2: Mencatat kunjungan ke Firebase Firestore
  useEffect(() => {
    const trackVisitor = async () => {
      const statsRef = doc(db, 'statistics', 'visitors');
      try {
        const docSnap = await getDoc(statsRef);
        if (docSnap.exists()) {
          // Jika dokumen sudah ada, tambahkan count + 1
          await updateDoc(statsRef, { count: increment(1) });
        } else {
          // Jika dokumen belum ada, buat baru dengan nilai 1
          await setDoc(statsRef, { count: 1 });
        }
      } catch (error) {
        console.error("Gagal mencatat pengunjung:", error);
      }
    };

    trackVisitor();
  }, []); // Array kosong memastikan ini hanya berjalan 1x saat halaman pertama kali dibuka

  return (
    <div className="relative w-full min-h-screen flex flex-col font-sans text-white bg-black overflow-hidden">
      
      {/* BACKGROUND PHOTO SLIDER */}
      {backgrounds.map((bg, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out z-0
            ${index === currentSlide ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ backgroundImage: `url(${bg})` }}
        ></div>
      ))}

      <div className="absolute inset-0 bg-black/75 z-0 pointer-events-none"></div>

      {/* KONTEN UTAMA */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        <header className="px-8 py-6 w-full flex justify-between items-center">
          <div className="text-2xl font-extrabold tracking-tight">
            One<span className="text-[#419848]">Family</span>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-[1px] bg-[#419848]"></div>
            <span className="text-xs md:text-sm tracking-[0.2em] font-medium text-gray-300 uppercase">
              Warisan Keluarga • 2026
            </span>
            <div className="w-12 h-[1px] bg-[#419848]"></div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
            One
            <br />
            <span className="text-[#419848]">Family.</span>
          </h1>

          <p className="max-w-xl text-gray-400 mt-4 mb-12 text-sm md:text-lg font-light leading-relaxed">
            Jelajahi silsilah keluarga dan simpan kenangan berharga untuk generasi mendatang.
          </p>

          <Link 
            to="/login" 
            className="group relative inline-flex items-center justify-center px-8 py-3 bg-[#419848] hover:bg-[#327a38] text-white font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(65,152,72,0.4)] hover:shadow-[0_0_35px_rgba(65,152,72,0.7)]"
          >
            <span className="mr-3 tracking-wide text-sm md:text-base">MASUK</span>
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </Link>
        </main>

        <footer className="px-8 py-6 w-full flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-gray-500 font-semibold tracking-[0.1em] border-t border-white/5">
          <div className="mb-4 md:mb-0">
            © 2026 ANCESTRYFLOW. HAK CIPTA DILINDUNGI.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">PRIVASI</a>
            <a href="#" className="hover:text-white transition-colors">ARSIP</a>
            <a href="#" className="hover:text-white transition-colors">KONTAK</a>
          </div>
        </footer>

      </div>
    </div>
  );
}