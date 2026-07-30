import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Gagal logout:', err);
        }
    };

    // Fungsi untuk mengecek menu aktif
    const isActive = (path) => {
        const currentPath = location.pathname;
        return currentPath === path || currentPath === path + '/';
    };

    const getLinkClass = (path) => {
        const baseClass = "text-sm font-medium pb-1.5 transition-all border-b-[3px]";
        if (isActive(path)) {
            return `${baseClass} text-[#0d631b] font-bold border-[#0d631b]`;
        }
        return `${baseClass} text-[#40493d] hover:text-[#0d631b] border-transparent`;
    };

    return (
        <header className="bg-white border-b border-[#bfcaba]/30 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20 gap-4">
                
                {/* 1. BAGIAN LOGO */}
                <Link to="/home" className="flex items-center gap-2.5 group py-4 shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#0d631b] text-white flex items-center justify-center shadow-md shadow-[#0d631b]/20 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                    </div>
                    <span className="text-xl font-extrabold text-[#111c2d] tracking-tight">AncestryFlow</span>
                </Link>

                {/* Tautan Navigasi */}
                <nav className="hidden md:flex items-center gap-8 shrink-0">
                    <Link to="/home" className={getLinkClass('/home')}>
                        Beranda
                    </Link>
                    
                    <Link to="/tree" className={getLinkClass('/tree')}>
                        Pohon Keluarga
                    </Link>
                    
                    <Link to="/members" className={getLinkClass('/members')}>
                        Anggota
                    </Link>
                    
                    <Link to="/gallery" className={getLinkClass('/gallery')}>
                        Galeri
                    </Link>
                </nav>

                {/* Elemen Sisi Kanan */}
                <div className="hidden md:flex items-center gap-4 shrink-0">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {/* <span className="material-symbols-outlined text-lg">search</span> */}
                        </span>
                        <input 
                            type="text" 
                            placeholder="Cari leluhur..." 
                            className="w-56 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#0d631b] focus:bg-white transition-all text-[#111c2d]"
                        />
                    </div>

                    <button className="px-5 py-2 rounded-full bg-[#0d631b] text-white text-sm font-semibold shadow-sm hover:bg-[#094813] transition-all">
                        Aksi
                    </button>

                    {currentUser ? (
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 text-sm font-semibold transition-all"
                            title="Keluar"
                        >
                            <span className="material-symbols-outlined text-base">logout</span>
                            <span>Keluar</span>
                        </button>
                    ) : (
                        <Link 
                            to="/login" 
                            className="px-5 py-2 rounded-full bg-[#0d631b] text-white text-sm font-semibold shadow-sm hover:bg-[#094813] transition-all"
                        >
                            Masuk
                        </Link>
                    )}
                </div>

                {/* Tombol Menu Mobile */}
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl text-[#40493d] hover:bg-gray-100"
                >
                    <span className="material-symbols-outlined">
                        {isMobileMenuOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>
        </header>
    );
}