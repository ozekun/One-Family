import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; 
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

export default function Home() {
  // State untuk menyimpan data riwayat (dari database) dan status loading
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk kontrol Modal Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [pendingAction, setPendingAction] = useState(""); // "edit" atau "add"

  // State untuk Modal Edit & Tambah
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  
  // State form untuk data baru
  const [newMilestone, setNewMilestone] = useState({
    tag: "",
    title: "",
    description: "",
    location: "",
    icon: "history",
    image: ""
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Ambil data riwayat dari Firestore saat komponen dimuat
  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "milestones"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Urutkan berdasarkan tag
      data.sort((a, b) => (a.tag > b.tag ? 1 : -1));
      
      setMilestones(data);
    } catch (error) {
      console.error("Gagal memuat data riwayat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Kompresi Foto Lokal (Otomatis mengecilkan ukuran)
  const handleImageChange = (e, isEdit) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const MAX_SIZE = 1000; // Maksimal lebar/tinggi 1000px
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        if (isEdit) {
          setSelectedMilestone({ ...selectedMilestone, image: compressedBase64 });
        } else {
          setNewMilestone({ ...newMilestone, image: compressedBase64 });
        }
      };
    };
  };

  // AKSI KLIK TOMBOL TAMBAH (Tampilkan Modal Password)
  const handleAddClick = () => {
    setPendingAction("add");
    setNewMilestone({
      tag: "",
      title: "",
      description: "",
      location: "",
      icon: "history",
      image: ""
    });
    setPasswordInput("");
    setPasswordError(false);
    setShowPasswordModal(true);
  };

  // AKSI KLIK TOMBOL EDIT (Tampilkan Modal Password)
  const handleEditClick = (milestone) => {
    setPendingAction("edit");
    setSelectedMilestone(milestone);
    setPasswordInput("");
    setPasswordError(false);
    setShowPasswordModal(true);
  };

  // Verifikasi password "lelemuku56"
  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === "lelemuku56") {
      setShowPasswordModal(false);
      
      if (pendingAction === "edit") {
        setShowEditModal(true);
      } else if (pendingAction === "add") {
        setShowAddModal(true);
      }
    } else {
      setPasswordError(true);
    }
  };

  // Simpan data BARU ke Firebase
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const alignLeft = milestones.length % 2 === 0;

      const dataToSave = {
        ...newMilestone,
        alignLeft: alignLeft
      };

      const docRef = await addDoc(collection(db, "milestones"), dataToSave);
      
      const updatedMilestones = [...milestones, { id: docRef.id, ...dataToSave }];
      updatedMilestones.sort((a, b) => (a.tag > b.tag ? 1 : -1));
      setMilestones(updatedMilestones);
      
      setShowAddModal(false);
      setSuccessMessage("Riwayat baru berhasil ditambahkan ke database!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Gagal menambah data:", error);
      alert("Terjadi kesalahan saat menyimpan data ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Simpan perubahan data EDIT ke Firebase
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    try {
      setIsSaving(true);
      
      const milestoneRef = doc(db, "milestones", selectedMilestone.id);
      
      await updateDoc(milestoneRef, {
        tag: selectedMilestone.tag,
        title: selectedMilestone.title,
        description: selectedMilestone.description,
        location: selectedMilestone.location,
        image: selectedMilestone.image // Memperbarui gambar di database
      });

      setMilestones(milestones.map(m => m.id === selectedMilestone.id ? selectedMilestone : m));
      
      setShowEditModal(false);
      setSuccessMessage("Perubahan riwayat berhasil disimpan ke database!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Gagal menyimpan perubahan:", error);
      alert("Terjadi kesalahan saat menyimpan data ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#f9f9ff] text-[#111c2d] font-sans w-full min-h-full">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative">
        
        {/* Notifikasi Sukses */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <span className="material-symbols-outlined">check_circle</span>
            {successMessage}
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#111c2d] mb-2 md:mb-4 tracking-tight">Perjalanan Awal</h1>
          <p className="text-sm md:text-lg text-[#40493d] max-w-2xl mx-auto leading-relaxed">
            Sejarah garis keturunan keluarga.
          </p>
        </section>

        {/* Timeline Container */}
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#0d631b]/20 hidden md:block"></div>
          
          {loading ? (
            <div className="text-center py-20 text-gray-500 font-medium">Memuat riwayat dari Firebase...</div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-medium">Belum ada data riwayat keluarga di database.</div>
          ) : (
            <div className="space-y-6 md:space-y-16 relative">
              {milestones.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-0">
                  
                  {/* Bagian Kartu Teks */}
                  <div className={`w-full md:w-[45%] ${item.alignLeft ? 'order-2 md:order-1' : 'order-2 md:order-3'}`}>
                    <div className="bg-white/95 backdrop-blur-md p-5 md:p-8 rounded-2xl shadow-sm border border-gray-200/60 relative group">
                      
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 bg-gray-100 hover:bg-[#0d631b] hover:text-white text-gray-600 rounded-xl transition-all shadow-xs flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Edit Riwayat"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <div className="mb-2 md:mb-3">
                        <span className="bg-[#91f78e]/30 text-[#00731e] px-3 py-1 rounded-full text-xs font-bold">{item.tag}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-[#111c2d] mb-2 md:mb-3 pr-12 md:pr-16">{item.title}</h3>
                      <p className="text-xs md:text-sm text-[#40493d] mb-3 md:mb-4 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-2 text-[#0d631b] font-semibold text-xs md:text-sm">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        <span>{item.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Titik Ikon Tengah */}
                  <div className="relative hidden md:flex items-center justify-center w-12 h-12 bg-[#0d631b] rounded-full z-10 border-4 border-[#f9f9ff] shadow-md order-1 md:order-2">
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon || 'history'}</span>
                  </div>

                  {/* Bagian Gambar (Disembunyikan di HP / Tampil di Desktop) */}
                  <div className={`hidden md:block w-full md:w-[45%] ${item.alignLeft ? 'order-3' : 'order-1'}`}>
                    <div className="w-full h-56 rounded-2xl overflow-hidden shadow-sm border border-gray-200/60">
                      <img 
                        className="w-full h-full object-cover" 
                        src={item.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                        alt={item.title}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 md:mt-20 p-6 md:p-10 bg-[#2e7d32] text-white rounded-3xl text-center shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">Punya Cerita untuk Dibagikan?</h2>
          <p className="text-xs md:text-base mb-6 md:mb-8 max-w-xl mx-auto opacity-90 leading-relaxed">
            Setiap generasi menambahkan babak baru. Kontribusikan catatan, foto, dan kenangan Anda untuk membantu menumbuhkan sejarah kolektif kita.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={handleAddClick} 
              className="w-full sm:w-auto bg-white text-[#0d631b] px-6 md:px-8 py-3.5 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs md:text-sm"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Tambah Riwayat
            </button>
          </div>
        </div>
      </main>

      {/* MODAL PASSWORD SECURITY */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-[#0d631b]/10 text-[#0d631b] flex items-center justify-center mb-4 shadow-inner">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Verifikasi Akses
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Masukkan password khusus untuk mendapatkan izin modifikasi data riwayat keluarga.
            </p>

            <form onSubmit={handleVerifyPassword} className="w-full flex flex-col gap-3">
              <input 
                type="password"
                placeholder="Masukkan password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b] focus:ring-1 focus:ring-[#0d631b]/20 transition-all text-slate-800"
                autoFocus
              />

              {passwordError && (
                <p className="text-xs text-red-600 font-semibold text-left">
                  Password salah! Silakan coba lagi.
                </p>
              )}

              <div className="flex gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-[#0d631b]/20 cursor-pointer"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH MILESTONE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
              Tambah Riwayat Baru
            </h3>

            <form onSubmit={handleSaveAdd} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tahun & Kategori (Tag)</label>
                <input 
                  type="text"
                  placeholder="Contoh: 2025 - REUNI KELUARGA"
                  value={newMilestone.tag}
                  onChange={(e) => setNewMilestone({...newMilestone, tag: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Judul Peristiwa</label>
                <input 
                  type="text"
                  placeholder="Masukkan judul riwayat..."
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Deskripsi Narasi</label>
                <textarea 
                  rows="4"
                  placeholder="Ceritakan detail peristiwa tersebut..."
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lokasi</label>
                <input 
                  type="text"
                  placeholder="Contoh: Jakarta, Indonesia"
                  value={newMilestone.location}
                  onChange={(e) => setNewMilestone({...newMilestone, location: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Unggah Foto (Otomatis Dikompresi)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, false)}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0d631b] file:text-white hover:file:bg-[#094813] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ikon (Material Symbol)</label>
                <input 
                  type="text"
                  placeholder="Contoh: public, history, event, group"
                  value={newMilestone.icon}
                  onChange={(e) => setNewMilestone({...newMilestone, icon: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-[#0d631b]/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Tambah Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM EDIT MILESTONE */}
      {showEditModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
              Edit Riwayat Keluarga
            </h3>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tahun & Kategori (Tag)</label>
                <input 
                  type="text"
                  value={selectedMilestone.tag || ""}
                  onChange={(e) => setSelectedMilestone({...selectedMilestone, tag: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Judul Peristiwa</label>
                <input 
                  type="text"
                  value={selectedMilestone.title || ""}
                  onChange={(e) => setSelectedMilestone({...selectedMilestone, title: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Deskripsi Narasi</label>
                <textarea 
                  rows="4"
                  value={selectedMilestone.description || ""}
                  onChange={(e) => setSelectedMilestone({...selectedMilestone, description: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lokasi</label>
                <input 
                  type="text"
                  value={selectedMilestone.location || ""}
                  onChange={(e) => setSelectedMilestone({...selectedMilestone, location: e.target.value})}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ganti Foto (Opsional)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, true)}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0d631b] file:text-white hover:file:bg-[#094813] cursor-pointer"
                />
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-[#0d631b]/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#d8e3fb]/40 border-t border-gray-200 mt-12 md:mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-12 max-w-7xl mx-auto w-full">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <div className="text-lg font-bold text-[#0d631b] mb-1">AncestryFlow</div>
            <p className="text-xs md:text-sm text-[#40493d]">© 2026 AncestryFlow. Menjaga warisan untuk generasi mendatang.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Kebijakan Privasi</a>
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Ketentuan Layanan</a>
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Hubungi Kami</a>
          </div>
        </div>
      </footer>
    </div>
  );
}