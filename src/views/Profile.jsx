import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';

export default function Profile() {
  const { currentUser } = useAuth();
  
  // State untuk form update profil
  const [username, setUsername] = useState('');
  
  // State untuk form update password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State notifikasi & loading
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Mengisi username awal saat komponen dimuat
  useEffect(() => {
    if (currentUser?.displayName) {
      setUsername(currentUser.displayName);
    }
  }, [currentUser]);

  // Fungsi mengubah Username (Display Name di Firebase Auth)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setMessage('');
      setError('');
      setLoading(true);

      await updateProfile(currentUser, {
        displayName: username
      });

      setMessage('Profil berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      setError('Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi mengubah Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      return setError('Kata sandi minimal 6 karakter.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Kata sandi baru tidak cocok.');
    }

    try {
      setMessage('');
      setError('');
      setLoading(true);

      await updatePassword(currentUser, newPassword);

      setMessage('Kata sandi berhasil diubah!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      // Jika session terlalu lama, firebase akan meminta re-login (auth/requires-recent-login)
      if (err.code === 'auth/requires-recent-login') {
        setError('Sesi telah kedaluwarsa. Silakan keluar (logout) lalu masuk kembali sebelum mengubah sandi.');
      } else {
        setError('Gagal memperbarui kata sandi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Pengaturan Profil</h1>
        <p className="text-slate-500">Kelola detail akun dan kata sandi Anda di sini.</p>
      </div>

      {/* Pesan Notifikasi */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm flex items-start gap-2">
          <span className="material-symbols-outlined shrink-0 text-lg">error</span>
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0d631b]">person</span>
          Informasi Dasar
        </h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Email (Tidak bisa diubah)</label>
            <input 
              type="email" 
              value={currentUser?.email || ''} 
              disabled
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Pengguna (Username)</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan nama pengguna baru"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0d631b] focus:ring-2 focus:ring-[#0d631b]/20 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-[#0d631b] hover:bg-[#0a4d15] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0d631b]">lock</span>
          Ubah Kata Sandi
        </h2>
        
        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kata Sandi Baru</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0d631b] focus:ring-2 focus:ring-[#0d631b]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0d631b] focus:ring-2 focus:ring-[#0d631b]/20 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
          </button>
        </form>
      </div>
    </div>
  );
}