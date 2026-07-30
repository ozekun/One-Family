import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export default function MainLayout({ children }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // STATE BARU: Untuk kontrol menu hamburger di HP
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth() || {};

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    if (logout) {
      logout();
    }
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getInitial = () => {
    if (currentUser?.displayName) return currentUser.displayName.charAt(0).toUpperCase();
    if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
    return 'U';
  };

  // Fungsi untuk menutup menu mobile setiap kali menu diklik
  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="w-full h-screen bg-[#f9f9ff] flex flex-col overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* HEADER NAVBAR */}
      <header className="h-[72px] bg-white border-b border-slate-200/60 z-50 px-4 sm:px-10 flex items-center justify-between shadow-xs flex-none relative">
        
        <div className="flex items-center gap-3">
          {/* TOMBOL HAMBURGER (HANYA TAMPIL DI HP) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          {/* LOGO */}
          <Link to="/home" className="text-xl font-extrabold text-[#0d631b] tracking-tight flex items-center gap-2">
            <span>OneFamily</span>
          </Link>
        </div>

        {/* MENU DESKTOP (Sembunyi di HP) */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-slate-600 h-full">
          <div className="relative h-[72px] flex items-center">
            <Link to="/home" className={`transition-colors py-2 ${isActive('/home') ? 'text-[#0d631b] font-semibold' : 'hover:text-[#0d631b]'}`}>Beranda</Link>
            {isActive('/home') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0d631b]" />}
          </div>
          <div className="relative h-[72px] flex items-center">
            <Link to="/tree" className={`transition-colors py-2 ${isActive('/tree') ? 'text-[#0d631b] font-semibold' : 'hover:text-[#0d631b]'}`}>Silsilah Keluarga</Link>
            {isActive('/tree') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0d631b]" />}
          </div>
          <div className="relative h-[72px] flex items-center">
            <Link to="/members" className={`transition-colors py-2 ${isActive('/members') ? 'text-[#0d631b] font-semibold' : 'hover:text-[#0d631b]'}`}>Anggota</Link>
            {isActive('/members') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0d631b]" />}
          </div>
          <div className="relative h-[72px] flex items-center">
            <Link to="/gallery" className={`transition-colors py-2 ${isActive('/gallery') ? 'text-[#0d631b] font-semibold' : 'hover:text-[#0d631b]'}`}>Galeri</Link>
            {isActive('/gallery') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0d631b]" />}
          </div>
        </nav>

        {/* BAGIAN PROFIL & LOGOUT */}
        <div className="flex items-center justify-end gap-2 md:gap-4 relative">
          {currentUser ? (
            <>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full transition-colors focus:outline-none cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0d631b] text-white font-bold text-sm shadow-sm">
                  {getInitial()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700 mr-2 max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email.split('@')[0]}
                </span>
                <span className="material-symbols-outlined text-slate-400 text-sm hidden md:block">expand_more</span>
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="absolute top-12 right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-500">Masuk sebagai</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{currentUser.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0d631b] transition-colors">
                      <span className="material-symbols-outlined text-lg">person</span> Profil Saya
                    </Link>
                    <button onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer">
                      <span className="material-symbols-outlined text-lg">logout</span> Keluar
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link to="/login" className="px-5 py-2 md:px-6 md:py-2.5 bg-[#0d631b] text-white rounded-full font-bold text-xs md:text-sm hover:bg-[#094713] transition-all shadow-sm cursor-pointer">
              Masuk
            </Link>
          )}
        </div>
      </header>

      {/* DROPDOWN MENU MOBILE (HANYA TAMPIL DI HP JIKA TOMBOL HAMBURGER DIKLIK) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-slate-200 z-40 px-6 py-4 flex flex-col gap-2 shadow-lg animate-in slide-in-from-top-2">
          <Link to="/home" onClick={handleMobileMenuClick} className={`p-3 rounded-xl font-semibold flex items-center gap-3 ${isActive('/home') ? 'bg-emerald-50 text-[#0d631b]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">home</span> Beranda
          </Link>
          <Link to="/tree" onClick={handleMobileMenuClick} className={`p-3 rounded-xl font-semibold flex items-center gap-3 ${isActive('/tree') ? 'bg-emerald-50 text-[#0d631b]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">account_tree</span> Silsilah Keluarga
          </Link>
          <Link to="/members" onClick={handleMobileMenuClick} className={`p-3 rounded-xl font-semibold flex items-center gap-3 ${isActive('/members') ? 'bg-emerald-50 text-[#0d631b]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">group</span> Anggota
          </Link>
          <Link to="/gallery" onClick={handleMobileMenuClick} className={`p-3 rounded-xl font-semibold flex items-center gap-3 ${isActive('/gallery') ? 'bg-emerald-50 text-[#0d631b]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">photo_library</span> Galeri
          </Link>
        </div>
      )}

      {/* KONTEN UTAMA HALAMAN */}
      <main className="w-full flex-1 relative overflow-y-auto flex flex-col">
        {children}
      </main>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-inner">
              <span className="material-symbols-outlined text-[28px]">logout</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Yakin Keluar?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Anda akan keluar dari sesi aplikasi saat ini.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer">Batal</button>
              <button onClick={handleLogoutConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-red-600/20 cursor-pointer">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}