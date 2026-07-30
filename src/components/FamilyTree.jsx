import React, { useState, useEffect, useRef } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// ==========================================
// FUNGSI BANTU FORMAT TANGGAL
// ==========================================
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

// ==========================================
// 1. FLOATING TOOLBAR CONTROL (ZOOM IN/OUT)
// ==========================================
const FloatingToolbar = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md border border-[#bfcaba] rounded-full px-4 py-1.5 flex items-center gap-3 shadow-lg">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => zoomIn()}
          className="p-2 hover:bg-emerald-50 text-[#0d631b] rounded-full transition-colors flex items-center justify-center cursor-pointer"
          title="Perbesar"
        >
          <span className="material-symbols-outlined text-[20px]">zoom_in</span>
        </button>
        <button
          type="button"
          onClick={() => zoomOut()}
          className="p-2 hover:bg-emerald-50 text-[#0d631b] rounded-full transition-colors flex items-center justify-center cursor-pointer"
          title="Perkecil"
        >
          <span className="material-symbols-outlined text-[20px]">zoom_out</span>
        </button>
        <button
          type="button"
          onClick={() => resetTransform()}
          className="p-2 hover:bg-emerald-50 text-[#0d631b] rounded-full transition-colors flex items-center justify-center cursor-pointer"
          title="Kembalikan Tampilan"
        >
          <span className="material-symbols-outlined text-[20px]">restart_alt</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 2. KARTU ANGGOTA KELUARGA
// ==========================================
const MemberCard = ({ member, isHighlighted, onSelect }) => {
  if (!member) return null;

  return (
    <div
      id={`member-card-${member.id}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(member);
      }}
      className={`group relative flex flex-col bg-white/95 backdrop-blur-md border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 w-52 text-center shadow-xs hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl hover:bg-white ${
        isHighlighted
          ? 'border-[#0d631b] ring-2 ring-[#0d631b]/20 bg-emerald-50/30'
          : 'border-[#bfcaba] hover:border-[#0d631b]'
      }`}
    >
      <div className="w-full h-36 bg-slate-100 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
        {member.avatar || member.image || member.profilePhoto ? (
          <img
            src={member.avatar || member.image || member.profilePhoto}
            alt={member.name || member.fullName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-slate-400 text-[56px]">
            {member.gender === 'female' || member.gender === 'Female' ? 'woman' : 'man'}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col items-center">
        <h3 className="font-bold text-2xl text-[#111c2d] line-clamp-1">
          {member.name || member.fullName || 'Tanpa Nama'}
        </h3>
        <p className="text-sm text-[#40493d] mt-1 font-medium leading-tight">
          {member.dates || member.role || member.generation || '-'}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 3. TREENODE REKURSIF
// ==========================================
const TreeNode = ({ node, activePath, setActivePath, onSelectMember }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!node || !node.person) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = activePath === node.id;

  return (
    <div className="flex flex-col items-center relative">
      <div
        className="relative z-10"
        onMouseEnter={() => setActivePath(node.id)}
        onMouseLeave={() => setActivePath(null)}
      >
        <div
          className={`flex items-center gap-3 p-2.5 rounded-2xl border-2 bg-white/90 backdrop-blur-xs transition-all duration-300 shadow-sm ${
            isHighlighted
              ? 'border-[#0d631b] bg-emerald-50/50 shadow-md scale-105'
              : 'border-[#bfcaba]/60 hover:border-[#0d631b]'
          }`}
        >
          <MemberCard
            member={node.person}
            isHighlighted={isHighlighted}
            onSelect={onSelectMember}
          />

          {node.spouse && (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-inner text-xs bg-emerald-100 text-[#0d631b]">
                <span className="material-symbols-outlined text-[18px]">
                  favorite
                </span>
              </div>

              <MemberCard
                member={node.spouse}
                isHighlighted={isHighlighted}
                onSelect={onSelectMember}
              />
            </>
          )}
        </div>

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-white border border-[#bfcaba] flex items-center justify-center text-[#0d631b] hover:bg-emerald-50 shadow-xs transition-transform active:scale-90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">
              {isExpanded ? 'remove' : 'add'}
            </span>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center">
          <div
            className={`w-0.5 h-8 transition-colors duration-300 ${
              isHighlighted ? 'bg-[#0d631b]' : 'bg-[#bfcaba]'
            }`}
          />

          <div className="flex relative">
            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              const isOnlyChild = node.children.length === 1;

              return (
                <div
                  key={child.id || index}
                  className="flex flex-col items-center relative px-6"
                >
                  {!isOnlyChild && (
                    <div
                      className={`absolute top-0 h-0.5 transition-colors duration-300 ${
                        isHighlighted ? 'bg-[#0d631b]' : 'bg-[#bfcaba]'
                      }`}
                      style={{
                        left: isFirst ? '50%' : '0',
                        right: isLast ? '50%' : '0',
                      }}
                    />
                  )}

                  <div
                    className={`w-0.5 h-6 transition-colors duration-300 ${
                      isHighlighted ? 'bg-[#0d631b]' : 'bg-[#bfcaba]'
                    }`}
                  />

                  <TreeNode
                    node={child}
                    activePath={activePath}
                    setActivePath={setActivePath}
                    onSelectMember={onSelectMember}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. MAIN FAMILY TREE COMPONENT
// ==========================================
export default function FamilyTree({ onMemberClick }) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "members"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const builtTrees = buildFamilyTrees(membersData);
      setTrees(builtTrees);
      setLoading(false);
    }, (error) => {
      console.error("Gagal memuat silsilah:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const buildFamilyTrees = (membersList) => {
    if (!membersList || membersList.length === 0) return [];

    const formatDates = (m) => {
      const birth = formatDateFriendly(m.dateOfBirth || m.birthDate);
      const death = formatDateFriendly(m.dateOfDeath);
      return m.lifeStatus === "Deceased" ? `${birth} - ${death}` : `${birth} - Sekarang`;
    };

    const processedIds = new Set();
    const roots = [];

    const rootCandidates = membersList.filter(m => m.generation === "1st Generation" || !m.father || m.father === "-");

    rootCandidates.forEach(root => {
      if (processedIds.has(root.id)) return;

      const rootName = (root.fullName || root.name).toLowerCase();
      const referencesSpouse = root.spouse && root.spouse !== "-"
        ? membersList.find(m => (m.fullName || m.name).toLowerCase() === root.spouse.toLowerCase())
        : null;
      const referencedAsSpouseBy = membersList.find(m => 
        m.spouse && m.spouse !== "-" && m.spouse.toLowerCase() === rootName
      );

      const actualSpouse = referencesSpouse || referencedAsSpouseBy;

      processedIds.add(root.id);

      let spouseObj = null;
      if (actualSpouse) {
        processedIds.add(actualSpouse.id); 
        spouseObj = {
          id: actualSpouse.id,
          name: actualSpouse.fullName || actualSpouse.name,
          dates: formatDates(actualSpouse),
          avatar: actualSpouse.profilePhoto || actualSpouse.image,
          gender: actualSpouse.gender
        };
      }

      const finalRootName = root.fullName || root.name;
      const spouseName = spouseObj?.name;

      roots.push({
        id: root.id,
        person: {
          id: root.id,
          name: finalRootName,
          dates: formatDates(root),
          avatar: root.profilePhoto || root.image,
          gender: root.gender
        },
        spouse: spouseObj,
        children: getChildren(finalRootName, spouseName, membersList, processedIds, formatDates)
      });
    });

    return roots;
  };

  const getChildren = (parentName1, parentName2, membersList, processedIds, formatDates) => {
    if (!parentName1 && !parentName2) return [];

    const childrenList = membersList.filter(m => {
      const f = m.father?.toLowerCase();
      const mo = m.mother?.toLowerCase();
      const p1 = parentName1?.toLowerCase();
      const p2 = parentName2?.toLowerCase();
      return (f && (f === p1 || f === p2)) || (mo && (mo === p1 || mo === p2));
    });

    return childrenList.map(child => {
      const childName = (child.fullName || child.name).toLowerCase();

      // Jika anggota ini sudah dirender di cabang/trah lain, buat node tiruannya
      // dengan tampilan yang bersih, biasa saja tanpa indikator ungu.
      if (processedIds.has(child.id)) {
        return {
          id: child.id + '-cross',
          person: {
            id: child.id + '-cross', 
            name: child.fullName || child.name,
            dates: formatDates(child),
            avatar: child.profilePhoto || child.image,
            gender: child.gender
          },
          spouse: null, 
          children: [] 
        };
      }

      processedIds.add(child.id);

      const referencesSpouse = child.spouse && child.spouse !== "-"
        ? membersList.find(m => (m.fullName || m.name).toLowerCase() === child.spouse.toLowerCase())
        : null;

      const referencedAsSpouseBy = membersList.find(m => 
        m.spouse && m.spouse !== "-" && m.spouse.toLowerCase() === childName
      );

      const actualSpouse = referencesSpouse || referencedAsSpouseBy;

      let spouseObj = null;
      if (actualSpouse) {
        processedIds.add(actualSpouse.id);
        spouseObj = {
          id: actualSpouse.id,
          name: actualSpouse.fullName || actualSpouse.name,
          dates: formatDates(actualSpouse),
          avatar: actualSpouse.profilePhoto || actualSpouse.image,
          gender: actualSpouse.gender
        };
      }

      const finalChildName = child.fullName || child.name;
      const spouseName = spouseObj?.name;

      return {
        id: child.id,
        person: {
          id: child.id,
          name: finalChildName,
          dates: formatDates(child),
          avatar: child.profilePhoto || child.image,
          gender: child.gender
        },
        spouse: spouseObj,
        children: getChildren(finalChildName, spouseName, membersList, processedIds, formatDates)
      };
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-slate-500 text-sm">Memuat data silsilah...</p>
      </div>
    );
  }

  return <ActualFamilyTree trees={trees} onMemberClick={onMemberClick} />;
}

function ActualFamilyTree({ trees = [], onMemberClick }) {
  const [activePath, setActivePath] = useState(null);
  const containerRef = useRef(null);
  const hasData = trees && trees.length > 0;

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      {hasData ? (
        <TransformWrapper
          initialScale={0.75}
          minScale={0.2}
          maxScale={2.5}
          centerOnInit={false}
          limitToBounds={false}
          wheel={{ step: 0.05 }}
          onInit={(utils) => {
            const wrapper = utils.instance.wrapperComponent;
            if (wrapper) {
              const initialX = (wrapper.clientWidth - 3000 * 0.75) / 2;
              utils.setTransform(initialX, 20, 0.75);
            }
          }}
        >
          {() => (
            <>
              <FloatingToolbar />

              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{
                  width: '3000px',
                  height: '1600px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  cursor: 'grab',
                }}
              >
                <div
                  ref={containerRef}
                  className="w-full h-full flex flex-col items-center p-16 bg-[#f8fafc] bg-[image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22 viewBox=%220 0 120 120%22><path d=%22M60 10c-5 15-20 25-35 30 15 5 25 20 30 35 5-15 15-30 30-35-15-5-25-20-30-35z%22 fill=%22%230d631b%22 fill-opacity=%220.07%22/></svg>')] [background-size:140px_140px] relative"
                >
                  <div className="flex items-start gap-48 relative z-10 pt-4">
                    {trees.map((treeNode, index) => (
                      <div key={treeNode.id || index} className="flex flex-col items-center">
                        <div className="mb-6 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">groups</span>
                          <span>Generasi #{index + 1}</span>
                        </div>

                        <TreeNode
                          node={treeNode}
                          activePath={activePath}
                          setActivePath={setActivePath}
                          onSelectMember={onMemberClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <p className="text-slate-500 text-sm">Belum ada data silsilah yang dapat ditampilkan.</p>
        </div>
      )}
    </div>
  );
}