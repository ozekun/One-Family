import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; 
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  arrayUnion, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// ==========================================
// KOMPONEN ZOOM & PAN INTERAKTIF
// ==========================================
const ZoomPanImage = ({ src, alt, isFullscreen, onNext, onPrev }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const [startDist, setStartDist] = useState(0);
  const [startScale, setStartScale] = useState(1);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src, isFullscreen]);

  const onMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const onMouseUp = () => {
    setIsDragging(false);
    if (scale === 1) setPosition({ x: 0, y: 0 }); 
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setStartDist(dist);
      setStartScale(scale);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(startScale * (dist / startDist), 1), 4);
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - startPos.x,
        y: e.touches[0].clientY - startPos.y
      });
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (scale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5); 
    }
  };

  const onWheel = (e) => {
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(scale + delta, 1), 4);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className={`transition-all duration-300 touch-none group overflow-hidden flex items-center justify-center shadow-inner border-white/10 ${
        isFullscreen 
          ? 'fixed inset-0 z-[100] w-full h-full bg-black rounded-none border-none' 
          : 'relative w-full h-[45vh] md:h-[60vh] bg-black/50 border rounded-2xl'
      }`}
      onWheel={onWheel}
    >
      {isFullscreen && onPrev && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-[110] text-white/50 hover:text-white transition-all cursor-pointer p-2 bg-black/30 hover:bg-black/70 rounded-full">
          <span className="material-symbols-outlined text-[32px] md:text-[48px]">chevron_left</span>
        </button>
      )}
      {isFullscreen && onNext && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-[110] text-white/50 hover:text-white transition-all cursor-pointer p-2 bg-black/30 hover:bg-black/70 rounded-full">
          <span className="material-symbols-outlined text-[32px] md:text-[48px]">chevron_right</span>
        </button>
      )}

      <div className="absolute bottom-4 right-4 z-[110] flex gap-1 bg-black/70 p-1.5 rounded-xl backdrop-blur-md shadow-lg border border-white/20">
        <button onClick={(e) => { e.stopPropagation(); setScale(p => Math.max(p - 0.5, 1)); if(scale-0.5<=1) setPosition({x:0, y:0});}} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg cursor-pointer">
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({x:0, y:0})}} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg cursor-pointer" title="Reset">
          <span className="material-symbols-outlined text-sm">fit_screen</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setScale(p => Math.min(p + 0.5, 4)); }} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg cursor-pointer">
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>

      <img 
        src={src} 
        alt={alt}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={handleDoubleClick}
        draggable="false"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in')
        }}
        className="max-w-full max-h-full object-contain pointer-events-auto select-none"
      />
    </div>
  );
};

