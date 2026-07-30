import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function MemberForm({
  isOpen,
  onClose,
  trees = [],
  editMember = null,
  defaultParentId = '',
}) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [status, setStatus] = useState('hidup');
  const [role, setRole] = useState('Kepala Keluarga');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [education, setEducation] = useState('Kuliah');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');

  // Mode Relasi: 'child', 'spouse', 'cross_marriage', 'new_root'
  const [relationType, setRelationType] = useState('child');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedCrossPartnerId, setSelectedCrossPartnerId] = useState('');

  // Mengumpulkan seluruh anggota dengan pembersihan nama trah per generasi
  const getAllMembersFromTrees = (treeList) => {
    let list = [];
    
    const traverse = (node, treeId, isTopLevel = false) => {
      if (!node) return;

      if (node.person) {
        if (node.spouse) {
          if (isTopLevel) {
            list.push({
              id: node.person.id,
              name: `Trah ${node.person.name} — ${node.spouse.name}`,
              isCouple: true,
              treeId,
              nodeId: node.id
            });
          } else {
            list.push({
              id: node.person.id,
              name: `${node.person.name} — ${node.spouse.name}`,
              isCouple: true,
              treeId,
              nodeId: node.id
            });
          }
        } else {
          list.push({
            id: node.person.id,
            name: isTopLevel ? `Trah ${node.person.name}` : node.person.name,
            role: node.person.role,
            isCouple: false,
            treeId,
            nodeId: node.id
          });
        }
      }

      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        node.children.forEach((child) => traverse(child, treeId, false));
      }
    };

    if (Array.isArray(treeList)) {
      treeList.forEach((tree) => traverse(tree, tree?.id, true));
    }
    return list;
  };

  const allMembers = getAllMembersFromTrees(trees);

  // Inisialisasi form saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    if (editMember) {
      setName(editMember.name || '');
      setGender(editMember.gender || 'male');
      setStatus(editMember.status || 'hidup');
      setRole(editMember.role || 'Anak');
      setBirthDate(editMember.birthDate || '');
      setDeathDate(editMember.deathDate || '');
      setEducation(editMember.education || 'Kuliah');
      setAvatar(editMember.avatar || '');
      setBio(editMember.bio || '');
      setOccupation(editMember.occupation || '');
    } else {
      setName('');
      setGender('male');
      setStatus('hidup');
      setBirthDate('');
      setDeathDate('');
      setEducation('Kuliah');
      setAvatar('');
      setBio('');
      setOccupation('');
      setSelectedParentId(defaultParentId || (allMembers[0]?.id || ''));
      setSelectedCrossPartnerId('');
      setRelationType(!trees || trees.length === 0 ? 'new_root' : 'child');
      setRole('Kepala Keluarga');
    }
  }, [isOpen, editMember]);

  if (!isOpen) return null;

  const roleOptions = ['Kepala Keluarga', 'Kakek Buyut', 'Nenek Buyut', 'Ayah', 'Ibu', 'Suami', 'Istri', 'Anak', 'Cucu'];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Ukuran foto terlalu besar! Maksimal 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const insertMemberToNode = (node, targetId, newMember, relation, crossPartnerObj = null) => {
    if (!node) return null;

    let updatedNode = { ...node };

    const isTargetMatch = 
      (updatedNode.person && updatedNode.person.id === targetId) || 
      (updatedNode.spouse && updatedNode.spouse.id === targetId);

    if (isTargetMatch) {
      if (relation === 'spouse') {
        updatedNode.spouse = newMember;
      } else if (relation === 'cross_marriage') {
        updatedNode.crossMarriage = {
          isCross: true,
          targetPersonId: crossPartnerObj ? crossPartnerObj.id : null,
        };
      } else if (relation === 'child') {
        const newChildNode = {
          id: `node-${Date.now()}`,
          person: newMember,
          spouse: null,
          children: [],
        };
        updatedNode.children = [...(updatedNode.children || []), newChildNode];
      }
    }

    if (updatedNode.children && Array.isArray(updatedNode.children) && updatedNode.children.length > 0) {
      updatedNode.children = updatedNode.children.map((child) =>
        insertMemberToNode(child, targetId, newMember, relation, crossPartnerObj)
      );
    }

    return updatedNode;
  };

  const updateMemberInNode = (node, updatedPerson) => {
    if (!node) return null;
    let newPerson = node.person;
    let newSpouse = node.spouse;

    if (node.person && node.person.id === updatedPerson.id) {
      newPerson = { ...node.person, ...updatedPerson };
    } else if (node.spouse && node.spouse.id === updatedPerson.id) {
      newSpouse = { ...node.spouse, ...updatedPerson };
    }

    const newChildren = node.children && Array.isArray(node.children)
      ? node.children.map((child) => updateMemberInNode(child, updatedPerson))
      : [];

    return { ...node, person: newPerson, spouse: newSpouse, children: newChildren };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const birthYear = birthDate ? new Date(birthDate).getFullYear() : '';
    const deathYear = deathDate ? new Date(deathDate).getFullYear() : '';

    let formattedDates = 'Sekarang';
    if (birthYear && status === 'hidup') {
      formattedDates = `${birthYear} - Sekarang`;
    } else if (birthYear && status === 'wafat') {
      formattedDates = deathYear ? `${birthYear} - ${deathYear}` : `${birthYear} - Wafat`;
    } else if (status === 'wafat') {
      formattedDates = deathYear ? `Wafat ${deathYear}` : 'Almarhum/ah';
    }

    const personData = {
      id: editMember ? editMember.id : `p-${Date.now()}`,
      name,
      gender,
      status,
      role,
      dates: formattedDates,
      birthDate,
      deathDate: status === 'wafat' ? deathDate : '',
      avatar,
      bio,
      education,
      occupation,
    };

    try {
      let updatedTrees = Array.isArray(trees) ? [...trees] : [];

      if (editMember) {
        updatedTrees = updatedTrees.map((tree) =>
          updateMemberInNode(tree, personData)
        );
      } else if (relationType === 'new_root' || updatedTrees.length === 0) {
        // Membuat Trah Baru Independen (Trah B, C, D, dst)
        const newTreeRoot = {
          id: `tree-${Date.now()}`,
          person: personData,
          spouse: null,
          children: [],
        };
        updatedTrees.push(newTreeRoot);
      } else if (relationType === 'cross_marriage' && selectedCrossPartnerId) {
        if (!selectedParentId || !selectedCrossPartnerId) {
          alert('Pilih kedua anggota dari masing-masing trah!');
          return;
        }

        if (selectedParentId === selectedCrossPartnerId) {
          alert('Tidak bisa memilih orang yang sama!');
          return;
        }

        const targetMember1 = allMembers.find((m) => m.id === selectedParentId);
        const targetMember2 = allMembers.find((m) => m.id === selectedCrossPartnerId);

        if (!targetMember1 || !targetMember2) {
          alert('Pilih dua anggota yang valid!');
          return;
        }

        updatedTrees = updatedTrees.map((tree) =>
          insertMemberToNode(tree, targetMember1.id, null, 'cross_marriage', targetMember2)
        );
        updatedTrees = updatedTrees.map((tree) =>
          insertMemberToNode(tree, targetMember2.id, null, 'cross_marriage', targetMember1)
        );
      } else {
        updatedTrees = updatedTrees.map((tree) =>
          insertMemberToNode(tree, selectedParentId, personData, relationType)
        );
      }

      await setDoc(doc(db, 'families', 'root_tree'), { trees: updatedTrees });
      onClose();
    } catch (error) {
      console.error('Error menyimpan data:', error);
      alert('Gagal menyimpan ke Firestore: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">
            {editMember
              ? `Edit Data: ${editMember.name}`
              : relationType === 'new_root'
              ? 'Buat Trah Baru (Kepala Keluarga Baru)'
              : relationType === 'cross_marriage'
              ? 'Penyatuan 2 Trah (Pernikahan Silang)'
              : 'Tambah Anggota Keluarga Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {!editMember && (
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-2">
                  Tipe Relasi / Penambahan:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRelationType('child');
                      setRole('Anak');
                    }}
                    className={`p-2 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                      relationType === 'child' || relationType === 'spouse'
                        ? 'bg-[#0d631b] text-white border-[#0d631b]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Anggota / Pasangan
                  </button>

                  <button
                    type="button"
                    onClick={() => setRelationType('cross_marriage')}
                    className={`p-2 rounded-lg font-semibold border text-center transition-all cursor-pointer ${
                      relationType === 'cross_marriage'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    💍 Penyatuan Trah
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRelationType('new_root');
                      setRole('Kepala Keluarga');
                    }}
                    className={`p-2 rounded-lg font-semibold border text-center transition-all cursor-pointer ${
                      relationType === 'new_root'
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    🏛️ Trah Baru
                  </button>
                </div>
              </div>

              {/* Mode: Anggota / Pasangan */}
              {(relationType === 'child' || relationType === 'spouse') && allMembers.length > 0 && (
                <>
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                      Hubungkan Dengan Anggota:
                    </label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm focus:outline-none"
                    >
                      {allMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.role && m.role !== 'Kepala Keluarga' && !m.isCouple ? `(${m.role})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div
                      onClick={() => {
                        setRelationType('child');
                        setRole('Anak');
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all ${
                        relationType === 'child'
                          ? 'border-[#0d631b] bg-white text-[#0d631b] font-semibold'
                          : 'border-slate-200 bg-white/50 text-slate-500'
                      }`}
                    >
                      <span className="text-xs">Anak Kandung</span>
                    </div>

                    <div
                      onClick={() => {
                        setRelationType('spouse');
                        setRole(gender === 'male' ? 'Suami' : 'Istri');
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all ${
                        relationType === 'spouse'
                          ? 'border-[#0d631b] bg-white text-[#0d631b] font-semibold'
                          : 'border-slate-200 bg-white/50 text-slate-500'
                      }`}
                    >
                      <span className="text-xs">Pasangan (Suami/Istri)</span>
                    </div>
                  </div>
                </>
              )}

              {/* Mode: Penyatuan Trah */}
              {relationType === 'cross_marriage' && (
                <div className="p-3 bg-purple-100/60 rounded-xl border border-purple-200 space-y-3 pt-2">
                  <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                    Pilih 2 Anggota dari Trah berbeda untuk dihubungkan lintas trah.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">Anggota Trah A</label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm focus:outline-none"
                    >
                      <option value="">-- Pilih Anggota Trah A --</option>
                      {allMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">Pasangan Trah B</label>
                    <select
                      value={selectedCrossPartnerId}
                      onChange={(e) => setSelectedCrossPartnerId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm focus:outline-none"
                    >
                      <option value="">-- Pilih Pasangan Trah B --</option>
                      {allMembers.filter((m) => m.id !== selectedParentId).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mode: Trah Baru */}
              {relationType === 'new_root' && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                    🏛️ Anda sedang membuat **Trah Baru** (misal: Trah B, Trah C, dst). Anggota ini akan menjadi Kepala Keluarga independen baru di kanvas utama.
                  </p>
                </div>
              )}
            </div>
          )}

          {relationType !== 'cross_marriage' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Foto Profil</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                    {avatar ? (
                      <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-[28px]">add_a_photo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#0d631b] hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap Kepala / Anggota *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Trah B / Budi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0d631b]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Status Anggota</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setStatus('hidup')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${status === 'hidup' ? 'border-[#0d631b] bg-emerald-50 text-[#0d631b] font-semibold' : 'border-slate-200 text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
                    <span className="text-xs">Masih Hidup</span>
                  </div>
                  <div
                    onClick={() => setStatus('wafat')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${status === 'wafat' ? 'border-slate-700 bg-slate-100 text-slate-800 font-semibold' : 'border-slate-200 text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">sentiment_neutral</span>
                    <span className="text-xs">Sudah Wafat</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Lahir</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none" />
                </div>
                {status === 'wafat' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Wafat</label>
                    <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setGender('male');
                      if (relationType === 'spouse') setRole('Suami');
                    }}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${gender === 'male' ? 'border-[#0d631b] bg-emerald-50 text-[#0d631b] font-semibold' : 'border-slate-200 text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">male</span>
                    <span className="text-xs">Laki-laki</span>
                  </div>
                  
                  <div
                    onClick={() => {
                      setGender('female');
                      if (relationType === 'spouse') setRole('Istri');
                    }}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${gender === 'female' ? 'border-[#0d631b] bg-emerald-50 text-[#0d631b] font-semibold' : 'border-slate-200 text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">female</span>
                    <span className="text-xs">Perempuan</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Peran Dalam Keluarga (Bebas Dipilih)</label>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((item) => (
                    <div
                      key={item}
                      onClick={() => setRole(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${role === item ? 'bg-[#0d631b] text-white border-[#0d631b]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" className={`px-5 py-2 text-xs font-medium text-white rounded-xl transition-colors cursor-pointer ${relationType === 'cross_marriage' ? 'bg-purple-700 hover:bg-purple-800' : relationType === 'new_root' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-[#0d631b] bg-[#094713]'}`}>
              {relationType === 'cross_marriage' ? 'Satukan Trah' : relationType === 'new_root' ? 'Buat Trah Baru' : editMember ? 'Simpan Perubahan' : 'Simpan Ke Firestore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}