import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Filter & Pencarian
  const [searchName, setSearchName] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("All");
  const [selectedLetter, setSelectedLetter] = useState("All");

  // State untuk Detail Profil Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // State untuk Autorisasi Password (lelemuku56)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // State untuk Modal Add/Edit Member (Form Komprehensif)
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(1);
  const [saving, setSaving] = useState(false);

  // State untuk Interactive Photo Cropper
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(50); // persentase 0-100
  const [offsetY, setOffsetY] = useState(50); // persentase 0-100
  const canvasRef = useRef(null);

  // Form State (Ditambahkan field generation agar terhubung ke Family Tree)
  const [formData, setFormData] = useState({
    profilePhoto: "",
    fullName: "",
    nickname: "",
    generation: "1st Generation",
    gender: "Male",
    placeOfBirth: "",
    dateOfBirth: "",
    lifeStatus: "Alive",
    dateOfDeath: "",
    father: "",
    mother: "",
    spouse: "",
    maritalStatus: "Single",
    birthOrder: 1,
    latestEducation: "Bachelor Degree",
    occupation: "",
    bloodType: "Unknown",
    religion: "Islam",
    country: "Indonesia",
    province: "",
    city: "",
    district: "",
    fullAddress: "",
    postalCode: "",
    phoneNumber: "",
    whatsappNumber: "",
    email: "",
    instagram: "",
    facebook: "",
    shortBiography: "",
    familyNotes: "",
    achievements: "",
    additionalPhotos: []
  });

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "members"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMembers(membersData);
    } catch (error) {
      console.error("Gagal memuat anggota:", error);
      triggerToast("Gagal memuat: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk format tanggal agar user-friendly (contoh: 29 Juli 2026)
  const formatDateFriendly = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
      const day = parseInt(parts[2], 10);
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  };

  const filteredMembers = members.filter(member => {
    const fullName = member.fullName || member.name || "";
    const matchesName = fullName.toLowerCase().includes(searchName.toLowerCase());
    const matchesGen = selectedGeneration === "All" || member.generation === selectedGeneration;
    
    const firstLetter = fullName.trim().charAt(0).toUpperCase();
    const matchesLetter = selectedLetter === "All" || firstLetter === selectedLetter;

    return matchesName && matchesGen && matchesLetter;
  }).sort((a, b) => {
    const nameA = a.fullName || a.name || "";
    const nameB = b.fullName || b.name || "";
    return nameA.localeCompare(nameB);
  });

  const handleCardClick = (member) => {
    setSelectedMember(member);
    setShowProfileModal(true);
  };

  const handleProtectedAction = (action) => {
    setPendingAction(action);
    setPasswordInput("");
    setPasswordError(false);
    setShowPasswordModal(true);
  };

  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === "lelemuku56") {
      setShowPasswordModal(false);
      executeAction(pendingAction);
      triggerToast("Password benar! Akses diizinkan.");
    } else {
      setPasswordError(true);
    }
  };

  const executeAction = (action) => {
    setShowProfileModal(false);
    if (action === 'add') {
      setIsEditMode(false);
      setEditMemberId(null);
      setFormData({
        profilePhoto: "",
        fullName: "",
        nickname: "",
        generation: "1st Generation",
        gender: "Male",
        placeOfBirth: "",
        dateOfBirth: "",
        lifeStatus: "Alive",
        dateOfDeath: "",
        father: "",
        mother: "",
        spouse: "",
        maritalStatus: "Single",
        birthOrder: 1,
        latestEducation: "Bachelor Degree",
        occupation: "",
        bloodType: "Unknown",
        religion: "Islam",
        country: "Indonesia",
        province: "",
        city: "",
        district: "",
        fullAddress: "",
        postalCode: "",
        phoneNumber: "",
        whatsappNumber: "",
        email: "",
        instagram: "",
        facebook: "",
        shortBiography: "",
        familyNotes: "",
        achievements: "",
        additionalPhotos: []
      });
      setShowAddModal(true);
    } else if (action === 'edit') {
      setIsEditMode(true);
      setEditMemberId(selectedMember.id);
      setFormData({
        profilePhoto: selectedMember.profilePhoto || selectedMember.image || "",
        fullName: selectedMember.fullName || selectedMember.name || "",
        nickname: selectedMember.nickname === "-" ? "" : (selectedMember.nickname || ""),
        generation: selectedMember.generation || "1st Generation",
        gender: selectedMember.gender || "Male",
        placeOfBirth: selectedMember.placeOfBirth === "-" ? "" : (selectedMember.placeOfBirth || ""),
        dateOfBirth: selectedMember.dateOfBirth === "-" ? "" : (selectedMember.dateOfBirth || ""),
        lifeStatus: selectedMember.lifeStatus || "Alive",
        dateOfDeath: selectedMember.dateOfDeath === "-" ? "" : (selectedMember.dateOfDeath || ""),
        father: selectedMember.father === "-" ? "" : (selectedMember.father || ""),
        mother: selectedMember.mother === "-" ? "" : (selectedMember.mother || ""),
        spouse: selectedMember.spouse === "-" ? "" : (selectedMember.spouse || ""),
        maritalStatus: selectedMember.maritalStatus || "Single",
        birthOrder: selectedMember.birthOrder === "-" ? 1 : (selectedMember.birthOrder || 1),
        latestEducation: selectedMember.latestEducation || "Bachelor Degree",
        occupation: selectedMember.occupation === "-" ? "" : (selectedMember.occupation || ""),
        bloodType: selectedMember.bloodType || "Unknown",
        religion: selectedMember.religion || "Islam",
        country: selectedMember.country || "Indonesia",
        province: selectedMember.province === "-" ? "" : (selectedMember.province || ""),
        city: selectedMember.city === "-" ? "" : (selectedMember.city || ""),
        district: selectedMember.district === "-" ? "" : (selectedMember.district || ""),
        fullAddress: selectedMember.fullAddress === "-" ? "" : (selectedMember.fullAddress || ""),
        postalCode: selectedMember.postalCode === "-" ? "" : (selectedMember.postalCode || ""),
        phoneNumber: selectedMember.phoneNumber === "-" ? "" : (selectedMember.phoneNumber || ""),
        whatsappNumber: selectedMember.whatsappNumber === "-" ? "" : (selectedMember.whatsappNumber || ""),
        email: selectedMember.email === "-" ? "" : (selectedMember.email || ""),
        instagram: selectedMember.instagram === "-" ? "" : (selectedMember.instagram || ""),
        facebook: selectedMember.facebook === "-" ? "" : (selectedMember.facebook || ""),
        shortBiography: selectedMember.shortBiography === "-" ? "" : (selectedMember.shortBiography || ""),
        familyNotes: selectedMember.familyNotes === "-" ? "" : (selectedMember.familyNotes || ""),
        achievements: selectedMember.achievements === "-" ? "" : (selectedMember.achievements || ""),
        additionalPhotos: selectedMember.additionalPhotos || []
      });
      setShowAddModal(true);
    } else if (action === 'delete') {
      handleDeleteMember();
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageSrc(reader.result);
        setZoom(1);
        setOffsetX(50);
        setOffsetY(50);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = rawImageSrc;
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 400;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const baseRatio = Math.max(hRatio, vRatio);
      const currentScale = baseRatio * zoom;

      const scaledW = img.width * currentScale;
      const scaledH = img.height * currentScale;

      const maxDx = scaledW - canvas.width;
      const maxDy = scaledH - canvas.height;

      const dx = - (maxDx * (offsetX / 100));
      const dy = - (maxDy * (offsetY / 100));

      ctx.drawImage(img, dx, dy, scaledW, scaledH);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormData(prev => ({ ...prev, profilePhoto: croppedDataUrl }));
      setShowCropModal(false);
      triggerToast("Foto berhasil dipotong dan disesuaikan!");
    };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName) {
      triggerToast("Nama lengkap wajib diisi!");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.fullName,
        fullName: formData.fullName,
        nickname: formData.nickname.trim() || "-",
        generation: formData.generation || "1st Generation",
        gender: formData.gender || "Male",
        placeOfBirth: formData.placeOfBirth.trim() || "-",
        dateOfBirth: formData.dateOfBirth || "-",
        lifeStatus: formData.lifeStatus || "Alive",
        dateOfDeath: formData.dateOfDeath || "-",
        father: formData.father || "-",
        mother: formData.mother || "-",
        spouse: formData.spouse || "-",
        maritalStatus: formData.maritalStatus || "Single",
        birthOrder: formData.birthOrder ? Number(formData.birthOrder) : "-",
        latestEducation: formData.latestEducation || "-",
        occupation: formData.occupation.trim() || "-",
        bloodType: formData.bloodType || "-",
        religion: formData.religion || "-",
        country: formData.country || "-",
        province: formData.province.trim() || "-",
        city: formData.city.trim() || "-",
        district: formData.district.trim() || "-",
        fullAddress: formData.fullAddress.trim() || "-",
        postalCode: formData.postalCode ? Number(formData.postalCode) : "-",
        phoneNumber: formData.phoneNumber.trim() || "-",
        whatsappNumber: formData.whatsappNumber.trim() || "-",
        email: formData.email.trim() || "-",
        instagram: formData.instagram.trim() || "-",
        facebook: formData.facebook.trim() || "-",
        shortBiography: formData.shortBiography.trim() || "-",
        familyNotes: formData.familyNotes.trim() || "-",
        achievements: formData.achievements.trim() || "-",
        location: `${formData.city || ''}, ${formData.province || ''}`.trim() ? `${formData.city || ''}, ${formData.province || ''}`.trim() : "-",
        image: formData.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      };

      if (isEditMode && editMemberId) {
        const memberRef = doc(db, "members", editMemberId);
        await updateDoc(memberRef, payload);
        setMembers(members.map(m => m.id === editMemberId ? { ...m, ...payload } : m));
        setShowAddModal(false);
        triggerToast("Profil anggota berhasil diperbarui!");
      } else {
        const newPayload = { ...payload, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, "members"), newPayload);
        setMembers([{ id: docRef.id, ...newPayload }, ...members]);
        setShowAddModal(false);
        triggerToast("Anggota keluarga baru berhasil disimpan ke database!");
      }
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      triggerToast("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedMember.fullName || selectedMember.name}?`)) {
      try {
        await deleteDoc(doc(db, "members", selectedMember.id));
        setMembers(members.filter(m => m.id !== selectedMember.id));
        triggerToast("Anggota berhasil dihapus.");
      } catch (error) {
        console.error("Gagal menghapus:", error);
        triggerToast("Error: " + error.message);
      }
    }
  };

  return (
    <div className="bg-[#f9f9ff] text-[#111c2d] min-h-full font-sans relative">
      
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[70] bg-[#0d631b] text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {toastMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#111c2d] mb-2 md:mb-3 tracking-tight">Anggota Keluarga</h1>
            <p className="text-sm md:text-lg text-[#40493d] max-w-2xl leading-relaxed">
              Daftar lengkap seluruh silsilah dan anggota keluarga besar dari berbagai generasi. Klik pada kartu untuk melihat detail profil.
            </p>
          </div>
          <div>
            <button 
              onClick={() => handleProtectedAction('add')}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#0d631b] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#0a4d15] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Tambah Anggota
            </button>
          </div>
        </div>

        {/* Filter & Search Bar Section */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200/60 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input 
              type="text"
              placeholder="Cari berdasarkan nama..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#f0f3ff]/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b] transition-all text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-auto">
              <select
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
                className="w-full md:w-auto px-5 py-3 bg-[#f0f3ff]/50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#0d631b] cursor-pointer"
              >
                <option value="All">Semua Generasi</option>
                <option value="1st Generation">Generasi 1</option>
                <option value="2nd Generation">Generasi 2</option>
                <option value="3rd Generation">Generasi 3</option>
                <option value="4th Generation">Generasi 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alphabet Filter Bar A - Z */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8 md:mb-10 bg-white p-3 rounded-2xl shadow-sm border border-gray-200/60 no-scrollbar">
          <button
            onClick={() => setSelectedLetter("All")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedLetter === "All" ? 'bg-[#0d631b] text-white shadow-sm' : 'bg-[#f0f3ff]/50 text-slate-700 hover:bg-gray-100'
            }`}
          >
            Semua
          </button>
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                selectedLetter === letter ? 'bg-[#0d631b] text-white shadow-sm' : 'bg-[#f0f3ff]/50 text-slate-700 hover:bg-gray-100'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Member Grid List (Dioptimalkan agar compact dan seragam seperti Galeri di HP) */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">Memuat data anggota dari Firebase...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-medium bg-white rounded-2xl border border-gray-200/60 shadow-xs">
            Tidak ada anggota keluarga yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {filteredMembers.map((member) => {
              const displayName = member.fullName || member.name || "-";
              const displayGen = member.generation || "-";
              const birthStr = formatDateFriendly(member.dateOfBirth || member.birthDate);
              const deathStr = formatDateFriendly(member.dateOfDeath);
              const isDeceased = member.lifeStatus === "Deceased";
              const displayLoc = member.location || "-";
              const displayImg = member.profilePhoto || member.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";

              return (
                <div 
                  key={member.id} 
                  onClick={() => handleCardClick(member)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-md flex flex-col"
                >
                  {/* Kotak Gambar Seragam (Compact seperti Galeri) */}
                  <div className="h-32 md:h-48 w-full overflow-hidden bg-gray-100 relative shrink-0">
                    <img 
                      src={displayImg} 
                      alt={displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info Text Bawah */}
                  <div className="p-3 md:p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[9px] md:text-[10px] font-bold text-[#0d631b] bg-[#0d631b]/10 px-2 py-1 rounded w-fit uppercase tracking-wider mb-1.5 inline-block">
                        {displayGen}
                      </span>
                      <h3 className="text-slate-800 text-xs md:text-sm font-bold line-clamp-2 leading-snug mb-1">
                        {displayName}
                      </h3>
                      <p className="text-[10px] md:text-xs text-slate-500 line-clamp-1">
                        {isDeceased ? `Wafat: ${birthStr}` : birthStr}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] md:text-xs text-slate-400">
                      <span className="truncate max-w-[100px]">{displayLoc}</span>
                      <span className="text-[#0d631b] font-semibold group-hover:underline">Detail</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 0. MODAL INTERACTIVE PHOTO CROPPER (SCROLLABLE) */}
      {showCropModal && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-slate-800">Sesuaikan & Potong Foto Kartu</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              <p className="text-xs text-slate-500 text-center">
                Geser posisi atau sesuaikan perbesaran (zoom) agar foto pas di dalam bingkai persegi panjang kartu anggota.
              </p>

              {/* Area Pratinjau Bingkai Kartu */}
              <div className="w-full h-56 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center border-2 border-dashed border-slate-300">
                <div 
                  className="w-full h-full bg-center bg-no-repeat transition-all duration-75"
                  style={{
                    backgroundImage: `url(${rawImageSrc})`,
                    backgroundSize: `${zoom * 100}%`,
                    backgroundPosition: `${offsetX}% ${offsetY}%`
                  }}
                />
              </div>

              {/* Controller Sliders */}
              <div className="w-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Perbesaran (Zoom)</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.05" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-[#0d631b] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Geser Horizontal (X)</span>
                    <span>{offsetX}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={offsetX} 
                    onChange={(e) => setOffsetX(parseInt(e.target.value))}
                    className="w-full accent-[#0d631b] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Geser Vertikal (Y)</span>
                    <span>{offsetY}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={offsetY} 
                    onChange={(e) => setOffsetY(parseInt(e.target.value))}
                    className="w-full accent-[#0d631b] cursor-pointer"
                  />
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button 
                onClick={() => setShowCropModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleApplyCrop}
                className="px-6 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Gunakan Foto Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. MODAL DETAIL PROFIL MEMBER */}
      {showProfileModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative animate-in zoom-in-95 duration-200">
             
            {/* Modal Header / Close Button */}
            <div className="px-6 py-4 flex justify-end shrink-0 border-b border-gray-100 bg-slate-50">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable Details) */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6 text-sm text-[#40493d]">
               
              {/* HEADER PROFIL */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-8 bg-white py-2">
                 
                <div className="relative shrink-0">
                  <img 
                    src={selectedMember.profilePhoto || selectedMember.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"} 
                    alt={selectedMember.fullName || selectedMember.name}
                    className="w-40 h-40 sm:w-44 sm:h-44 rounded-full object-cover shadow-md border-4 border-white"
                  />
                  <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#0d631b] text-white flex items-center justify-center shadow-md border-2 border-white">
                    <span className="material-symbols-outlined text-xl">verified</span>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-[#00731e] bg-[#91f78e]/30 px-3.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedMember.generation || "Patriarch"}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111c2d] mb-3 tracking-tight">
                    {selectedMember.fullName || selectedMember.name}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedMember.shortBiography && selectedMember.shortBiography !== "-" 
                      ? selectedMember.shortBiography 
                      : `Seorang anggota keluarga dari generasi ${selectedMember.generation || "terkait"} dengan silsilah terdaftar di dalam arsip keluarga.`}
                  </p>
                </div>
              </div>

              {/* SECTION 1: Basic Info */}
              <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
                <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
                  <span className="material-symbols-outlined text-base">badge</span> INFORMASI DASAR
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-400 block text-xs">Nama Panggilan</span> <span className="font-medium text-slate-800">{selectedMember.nickname || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Jenis Kelamin</span> <span className="font-medium text-slate-800">{selectedMember.gender || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Tempat Lahir</span> <span className="font-medium text-slate-800">{selectedMember.placeOfBirth || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Tanggal Lahir</span> <span className="font-medium text-slate-800">{formatDateFriendly(selectedMember.dateOfBirth)}</span></div>
                  <div><span className="text-gray-400 block text-xs">Status Hidup</span> <span className="font-medium text-slate-800">{selectedMember.lifeStatus === 'Deceased' ? 'Wafat' : 'Hidup'}</span></div>
                  {selectedMember.lifeStatus === 'Deceased' && (
                    <div><span className="text-gray-400 block text-xs">Tanggal Wafat</span> <span className="font-medium text-slate-800">{formatDateFriendly(selectedMember.dateOfDeath)}</span></div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Family Relationship */}
              <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
                <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
                  <span className="material-symbols-outlined text-base">family_history</span> HUBUNGAN KELUARGA
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-400 block text-xs">Ayah</span> <span className="font-medium text-slate-800">{selectedMember.father || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Ibu</span> <span className="font-medium text-slate-800">{selectedMember.mother || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Pasangan</span> <span className="font-medium text-slate-800">{selectedMember.spouse || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Status Pernikahan</span> <span className="font-medium text-slate-800">{selectedMember.maritalStatus || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Urutan Kelahiran</span> <span className="font-medium text-slate-800">{selectedMember.birthOrder || "-"}</span></div>
                </div>
              </div>

              {/* SECTION 3: Personal Information */}
              <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
                <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
                  <span className="material-symbols-outlined text-base">person</span> INFORMASI PERSONAL
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-400 block text-xs">Pendidikan Terakhir</span> <span className="font-medium text-slate-800">{selectedMember.latestEducation || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Pekerjaan</span> <span className="font-medium text-slate-800">{selectedMember.occupation || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Golongan Darah</span> <span className="font-medium text-slate-800">{selectedMember.bloodType || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Agama</span> <span className="font-medium text-slate-800">{selectedMember.religion || "-"}</span></div>
                </div>
              </div>

              {/* SECTION 4: Current Address */}
              <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
                <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
                  <span className="material-symbols-outlined text-base">location_on</span> ALAMAT SAAT INI
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-400 block text-xs">Negara</span> <span className="font-medium text-slate-800">{selectedMember.country || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Provinsi</span> <span className="font-medium text-slate-800">{selectedMember.province || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Kota / Kabupaten</span> <span className="font-medium text-slate-800">{selectedMember.city || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Kecamatan</span> <span className="font-medium text-slate-800">{selectedMember.district || "-"}</span></div>
                  <div className="col-span-2"><span className="text-gray-400 block text-xs">Alamat Lengkap</span> <span className="font-medium text-slate-800">{selectedMember.fullAddress || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Kode Pos</span> <span className="font-medium text-slate-800">{selectedMember.postalCode || "-"}</span></div>
                </div>
              </div>

              {/* SECTION 5: Contact Information */}
              <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
                <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
                  <span className="material-symbols-outlined text-base">contacts</span> INFORMASI KONTAK
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-400 block text-xs">Nomor Telepon</span> <span className="font-medium text-slate-800">{selectedMember.phoneNumber || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Nomor WhatsApp</span> <span className="font-medium text-slate-800">{selectedMember.whatsappNumber || "-"}</span></div>
                  <div className="col-span-2"><span className="text-gray-400 block text-xs">Alamat Email</span> <span className="font-medium text-slate-800">{selectedMember.email || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Instagram</span> <span className="font-medium text-slate-800">{selectedMember.instagram || "-"}</span></div>
                  <div><span className="text-gray-400 block text-xs">Facebook</span> <span className="font-medium text-slate-800">{selectedMember.facebook || "-"}</span></div>
                </div>
              </div>

              {/* SECTION 6: Additional Information */}
              <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
                <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
                  <span className="material-symbols-outlined text-base">info</span> INFORMASI TAMBAHAN
                </h4>
                <div className="space-y-3">
                  <div><span className="text-gray-400 block text-xs">Biografi Singkat</span> <p className="font-medium text-slate-800 mt-0.5">{selectedMember.shortBiography || "-"}</p></div>
                  <div><span className="text-gray-400 block text-xs">Catatan Keluarga</span> <p className="font-medium text-slate-800 mt-0.5">{selectedMember.familyNotes || "-"}</p></div>
                  <div><span className="text-gray-400 block text-xs">Pencapaian / Prestasi</span> <p className="font-medium text-slate-800 mt-0.5">{selectedMember.achievements || "-"}</p></div>
                </div>
              </div>

            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="px-8 py-4 border-t border-gray-200 bg-slate-50 flex gap-3 shrink-0">
              <button 
                onClick={() => handleProtectedAction('edit')}
                className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-[#0d631b]/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">edit</span> Edit Profil
              </button>
              <button 
                onClick={() => handleProtectedAction('delete')}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">delete</span> Hapus
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. MODAL PASSWORD SECURITY */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-[#0d631b]/10 text-[#0d631b] flex items-center justify-center mb-4 shadow-inner">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
             
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Verifikasi Akses
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Masukkan password (lelemuku56) untuk melanjutkan proses {pendingAction === 'add' ? 'penambahan anggota' : pendingAction === 'edit' ? 'penyuntingan' : 'penghapusan'}.
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
                <p className="text-xs text-red-600 font-semibold text-left">
                  Password salah! Silakan coba lagi.
                </p>
              )}

              <div className="flex gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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

      {/* 3. MODAL KOMPREHENSIF ADD / EDIT MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d631b]/10 text-[#0d631b] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">{isEditMode ? 'edit' : 'person_add'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Profil Anggota Keluarga' : 'Tambah Anggota Keluarga Baru'}</h2>
                  <p className="text-xs text-slate-500">Isi data lengkap silsilah dan informasi personal anggota keluarga</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <form onSubmit={handleFormSubmit} id="addMemberForm" className="space-y-6">
                 
                {/* ACCORDION 1: BASIC INFORMATION */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => setActiveAccordion(activeAccordion === 1 ? 0 : 1)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d631b]">badge</span>
                      SEKSI 1 : Informasi Dasar & Generasi (Wajib untuk Silsilah)
                    </span>
                    <span className="material-symbols-outlined">{activeAccordion === 1 ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activeAccordion === 1 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="w-32 h-20 rounded-xl overflow-hidden bg-gray-200 border-2 border-white shadow-md flex items-center justify-center shrink-0">
                          {formData.profilePhoto ? (
                            <img src={formData.profilePhoto} alt="Pratinjau" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-3xl text-gray-400">image</span>
                          )}
                        </div>
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Foto Profil (Unggah & Sesuaikan)</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0d631b] file:text-white hover:file:bg-[#094813] cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          name="fullName" 
                          value={formData.fullName} 
                          onChange={handleFormChange}
                          placeholder="Masukkan nama lengkap" 
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Generasi <span className="text-red-500">*</span></label>
                        <select 
                          name="generation" 
                          value={formData.generation} 
                          onChange={handleFormChange}
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="1st Generation">Generasi 1 (Leluhur / Buyut Utama)</option>
                          <option value="2nd Generation">Generasi 2 (Anak)</option>
                          <option value="3rd Generation">Generasi 3 (Cucu)</option>
                          <option value="4th Generation">Generasi 4 (Cicit)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Panggilan</label>
                        <input 
                          type="text" 
                          name="nickname" 
                          value={formData.nickname} 
                          onChange={handleFormChange}
                          placeholder="Nama panggilan" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                        <select 
                          name="gender" 
                          value={formData.gender} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="Male">Laki-laki</option>
                          <option value="Female">Perempuan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                        <input 
                          type="text" 
                          name="placeOfBirth" 
                          value={formData.placeOfBirth} 
                          onChange={handleFormChange}
                          placeholder="Kota kelahiran" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                        <input 
                          type="date" 
                          name="dateOfBirth" 
                          value={formData.dateOfBirth} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Status Hidup</label>
                        <select 
                          name="lifeStatus" 
                          value={formData.lifeStatus} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="Alive">Hidup</option>
                          <option value="Deceased">Wafat</option>
                        </select>
                      </div>

                      {formData.lifeStatus === 'Deceased' && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Wafat</label>
                          <input 
                            type="date" 
                            name="dateOfDeath" 
                            value={formData.dateOfDeath} 
                            onChange={handleFormChange}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ACCORDION 2: FAMILY RELATIONSHIP */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => setActiveAccordion(activeAccordion === 2 ? 0 : 2)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d631b]">family_history</span>
                      SEKSI 2 : Hubungan Keluarga (Penting untuk Garis Silsilah)
                    </span>
                    <span className="material-symbols-outlined">{activeAccordion === 2 ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activeAccordion === 2 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ayah</label>
                        <select 
                          name="father" 
                          value={formData.father} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="">-- Pilih Ayah --</option>
                          {members.map(m => (
                            <option key={m.id} value={m.fullName || m.name}>
                              {m.fullName || m.name} ({m.dateOfBirth ? m.dateOfBirth.substring(0,4) : 'N/A'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ibu</label>
                        <select 
                          name="mother" 
                          value={formData.mother} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="">-- Pilih Ibu --</option>
                          {members.map(m => (
                            <option key={m.id} value={m.fullName || m.name}>
                              {m.fullName || m.name} ({m.dateOfBirth ? m.dateOfBirth.substring(0,4) : 'N/A'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pasangan</label>
                        <select 
                          name="spouse" 
                          value={formData.spouse} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="">-- Pilih Pasangan --</option>
                          {members.map(m => (
                            <option key={m.id} value={m.fullName || m.name}>
                              {m.fullName || m.name} ({m.dateOfBirth ? m.dateOfBirth.substring(0,4) : 'N/A'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Status Pernikahan</label>
                        <select 
                          name="maritalStatus" 
                          value={formData.maritalStatus} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="Single">Belum Menikah (Single)</option>
                          <option value="Married">Menikah (Married)</option>
                          <option value="Divorced">Cerai (Divorced)</option>
                          <option value="Widower">Duda (Widower)</option>
                          <option value="Widow">Janda (Widow)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Urutan Kelahiran</label>
                        <input 
                          type="number" 
                          name="birthOrder" 
                          value={formData.birthOrder} 
                          onChange={handleFormChange}
                          min="1"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 3: PERSONAL INFORMATION */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => setActiveAccordion(activeAccordion === 3 ? 0 : 3)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d631b]">person</span>
                      SEKSI 3 : Informasi Personal
                    </span>
                    <span className="material-symbols-outlined">{activeAccordion === 3 ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activeAccordion === 3 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                        <select 
                          name="latestEducation" 
                          value={formData.latestEducation} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="No Formal Education">Tidak Sekolah Formal</option>
                          <option value="Elementary School">SD</option>
                          <option value="Junior High School">SMP</option>
                          <option value="Senior High School">SMA</option>
                          <option value="Vocational High School">SMK</option>
                          <option value="Diploma 1">Diploma 1</option>
                          <option value="Diploma 2">Diploma 2</option>
                          <option value="Diploma 3">Diploma 3</option>
                          <option value="Diploma 4">Diploma 4</option>
                          <option value="Bachelor Degree">Sarjana (S1)</option>
                          <option value="Master Degree">Magister (S2)</option>
                          <option value="Doctoral Degree">Doktor (S3)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan</label>
                        <input 
                          type="text" 
                          name="occupation" 
                          value={formData.occupation} 
                          onChange={handleFormChange}
                          placeholder="Pekerjaan saat ini" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Golongan Darah</label>
                        <select 
                          name="bloodType" 
                          value={formData.bloodType} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                          <option value="Unknown">Tidak Diketahui</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                        <select 
                          name="religion" 
                          value={formData.religion} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="Islam">Islam</option>
                          <option value="Christian">Kristen</option>
                          <option value="Catholic">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddhist">Buddha</option>
                          <option value="Confucian">Konghucu</option>
                          <option value="Other">Lainnya</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 4: CURRENT ADDRESS */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => setActiveAccordion(activeAccordion === 4 ? 0 : 4)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d631b]">location_on</span>
                      SEKSI 4 : Alamat Saat Ini
                    </span>
                    <span className="material-symbols-outlined">{activeAccordion === 4 ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activeAccordion === 4 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Negara</label>
                        <select 
                          name="country" 
                          value={formData.country} 
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        >
                          <option value="Indonesia">Indonesia</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Singapore">Singapura</option>
                          <option value="Other">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Provinsi</label>
                        <input 
                          type="text" 
                          name="province" 
                          value={formData.province} 
                          onChange={handleFormChange}
                          placeholder="Provinsi" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
                        <input 
                          type="text" 
                          name="city" 
                          value={formData.city} 
                          onChange={handleFormChange}
                          placeholder="Kota / Kabupaten" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kecamatan</label>
                        <input 
                          type="text" 
                          name="district" 
                          value={formData.district} 
                          onChange={handleFormChange}
                          placeholder="Kecamatan" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                        <textarea 
                          name="fullAddress" 
                          value={formData.fullAddress} 
                          onChange={handleFormChange}
                          rows="3" 
                          placeholder="Alamat lengkap tempat tinggal"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        ></textarea>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos</label>
                        <input 
                          type="number" 
                          name="postalCode" 
                          value={formData.postalCode} 
                          onChange={handleFormChange}
                          placeholder="Kode pos" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 5: CONTACT INFORMATION */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => setActiveAccordion(activeAccordion === 5 ? 0 : 5)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d631b]">contacts</span>
                      SEKSI 5 : Informasi Kontak
                    </span>
                    <span className="material-symbols-outlined">{activeAccordion === 5 ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activeAccordion === 5 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon</label>
                        <input 
                          type="text" 
                          name="phoneNumber" 
                          value={formData.phoneNumber} 
                          onChange={handleFormChange}
                          placeholder="08123456789" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                        <input 
                          type="text" 
                          name="whatsappNumber" 
                          value={formData.whatsappNumber} 
                          onChange={handleFormChange}
                          placeholder="08123456789" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleFormChange}
                          placeholder="email@example.com" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Instagram</label>
                        <input 
                          type="text" 
                          name="instagram" 
                          value={formData.instagram} 
                          onChange={handleFormChange}
                          placeholder="@username" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Facebook</label>
                        <input 
                          type="text" 
                          name="facebook" 
                          value={formData.facebook} 
                          onChange={handleFormChange}
                          placeholder="Nama Akun FB" 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 6: ADDITIONAL INFORMATION */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => setActiveAccordion(activeAccordion === 6 ? 0 : 6)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d631b]">info</span>
                      SEKSI 6 : Informasi Tambahan
                    </span>
                    <span className="material-symbols-outlined">{activeAccordion === 6 ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activeAccordion === 6 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Biografi Singkat</label>
                        <textarea 
                          name="shortBiography" 
                          value={formData.shortBiography} 
                          onChange={handleFormChange}
                          rows="3" 
                          placeholder="Ringkasan singkat riwayat hidup..."
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        ></textarea>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Keluarga</label>
                        <textarea 
                          name="familyNotes" 
                          value={formData.familyNotes} 
                          onChange={handleFormChange}
                          rows="3" 
                          placeholder="Catatan khusus silsilah keluarga..."
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        ></textarea>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pencapaian / Prestasi</label>
                        <textarea 
                          name="achievements" 
                          value={formData.achievements} 
                          onChange={handleFormChange}
                          rows="3" 
                          placeholder="Penghargaan atau pencapaian penting..."
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d631b]"
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="addMemberForm"
                disabled={saving}
                className="px-6 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-[#0d631b]/20 cursor-pointer disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : (isEditMode ? "Perbarui Anggota" : "Simpan Anggota")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#d8e3fb]/40 border-t border-gray-200 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-12 max-w-7xl mx-auto w-full gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0d631b] text-2xl">forest</span>
              <span className="text-lg font-bold text-[#0d631b]">AncestryFlow</span>
            </div>
            <p className="text-sm text-[#40493d]">© 2026 AncestryFlow. Menjaga warisan silsilah dari generasi ke generasi.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Peta Situs</a>
            <a className="text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Kebijakan Privasi</a>
            <a className="text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Ketentuan Layanan</a>
            <a className="text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Hubungi Kami</a>
            <a className="text-sm text-[#40493d] hover:text-[#0d631b] transition-all hover:underline" href="#">Akses Arsip</a>
          </div>
        </div>
      </footer>
    </div>
  );
}