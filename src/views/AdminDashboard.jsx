import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // State Login Admin
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('admin_auth') === 'true';
  });
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State Navigasi
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Data
  const [users, setUsers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0); 

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAllData();
    }
  }, [isAdminLoggedIn]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Username atau password admin salah!');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('admin_auth');
    setUsername('');
    setPassword('');
    navigate('/');
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const userSnap = await getDocs(collection(db, 'users'));
      setUsers(userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const milestoneSnap = await getDocs(collection(db, 'milestones'));
      setMilestones(milestoneSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const gallerySnap = await getDocs(collection(db, 'gallery'));
      setGalleries(gallerySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const memberSnap = await getDocs(collection(db, 'members'));
      setMembers(memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const statsRef = doc(db, 'statistics', 'visitors');
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        setVisitorCount(statsSnap.data().count || 0);
      } else {
        await setDoc(statsRef, { count: 0 });
        setVisitorCount(0);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collectionName, id) => {
    if (!window.confirm(`Yakin ingin menghapus data ini dari database ${collectionName}?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === 'users') setUsers(users.filter(u => u.id !== id));
      if (collectionName === 'milestones') setMilestones(milestones.filter(m => m.id !== id));
      if (collectionName === 'gallery') setGalleries(galleries.filter(g => g.id !== id));
      if (collectionName === 'members') setMembers(members.filter(m => m.id !== id));
      alert('Data berhasil dihapus!');
    } catch (error) {
      console.error('Gagal menghapus data:', error);
      alert('Gagal menghapus data.');
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);
  };

  // ==========================================
  // TAMPILAN LOGIN ADMIN
  // ==========================================
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500/30">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Akses khusus pengelola database</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center font-medium animate-in fade-in">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username Admin</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                required
              />
            </div>
            <button type="submit" className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all mt-4 cursor-pointer">
              Masuk Dashboard
            </button>
            <button type="button" onClick={() => navigate('/')} className="w-full py-3 text-slate-500 hover:text-slate-800 text-sm font-semibold mt-2 cursor-pointer transition-colors">
              Kembali ke Website
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN DASHBOARD ADMIN
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f4f7f6] font-sans overflow-hidden selection:bg-emerald-500/20">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shrink-0 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">admin_panel_settings</span>
            <div>
              <h2 className="font-bold text-lg leading-tight">Admin<br/>Workspace</h2>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold cursor-pointer ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <span className="material-symbols-outlined">dashboard</span> Ringkasan
          </button>
          <button onClick={() => handleTabChange('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold cursor-pointer ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <span className="material-symbols-outlined">group</span> Akun Pengguna
          </button>
          <button onClick={() => handleTabChange('members')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold cursor-pointer ${activeTab === 'members' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <span className="material-symbols-outlined">account_tree</span> Anggota Silsilah
          </button>
          <button onClick={() => handleTabChange('milestones')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold cursor-pointer ${activeTab === 'milestones' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <span className="material-symbols-outlined">history</span> Riwayat (Milestone)
          </button>
          <button onClick={() => handleTabChange('gallery')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold cursor-pointer ${activeTab === 'gallery' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <span className="material-symbols-outlined">photo_library</span> Galeri Foto
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-colors text-sm font-bold cursor-pointer">
            <span className="material-symbols-outlined">logout</span> Keluar
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm flex-none">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            <span>Admin Portal</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined animate-spin text-4xl text-emerald-600">progress_activity</span>
            </div>
          ) : (
            <>
              {/* TAB: DASHBOARD QUICKVIEW */}
              {activeTab === 'dashboard' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Ringkasan Sistem</h2>
                  
                  {/* Quickview Cards (Kini grid-cols-2 untuk HP) */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6 mb-8">
                    
                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 border-l-4 border-l-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                          <span className="material-symbols-outlined text-[16px] md:text-[20px]">monitoring</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl md:text-3xl font-black text-slate-800">{visitorCount.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 leading-tight">Total Pengunjung</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <span className="material-symbols-outlined text-[16px] md:text-[20px]">group</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl md:text-3xl font-black text-slate-800">{users.length}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 leading-tight">Akun Terdaftar</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 border-l-4 border-l-rose-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                          <span className="material-symbols-outlined text-[16px] md:text-[20px]">account_tree</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl md:text-3xl font-black text-slate-800">{members.length}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 leading-tight">Anggota Silsilah</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 border-l-4 border-l-purple-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                          <span className="material-symbols-outlined text-[16px] md:text-[20px]">history_edu</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl md:text-3xl font-black text-slate-800">{milestones.length}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 leading-tight">Total Riwayat</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                          <span className="material-symbols-outlined text-[16px] md:text-[20px]">collections</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl md:text-3xl font-black text-slate-800">{galleries.length}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 leading-tight">Total Foto Galeri</p>
                      </div>
                    </div>

                  </div>

                  <div className="bg-emerald-50 text-emerald-800 p-5 md:p-6 rounded-2xl border border-emerald-100 flex gap-4">
                    <span className="material-symbols-outlined text-3xl hidden sm:block">check_circle</span>
                    <div>
                      <h3 className="font-bold mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined sm:hidden">check_circle</span> 
                        Status Sistem Normal
                      </h3>
                      <p className="text-sm opacity-90">Koneksi ke Firebase Firestore stabil. Seluruh data berhasil dimuat dengan aman.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: AKUN PENGGUNA */}
              {activeTab === 'users' && (
                <div className="animate-in fade-in duration-300 w-full">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Kelola Akun Pengguna</h2>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3 md:p-4 font-semibold">ID / UID</th>
                          <th className="p-3 md:p-4 font-semibold">Username</th>
                          <th className="p-3 md:p-4 font-semibold">Email</th>
                          <th className="p-3 md:p-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.length > 0 ? users.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/50">
                            <td className="p-3 md:p-4 text-xs font-mono text-slate-400">{user.id}</td>
                            <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm md:text-base">{user.username || '-'}</td>
                            <td className="p-3 md:p-4 text-slate-600 text-sm md:text-base">{user.email}</td>
                            <td className="p-3 md:p-4 text-right">
                              <button onClick={() => handleDelete('users', user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Pengguna">
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-8 text-center text-slate-500">Tidak ada data pengguna.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: ANGGOTA SILSILAH */}
              {activeTab === 'members' && (
                <div className="animate-in fade-in duration-300 w-full">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Kelola Anggota Silsilah</h2>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3 md:p-4 font-semibold">Nama Anggota</th>
                          <th className="p-3 md:p-4 font-semibold">Jenis Kelamin</th>
                          <th className="p-3 md:p-4 font-semibold">Status Hidup</th>
                          <th className="p-3 md:p-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {members.length > 0 ? members.map(mem => (
                          <tr key={mem.id} className="hover:bg-slate-50/50">
                            <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm md:text-base">
                              {mem.name || mem.fullName || 'Tanpa Nama'}
                            </td>
                            <td className="p-3 md:p-4 text-slate-600 text-xs md:text-sm">{mem.gender === 'female' || mem.gender === 'Female' ? 'Perempuan' : 'Laki-Laki'}</td>
                            <td className="p-3 md:p-4 text-slate-600 text-xs md:text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${mem.lifeStatus === 'Deceased' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                {mem.lifeStatus === 'Deceased' ? 'Meninggal' : 'Hidup'}
                              </span>
                            </td>
                            <td className="p-3 md:p-4 text-right">
                              <button onClick={() => handleDelete('members', mem.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Anggota">
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-8 text-center text-slate-500">Tidak ada data anggota.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: RIWAYAT (MILESTONES) */}
              {activeTab === 'milestones' && (
                <div className="animate-in fade-in duration-300 w-full">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Kelola Riwayat Keluarga</h2>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3 md:p-4 font-semibold">Tag/Tahun</th>
                          <th className="p-3 md:p-4 font-semibold">Judul Peristiwa</th>
                          <th className="p-3 md:p-4 font-semibold">Lokasi</th>
                          <th className="p-3 md:p-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {milestones.length > 0 ? milestones.map(ms => (
                          <tr key={ms.id} className="hover:bg-slate-50/50">
                            <td className="p-3 md:p-4 text-xs md:text-sm font-bold text-emerald-600">{ms.tag}</td>
                            <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm md:text-base">{ms.title}</td>
                            <td className="p-3 md:p-4 text-slate-600 text-xs md:text-sm">{ms.location}</td>
                            <td className="p-3 md:p-4 text-right">
                              <button onClick={() => handleDelete('milestones', ms.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Riwayat">
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-8 text-center text-slate-500">Tidak ada data riwayat.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: GALERI */}
              {activeTab === 'gallery' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Kelola Galeri Foto</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                    {galleries.length > 0 ? galleries.map(photo => (
                      <div key={photo.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
                        <div className="h-32 md:h-40 overflow-hidden bg-slate-100">
                          <img src={photo.image} alt={photo.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 md:p-4">
                          <span className="text-[9px] md:text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{photo.category}</span>
                          <h3 className="font-bold text-slate-800 text-xs md:text-sm mt-2 line-clamp-2 leading-snug">{photo.title}</h3>
                        </div>
                        <button 
                          onClick={() => handleDelete('gallery', photo.id)}
                          className="absolute top-2 right-2 w-7 h-7 md:w-8 md:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Hapus Foto"
                        >
                          <span className="material-symbols-outlined text-[16px] md:text-sm">delete</span>
                        </button>
                      </div>
                    )) : (
                      <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">Tidak ada foto di galeri.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}