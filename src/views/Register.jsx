import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const togglePassword = () => setShowPassword(!showPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            // Daftarkan akun beserta username ke Firebase
            await register(email, password, username);
            setIsLoading(false);
            setShowToast(true);

            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setIsLoading(false);
            if (err.code === 'auth/email-already-in-use') {
                setErrorMessage('Email ini sudah terdaftar. Silakan langsung login.');
            } else if (err.code === 'auth/weak-password') {
                setErrorMessage('Kata sandi terlalu lemah (minimal 6 karakter).');
            } else {
                setErrorMessage('Gagal mendaftar: ' + err.message);
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-800 selection:bg-[#0d631b]/20">
            
            {/* Bagian Kiri: Visual / Hero Section (Hanya tampil di layar besar) */}
            <section className="hidden lg:flex relative w-1/2 overflow-hidden bg-slate-900">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20000ms] hover:scale-110 opacity-70" 
                    style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDxffCD8-Ewv2LRjJOegvKowrQXaQE0M-szjm4uRWiDez53X5_s7yWc85ij2Cw5zz_7CMwSBkPpMRuVk3EtkxjUu3_qOVG9axieJs0CyyZYCC-880JGY40cCfu2TFt9hOEr08w7cjV6TB6O1PFWpsBAy9XcVrLqNHSaxZAR86yBnlSMhNRW3715ioKkqYxeF4t648c0ApxbGsji4bQgM-A5KxbGRqOrfHeX6NUwfH4jR-pWZXKCHx9OLA')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
                    <div className="mb-6">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-widest uppercase border border-white/20">
                            <span className="material-symbols-outlined text-[16px]">diversity_3</span>
                            Warisan Keluarga
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
                        Mulai dokumentasikan <br /> asal usul Anda hari ini.
                    </h1>
                    <p className="text-lg text-slate-300 font-light max-w-md leading-relaxed">
                        "Bangsa tanpa pengetahuan tentang sejarah masa lalu, asal usul, dan budayanya ibarat pohon tanpa akar."
                    </p>
                </div>
            </section>

            {/* Bagian Kanan: Form Register */}
            <section className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12 md:px-16 relative overflow-y-auto">
                <div className="w-full max-w-md">
                    
                    {/* Header Logo & Judul */}
                    <div className="mb-10 text-center lg:text-left">
                        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-[#0d631b] text-white flex items-center justify-center shadow-md shadow-[#0d631b]/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                            </div>
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">OneFamily.</span>
                        </Link>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Buat Akun Baru</h2>
                        <p className="text-slate-500 text-sm">Mulai petakan silsilah keluarga dan lestarikan cerita Anda.</p>
                    </div>

                    {/* Pesan Error */}
                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
                            <span className="font-medium leading-relaxed">{errorMessage}</span>
                        </div>
                    )}

                    {/* Form Input */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Input Username */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                                Nama Pengguna (Username)
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0d631b] transition-colors pointer-events-none">
                                    badge
                                </span>
                                <input 
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0d631b] focus:ring-4 focus:ring-[#0d631b]/10 transition-all duration-300" 
                                    id="username" 
                                    type="text" 
                                    placeholder="contoh_username" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        {/* Input Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                                Alamat Email
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0d631b] transition-colors pointer-events-none">
                                    mail
                                </span>
                                <input 
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0d631b] focus:ring-4 focus:ring-[#0d631b]/10 transition-all duration-300" 
                                    id="email" 
                                    type="email" 
                                    placeholder="nama@email.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        {/* Input Kata Sandi */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                                Kata Sandi <span className="text-slate-400 font-normal">(Min. 6 Karakter)</span>
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0d631b] transition-colors pointer-events-none">
                                    lock
                                </span>
                                <input 
                                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0d631b] focus:ring-4 focus:ring-[#0d631b]/10 transition-all duration-300" 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                                <button 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer" 
                                    type="button" 
                                    onClick={togglePassword}
                                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Tombol Daftar */}
                        <button 
                            className="w-full py-3.5 bg-[#0d631b] hover:bg-[#0a4d15] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#0d631b]/25 hover:shadow-[#0d631b]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : (
                                <>
                                    <span>Daftar Akun</span>
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link Login */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Sudah memiliki akun?{' '}
                            <Link className="text-[#0d631b] font-bold hover:underline ml-1" to="/login">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>

                </div>
            </section>

            {/* Notifikasi Toast Berhasil */}
            <div className={`fixed bottom-6 right-6 transition-all duration-500 z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                <div className="bg-[#0d631b] text-white px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-[#0d631b]/30">
                    <span className="material-symbols-outlined text-[#cbffc2]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div className="flex flex-col pr-4">
                        <p className="text-sm font-bold">Pendaftaran Berhasil!</p>
                        <p className="text-xs text-white/80">Mengarahkan ke halaman masuk...</p>
                    </div>
                </div>
            </div>
            
        </div>
    );
}