// ==========================================
// KOMPONEN UTAMA GALERI
// ==========================================
export default function Gallery() {
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("Semua");
  const [visibleLimit, setVisibleLimit] = useState(10); 

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false); 
  const [noteInput, setNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // State Manajemen Password Universal (Untuk Upload, Edit/Tambah Catatan, dan Hapus)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'upload', 'addNote', atau 'delete'

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Reuni");
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const categories = ["Semua", "Reuni", "Pernikahan", "Ulang Tahun", "Liburan", "Leluhur"];

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const photosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (photosData.length === 0) {
        const initialPhotos = [
          {
            category: "Reuni",
            tag: "Reuni 2023",
            title: "Kumpul Keluarga Besar",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4z2_3tIH-59-8W4us5AUvuqnxKNwnd-ZcQFMlmNyGOdB70WCLWL0I61mmhyWACY5D1SFVVXaqzyxq6qGQRIGYO8ELu4pl2td1uH4-CsDqFdsjMWG2MhDdYD7B9Hu6zIFOFShwz9s7zOh5fB9u1lodjkgd29t9FCqYOqOW3Iqhqk8MziBpvOtDwqgC_lugwdHDUHo7BTXV9V-c810C1Qp-LqhtXp7DA_sWw4CRQYKh-FM6YP_GZwB_QA",
            notes: [],
            createdAt: serverTimestamp()
          }
        ];
        for (let p of initialPhotos) {
          await addDoc(collection(db, "gallery"), p);
        }
        fetchPhotos();
        return;
      }

      setAllPhotos(photosData);
    } catch (error) {
      console.error("Gagal memuat galeri:", error);
      triggerToast("Gagal memuat data dari database.");
    } finally {
      setLoading(false);
    }
  };

  const filteredByCategory = activeCategory === "Semua" 
    ? allPhotos 
    : allPhotos.filter(p => p.category === activeCategory);

  const displayedPhotos = filteredByCategory.slice(0, visibleLimit);

  const handlePrevPhoto = () => {
    const currentIndex = filteredByCategory.findIndex(p => p.id === activePhoto.id);
    const prevIndex = (currentIndex - 1 + filteredByCategory.length) % filteredByCategory.length;
    setActivePhoto(filteredByCategory[prevIndex]);
    setIsAddingNote(false);
    setIsFullscreen(false); 
  };

  const handleNextPhoto = () => {
    const currentIndex = filteredByCategory.findIndex(p => p.id === activePhoto.id);
    const nextIndex = (currentIndex + 1) % filteredByCategory.length;
    setActivePhoto(filteredByCategory[nextIndex]);
    setIsAddingNote(false);
    setIsFullscreen(false); 
  };

  // Handler Keamanan Password Universal
  const requestPassword = (actionType) => {
    setPendingAction(actionType);
    setPasswordInput("");
    setPasswordError(false);
    setShowPasswordModal(true);
  };

  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === "lelemuku56") {
      setShowPasswordModal(false);
      triggerToast("Password benar! Akses diizinkan.");
      
      if (pendingAction === 'upload') {
        setShowUploadModal(true);
      } else if (pendingAction === 'addNote') {
        setIsAddingNote(true);
      } else if (pendingAction === 'delete') {
        executeDeletePhoto();
      }
    } else {
      setPasswordError(true);
    }
  };

  const handleAddPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle || !newImageFile) return;

    try {
      setUploading(true);

      const reader = new FileReader();
      reader.readAsDataURL(newImageFile);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = async () => {
          const MAX_SIZE = 1000;
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

          const newPhoto = {
            category: newCategory,
            tag: `Arsip ${newCategory}`,
            title: newTitle,
            image: compressedBase64,
            notes: [],
            createdAt: serverTimestamp()
          };

          const docRef = await addDoc(collection(db, "gallery"), newPhoto);
          setAllPhotos([{ id: docRef.id, ...newPhoto }, ...allPhotos]);
          
          setShowUploadModal(false);
          setNewTitle("");
          setNewImageFile(null);
          setUploading(false);
          triggerToast("Foto berhasil dikompresi dan diunggah!");
        };
      };
    } catch (error) {
      console.error("Gagal mengunggah foto:", error);
      triggerToast("Terjadi kesalahan saat menyimpan foto.");
      setUploading(false);
    }
  };

  const executeDeletePhoto = async () => {
    if (!activePhoto) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus foto ini dari database?")) {
      try {
        await deleteDoc(doc(db, "gallery", activePhoto.id));
        setAllPhotos(allPhotos.filter(p => p.id !== activePhoto.id));
        setLightboxOpen(false);
        setActivePhoto(null);
        triggerToast("Foto berhasil dihapus dari database!");
      } catch (error) {
        console.error("Gagal menghapus foto:", error);
        triggerToast("Gagal menghapus foto.");
      }
    }
  };

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || !activePhoto) return;

    try {
      const photoRef = doc(db, "gallery", activePhoto.id);
      await updateDoc(photoRef, {
        notes: arrayUnion(noteInput)
      });

      const updatedNotes = [...(activePhoto.notes || []), noteInput];
      setActivePhoto({ ...activePhoto, notes: updatedNotes });
      setAllPhotos(allPhotos.map(p => p.id === activePhoto.id ? { ...p, notes: updatedNotes } : p));

      setNoteInput("");
      setIsAddingNote(false);
      triggerToast("Catatan berhasil disimpan ke database!");
    } catch (error) {
      console.error("Gagal menambah catatan:", error);
      triggerToast("Gagal menyimpan catatan.");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast("Tautan foto berhasil disalin ke clipboard!");
  };

  const handleSave = () => {
    if (!activePhoto) return;
    const a = document.createElement('a');
    a.href = activePhoto.image;
    a.download = `AncestryFlow-${activePhoto.id}.jpg`;
    a.target = '_blank';
    a.click();
    triggerToast("Mengunduh foto ke perangkat Anda...");
  };

  return (
    <div className="bg-[#f9f9ff] text-[#111c2d] min-h-full font-sans relative">
      
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[70] bg-[#0d631b] text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {toastMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#111c2d] mb-2 md:mb-3 tracking-tight">Warisan Visual</h1>
            <p className="text-sm md:text-lg text-[#40493d] max-w-2xl leading-relaxed">
              Koleksi momen pilihan yang mendefinisikan cerita keluarga kita, dari arsip bersejarah hingga perayaan terbaru.
            </p>
          </div>
          <div>
            <button 
              onClick={() => requestPassword('upload')}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#0d631b] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#0a4d15] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_a_photo</span>
              Unggah Foto
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-200 pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setVisibleLimit(10);
              }}
              className={`whitespace-nowrap px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#0d631b] text-white font-bold shadow-sm'
                  : 'bg-white border border-gray-200 text-[#40493d] hover:bg-[#f0f3ff]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">Memuat galeri dari Firebase...</div>
        ) : displayedPhotos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 text-gray-500 font-medium">
            Belum ada foto dalam kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {displayedPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-md flex flex-col"
                onClick={() => {
                  setActivePhoto(photo);
                  setIsAddingNote(false);
                  setIsFullscreen(false);
                  setLightboxOpen(true);
                }}
              >
                <div className="h-32 md:h-48 w-full overflow-hidden bg-gray-100 relative shrink-0">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src={photo.image} 
                    alt={photo.title}
                  />
                </div>
                
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <span className="text-[9px] md:text-[10px] font-bold text-[#0d631b] bg-[#0d631b]/10 px-2 py-1 rounded w-fit uppercase tracking-wider mb-1.5">
                    {photo.tag || photo.category}
                  </span>
                  <h3 className="text-slate-800 text-xs md:text-sm font-bold line-clamp-2 leading-snug">
                    {photo.title}
                  </h3>
                  
                  {photo.notes?.length > 0 && (
                    <div className="mt-2 text-[10px] md:text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px]">notes</span> 
                      {photo.notes.length} Catatan
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {visibleLimit < filteredByCategory.length && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setVisibleLimit(prev => prev + 10)}
              className="bg-white text-[#0d631b] border border-[#0d631b]/30 px-8 py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-[#0d631b] hover:text-white transition-all duration-300 cursor-pointer shadow-sm w-full md:w-auto"
            >
              Muat Lebih Banyak Kenangan
            </button>
          </div>
        )}
      </main>

      <footer className="bg-[#d8e3fb]/40 border-t border-gray-200 mt-12 md:mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-12 max-w-7xl mx-auto w-full gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-[#0d631b] text-2xl">forest</span>
              <span className="text-lg font-bold text-[#0d631b]">AncestryFlow</span>
            </div>
            <p className="text-xs md:text-sm text-[#40493d]">© 2026 AncestryFlow. Menjaga warisan untuk generasi mendatang.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Peta Situs</a>
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Kebijakan Privasi</a>
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Ketentuan Layanan</a>
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Hubungi Kami</a>
            <a className="text-xs md:text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Akses Arsip</a>
          </div>
        </div>
      </footer>

      {/* MODAL PASSWORD UNIVERSAL (UNTUK UPLOAD, TAMBAH CATATAN, DAN HAPUS) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-[#0d631b]/10 text-[#0d631b] flex items-center justify-center mb-4 shadow-inner">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Verifikasi Password</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Masukkan password (lelemuku56) untuk melanjutkan proses {pendingAction === 'upload' ? 'unggah foto' : pendingAction === 'addNote' ? 'penambahan catatan' : 'penghapusan foto'}.
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
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-600 font-semibold text-left">Password salah! Silakan coba lagi.</p>
              )}
              <div className="flex gap-3 w-full mt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md cursor-pointer">Konfirmasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM UPLOAD FILE LOKAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col text-left animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Unggah Foto</h3>
            <form onSubmit={handleAddPhotoSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Judul Foto / Momen</label>
                <input 
                  type="text"
                  placeholder="Contoh: Reuni Keluarga Besar 2025"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d631b]"
                >
                  <option value="Reuni">Reuni</option>
                  <option value="Pernikahan">Pernikahan</option>
                  <option value="Ulang Tahun">Ulang Tahun</option>
                  <option value="Liburan">Liburan</option>
                  <option value="Leluhur">Leluhur</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Berkas Gambar (.jpg, .png)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files[0])}
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0d631b] file:text-white hover:file:bg-[#094813] cursor-pointer"
                  required
                />
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={uploading} className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md cursor-pointer disabled:opacity-50">
                  {uploading ? "Mengunggah..." : "Unggah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxOpen && activePhoto && (
        <div className={`fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-200 ${isFullscreen ? 'overflow-hidden p-0' : 'overflow-y-auto'}`}>
          
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] flex flex-col items-end gap-2">
            <button 
              onClick={() => {setLightboxOpen(false); setIsFullscreen(false);}} 
              className="w-10 h-10 md:w-12 md:h-12 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 cursor-pointer transition-transform active:scale-95"
              title="Tutup"
            >
              <span className="material-symbols-outlined text-2xl md:text-3xl">close</span>
            </button>

            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="flex items-center gap-1.5 bg-black/80 hover:bg-black text-white px-3.5 py-2 rounded-xl backdrop-blur-md text-xs font-bold border border-white/20 shadow-xl cursor-pointer transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-base">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
              <span>{isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>

          {!isFullscreen && (
            <>
              <button onClick={handlePrevPhoto} className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all cursor-pointer p-2 z-10">
                <span className="material-symbols-outlined text-[48px]">chevron_left</span>
              </button>

              <button onClick={handleNextPhoto} className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all cursor-pointer p-2 z-10">
                <span className="material-symbols-outlined text-[48px]">chevron_right</span>
              </button>
            </>
          )}

          <div className={`relative max-w-4xl w-full flex flex-col items-center gap-4 md:gap-6 my-auto ${!isFullscreen ? 'pt-10 md:pt-0' : 'p-0 m-0'}`}>
            
            <ZoomPanImage 
              src={activePhoto.image} 
              alt={activePhoto.title} 
              isFullscreen={isFullscreen}
              onNext={handleNextPhoto}
              onPrev={handlePrevPhoto}
            />
            
            {!isFullscreen && (
              <>
                <div className="text-center text-white px-4 w-full">
                  <h2 className="text-xl md:text-2xl font-bold mb-1 line-clamp-2">{activePhoto.title}</h2>
                  <p className="text-xs md:text-sm text-white/60">{activePhoto.tag} — Koleksi Arsip</p>
                </div>

                <div className="flex md:hidden gap-8 my-2">
                  <button onClick={handlePrevPhoto} className="text-white/70 hover:text-white p-2 border border-white/20 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
                  <button onClick={handleNextPhoto} className="text-white/70 hover:text-white p-2 border border-white/20 rounded-full"><span className="material-symbols-outlined">arrow_forward</span></button>
                </div>

                {activePhoto.notes?.length > 0 && (
                  <div className="w-full max-w-md bg-white/10 rounded-xl p-4 text-left text-white backdrop-blur-sm mx-4">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 text-white/70">Catatan Kenangan (Firebase):</p>
                    <ul className="space-y-1.5 text-xs md:text-sm">
                      {activePhoto.notes.map((note, idx) => (
                        <li key={idx} className="bg-white/5 px-3 py-2 rounded-lg border border-white/10 leading-relaxed">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isAddingNote ? (
                  <form onSubmit={handleAddNoteSubmit} className="w-full max-w-md flex flex-col gap-2 px-4">
                    <input 
                      type="text"
                      placeholder="Tulis catatan atau kenangan..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-xl focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-[#0d631b] text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer">Simpan</button>
                      <button type="button" onClick={() => setIsAddingNote(false)} className="px-5 bg-white/20 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer">Batal</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-2 px-4 w-full">
                    <button onClick={handleShare} className="flex-1 sm:flex-none justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl md:rounded-full flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold">
                      <span className="material-symbols-outlined text-sm md:text-base">share</span> Bagikan
                    </button>
                    <button onClick={handleSave} className="flex-1 sm:flex-none justify-center bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl md:rounded-full flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold">
                      <span className="material-symbols-outlined text-sm md:text-base">download</span> Simpan
                    </button>
                    {/* Tombol Tambah Catatan Diproteksi Password */}
                    <button onClick={() => requestPassword('addNote')} className="w-full sm:w-auto justify-center bg-[#0d631b] hover:bg-[#094813] text-white px-5 py-2.5 rounded-xl md:rounded-full flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold shadow-md mt-2 md:mt-0">
                      <span className="material-symbols-outlined text-sm md:text-base">edit</span> Tambah Catatan
                    </button>
                    {/* Tombol Hapus Diproteksi Password */}
                    <button onClick={() => requestPassword('delete')} className="w-full sm:w-auto justify-center bg-red-600/80 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl md:rounded-full flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold shadow-md mt-2 md:mt-0">
                      <span className="material-symbols-outlined text-sm md:text-base">delete</span> Hapus
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}