import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Login() {
    const [identifier, setIdentifier] = useState(''); // Bisa diisi Username atau Email
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const togglePassword = () => setShowPassword(!showPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            let targetEmail = identifier.trim();

            // Jika input TIDAK mengandung '@', anggap itu adalah USERNAME dan cari emailnya di Firestore
            if (!targetEmail.includes('@')) {
                const q = query(collection(db, 'users'), where('username', '==', targetEmail));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error('Username tidak ditemukan. Silakan periksa kembali.');
                }

                // Ambil email dari data dokumen user yang ditemukan
                const userData = querySnapshot.docs[0].data();
                targetEmail = userData.email;
            }

            // Proses login menggunakan email yang didapat (atau langsung jika input berupa email)
            await login(targetEmail, password);

            setIsLoading(false);
            setShowToast(true);

            setTimeout(() => {
                navigate('/home');
            }, 1500);
        } catch (err) {
            setIsLoading(false);
            if (
                err.code === 'auth/user-not-found' || 
                err.code === 'auth/wrong-password' || 
                err.code === 'auth/invalid-credential' ||
                err.message.includes('tidak ditemukan')
            ) {
                setErrorMessage('Username/Email atau kata sandi salah.');
            } else if (err.code === 'auth/invalid-email') {
                setErrorMessage('Format email atau username tidak valid.');
            } else {
                setErrorMessage(err.message || 'Gagal masuk. Periksa kembali data Anda.');
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-800 selection:bg-[#0d631b]/20">
            
            {/* Bagian Kiri: Visual / Hero Section (Hanya tampil di layar besar) */}
            <section className="hidden lg:flex relative w-1/2 overflow-hidden bg-slate-900">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20000ms] hover:scale-110 opacity-70" 
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')` }}
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
                        Selamat datang kembali <br /> di akar keluarga Anda.
                    </h1>
                    <p className="text-lg text-slate-300 font-light max-w-md leading-relaxed">
                        "Menghubungkan generasi, melestarikan warisan, dan menjaga cerita keluarga tetap hidup selamanya."
                    </p>
                </div>
            </section>

            {/* Bagian Kanan: Form Login */}
            <section className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12 md:px-16 relative">
                <div className="w-full max-w-md">
                    
                    {/* Header Logo & Judul */}
                    <div className="mb-10 text-center lg:text-left">
                        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-[#0d631b] text-white flex items-center justify-center shadow-md shadow-[#0d631b]/20 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                            </div>
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">OneFamily</span>
                        </Link>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Masuk ke Akun</h2>
                        <p className="text-slate-500 text-sm">Silakan masukkan detail Anda untuk melanjutkan.</p>
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
                        
                        {/* Input Identitas (Username / Email) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="identifier">
                                Username atau Email
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0d631b] transition-colors pointer-events-none">
                                    person
                                </span>
                                <input 
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0d631b] focus:ring-4 focus:ring-[#0d631b]/10 transition-all duration-300" 
                                    id="identifier" 
                                    type="text" 
                                    placeholder="Contoh: budi123 atau budi@email.com" 
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        {/* Input Kata Sandi */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                                Kata Sandi
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors" 
                                    type="button" 
                                    onClick={togglePassword}
                                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Tombol Masuk */}
                        <button 
                            className="w-full py-3.5 bg-[#0d631b] hover:bg-[#0a4d15] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#0d631b]/25 hover:shadow-[#0d631b]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : (
                                <>
                                    <span>Masuk</span>
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link Daftar */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Belum memiliki akun?{' '}
                            <Link className="text-[#0d631b] font-bold hover:underline ml-1" to="/register">
                                Daftar Sekarang
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
                        <p className="text-sm font-bold">Berhasil Masuk!</p>
                        <p className="text-xs text-white/80">Mengarahkan ke silsilah Anda...</p>
                    </div>
                </div>
            </div>
            
        </div>
    );
}