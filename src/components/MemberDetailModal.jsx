import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function MemberDetailModal({
  isOpen,
  onClose,
  member,
  trees = [],
  onEditClick,
}) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' atau 'album'

  if (!isOpen || !member) return null;

  // Fungsi untuk mengunggah foto baru ke album anggota ini
  const handleUploadAlbumPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar! Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Update data tree dengan menambahkan foto ke array photos milik member
        const updatedPhotos = member.photos ? [...member.photos, base64Image] : [base64Image];
        const updatedMemberData = { ...member, photos: updatedPhotos };

        try {
          const updatedTrees = updateMemberInTrees(trees, updatedMemberData);
          await setDoc(doc(db, 'families', 'root_tree'), { trees: updatedTrees });
          // Update lokal objek member agar langsung tampil
          member.photos = updatedPhotos;
        } catch (error) {
          console.error('Gagal mengunggah foto album:', error);
          alert('Gagal menyimpan foto.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Fungsi bantu untuk memperbarui data member di dalam struktur trees
  const updateMemberInTrees = (nodeList, updatedPerson) => {
    return nodeList.map((tree) => {
      const updateRecursive = (node) => {
        if (!node) return null;
        let newPerson = node.person;
        let newSpouse = node.spouse;

        if (node.person && node.person.id === updatedPerson.id) {
          newPerson = { ...node.person, ...updatedPerson };
        } else if (node.spouse && node.spouse.id === updatedPerson.id) {
          newSpouse = { ...node.spouse, ...updatedPerson };
        }

        const newChildren = node.children && Array.isArray(node.children)
          ? node.children.map((child) => updateRecursive(child))
          : [];

        return { ...node, person: newPerson, spouse: newSpouse, children: newChildren };
      };
      return updateRecursive(tree);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 border border-emerald-300 shrink-0">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-emerald-800 font-bold text-sm">
                  {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{member.name}</h3>
              <p className="text-xs text-slate-500">{member.role || 'Anggota Keluarga'} • {member.dates || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEditClick && (
              <button
                onClick={() => {
                  onClose();
                  onEditClick(member);
                }}
                className="px-3 py-1.5 bg-emerald-50 text-[#0d631b] hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigasi (Info & Album Foto) */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-[#0d631b] text-[#0d631b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span> Informasi Biodata
          </button>
          <button
            onClick={() => setActiveTab('album')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'album'
                ? 'border-[#0d631b] text-[#0d631b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_library</span> Album Foto ({member.photos?.length || 0})
          </button>
        </div>

        {/* Konten Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'info' ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'wafat' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>
                    {member.status === 'wafat' ? 'Sudah Wafat' : 'Masih Hidup'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Jenis Kelamin</span>
                  <span className="block mt-1 font-semibold text-slate-700 capitalize">{member.gender === 'female' ? 'Perempuan' : 'Laki-laki'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pendidikan</span>
                  <span className="block mt-1 font-semibold text-slate-700">{member.education || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pekerjaan</span>
                  <span className="block mt-1 font-semibold text-slate-700">{member.occupation || '-'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Biografi / Catatan Singkat</span>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">{member.bio || 'Belum ada biografi atau catatan khusus untuk anggota ini.'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tombol Unggah Foto Baru ke Album */}
              <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Tambah Foto ke Album {member.name}</h4>
                  <p className="text-[11px] text-emerald-700">Unggah dokumentasi, foto kenangan, atau kegiatan.</p>
                </div>
                <label className="px-3 py-2 bg-[#0d631b] hover:bg-[#094713] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                  <span>Pilih Foto</span>
                  <input type="file" accept="image/*" onChange={handleUploadAlbumPhoto} className="hidden" />
                </label>
              </div>

              {/* Grid Album Foto */}
              {member.photos && member.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {member.photos.map((photoUrl, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                      <img src={photoUrl} alt={`Album ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">image_not_supported</span>
                  <p className="text-xs font-medium text-slate-500">Belum ada foto di album ini.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Gunakan tombol di atas untuk mulai menambahkan foto.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}