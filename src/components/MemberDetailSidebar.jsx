import React from 'react';

export default function MemberDetailSidebar({ 
  isOpen, 
  onClose, 
  member, 
  onEdit, 
  onAddRelative, 
  onDelete 
}) {
  if (!isOpen || !member) return null;

  // =========================================================================
  // FUNGSI SUPER-EKSTRAKTOR 
  // Mencari data ke semua lapisan object yang sering dimanipulasi library Tree
  // =========================================================================
  const getVal = (keys, fallback = "-") => {
    const checkKeys = Array.isArray(keys) ? keys : [keys];
    for (let key of checkKeys) {
      if (member[key]) return member[key];
      if (member.data && member.data[key]) return member.data[key];
      if (member.item && member.item[key]) return member.item[key];
      if (member.person && member.person[key]) return member.person[key];
      if (member.attributes && member.attributes[key]) return member.attributes[key];
    }
    return fallback;
  };

  // Mencari FOTO PROFIL di semua kemungkinan properti
  const displayImg = getVal(['image', 'img', 'photo', 'profilePhoto', 'imageUrl', 'avatar'], null) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";
  
  // Mencari NAMA dan GENERASI
  const displayName = getVal(['fullName', 'name'], "Tanpa Nama");
  const displayGen = getVal(['generation'], "Generasi Silsilah");

  // Helper untuk format tanggal agar user-friendly
  const formatDateFriendly = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    const parts = String(dateStr).split("-");
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

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Modal Header / Close Button */}
        <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-gray-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0d631b]">account_tree</span>
            Detail Silsilah
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable Details) */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6 text-sm text-[#40493d]">
          
          {/* HEADER PROFIL */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-8 bg-white py-2">
            
            {/* Foto Profil Lingkaran */}
            <div className="relative shrink-0">
              <img 
                src={displayImg} 
                alt={displayName}
                className="w-40 h-40 sm:w-44 sm:h-44 rounded-full object-cover shadow-md border-4 border-white bg-slate-100"
              />
              <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#0d631b] text-white flex items-center justify-center shadow-md border-2 border-white">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
            </div>

            {/* Informasi di Kanan */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="mb-2">
                <span className="text-xs font-bold text-[#00731e] bg-[#91f78e]/30 px-3.5 py-1 rounded-full uppercase tracking-wider">
                  {displayGen}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111c2d] mb-3 tracking-tight">
                {displayName}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getVal(['shortBiography']) && getVal(['shortBiography']) !== "-" 
                  ? getVal(['shortBiography']) 
                  : `Seorang anggota keluarga dengan silsilah terdaftar di dalam arsip keluarga.`}
              </p>
            </div>
          </div>

          {/* SECTION 1: Basic Info */}
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
            <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
              <span className="material-symbols-outlined text-base">badge</span> INFORMASI DASAR
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-400 block text-xs">Nama Panggilan</span> <span className="font-medium text-slate-800">{getVal(['nickname'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Jenis Kelamin</span> <span className="font-medium text-slate-800">{getVal(['gender'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Tempat Lahir</span> <span className="font-medium text-slate-800">{getVal(['placeOfBirth'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Tanggal Lahir</span> <span className="font-medium text-slate-800">{formatDateFriendly(getVal(['dateOfBirth', 'birthDate']))}</span></div>
              <div><span className="text-gray-400 block text-xs">Status Hidup</span> <span className="font-medium text-slate-800">{getVal(['lifeStatus']) === 'Deceased' ? 'Wafat' : 'Hidup'}</span></div>
              {getVal(['lifeStatus']) === 'Deceased' && (
                <div><span className="text-gray-400 block text-xs">Tanggal Wafat</span> <span className="font-medium text-slate-800">{formatDateFriendly(getVal(['dateOfDeath']))}</span></div>
              )}
            </div>
          </div>

          {/* SECTION 2: Family Relationship */}
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
            <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
              <span className="material-symbols-outlined text-base">family_history</span> HUBUNGAN KELUARGA
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-400 block text-xs">Ayah</span> <span className="font-medium text-slate-800">{getVal(['father'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Ibu</span> <span className="font-medium text-slate-800">{getVal(['mother'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Pasangan</span> <span className="font-medium text-slate-800">{getVal(['spouse'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Status Pernikahan</span> <span className="font-medium text-slate-800">{getVal(['maritalStatus'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Urutan Kelahiran</span> <span className="font-medium text-slate-800">{getVal(['birthOrder'])}</span></div>
            </div>
          </div>

          {/* SECTION 3: Personal Information */}
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
            <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
              <span className="material-symbols-outlined text-base">person</span> INFORMASI PERSONAL
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-400 block text-xs">Pendidikan Terakhir</span> <span className="font-medium text-slate-800">{getVal(['latestEducation'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Pekerjaan</span> <span className="font-medium text-slate-800">{getVal(['occupation'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Golongan Darah</span> <span className="font-medium text-slate-800">{getVal(['bloodType'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Agama</span> <span className="font-medium text-slate-800">{getVal(['religion'])}</span></div>
            </div>
          </div>

          {/* SECTION 4: Current Address */}
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
            <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
              <span className="material-symbols-outlined text-base">location_on</span> ALAMAT SAAT INI
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-400 block text-xs">Negara</span> <span className="font-medium text-slate-800">{getVal(['country'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Provinsi</span> <span className="font-medium text-slate-800">{getVal(['province'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Kota / Kabupaten</span> <span className="font-medium text-slate-800">{getVal(['city'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Kecamatan</span> <span className="font-medium text-slate-800">{getVal(['district'])}</span></div>
              <div className="col-span-2"><span className="text-gray-400 block text-xs">Alamat Lengkap</span> <span className="font-medium text-slate-800">{getVal(['fullAddress'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Kode Pos</span> <span className="font-medium text-slate-800">{getVal(['postalCode'])}</span></div>
            </div>
          </div>

          {/* SECTION 5: Contact Information */}
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
            <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
              <span className="material-symbols-outlined text-base">contacts</span> INFORMASI KONTAK
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-400 block text-xs">Nomor Telepon</span> <span className="font-medium text-slate-800">{getVal(['phoneNumber'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Nomor WhatsApp</span> <span className="font-medium text-slate-800">{getVal(['whatsappNumber'])}</span></div>
              <div className="col-span-2"><span className="text-gray-400 block text-xs">Alamat Email</span> <span className="font-medium text-slate-800">{getVal(['email'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Instagram</span> <span className="font-medium text-slate-800">{getVal(['instagram'])}</span></div>
              <div><span className="text-gray-400 block text-xs">Facebook</span> <span className="font-medium text-slate-800">{getVal(['facebook'])}</span></div>
            </div>
          </div>

          {/* SECTION 6: Additional Information */}
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-gray-200/60 space-y-3">
            <h4 className="font-bold text-[#0d631b] uppercase tracking-wider text-xs flex items-center gap-1.5 border-b pb-2">
              <span className="material-symbols-outlined text-base">info</span> INFORMASI TAMBAHAN
            </h4>
            <div className="space-y-3">
              <div><span className="text-gray-400 block text-xs">Biografi Singkat</span> <p className="font-medium text-slate-800 mt-0.5">{getVal(['shortBiography'])}</p></div>
              <div><span className="text-gray-400 block text-xs">Catatan Keluarga</span> <p className="font-medium text-slate-800 mt-0.5">{getVal(['familyNotes'])}</p></div>
              <div><span className="text-gray-400 block text-xs">Pencapaian / Prestasi</span> <p className="font-medium text-slate-800 mt-0.5">{getVal(['achievements'])}</p></div>
            </div>
          </div>

        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <button 
            onClick={() => {
              onClose();
              // Pastikan data asli dikirim ke form edit (bukan hanya string)
              const originalData = member.data || member.item || member.person || member;
              onEdit(originalData);
            }}
            className="flex-1 py-2.5 bg-[#0d631b] hover:bg-[#094813] text-white font-bold text-xs rounded-xl transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">edit</span> Edit
          </button>

          <button 
            onClick={() => {
              onClose();
              const targetId = getVal(['id', 'key']);
              onAddRelative(targetId);
            }}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">person_add</span> Tambah Relasi
          </button>

          <button 
            onClick={() => {
              const originalData = member.data || member.item || member.person || member;
              onDelete(originalData);
            }}
            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">delete</span> Hapus
          </button>
        </div>

      </div>
    </div>
  );
}