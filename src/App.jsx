import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import View Pages
import LandingPage from './views/LandingPage'; 
import Home from './views/Home';
import Members from './views/Members';
import Gallery from './views/Gallery';
import Register from './views/Register';
import Login from './views/Login';
import Profile from './views/Profile';
import AdminDashboard from './views/AdminDashboard'; // Import komponen Admin

// Import Layout & Komponen Pohon Keluarga
import MainLayout from './MainLayout';
import FamilyTree from './components/FamilyTree';
import MemberForm from './components/MemberForm';
import MemberDetailSidebar from './components/MemberDetailSidebar';

// Import Firebase
import { db } from './services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Komponen Halaman Silsilah Keluarga
function FamilyTreePage() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMemberData, setEditMemberData] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState('');

  // Mengambil data secara real-time dari Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'families', 'root_tree'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.trees) {
          setTrees(data.trees);
        } else if (data.person) {
          setTrees([data]);
        } else {
          setTrees([]);
        }
      } else {
        setTrees([]);
      }
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setIsSidebarOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditMemberData(member);
    setIsSidebarOpen(false);
    setIsFormOpen(true);
  };

  const handleAddRelative = (parentId) => {
    setEditMemberData(null);
    setDefaultParentId(parentId);
    setIsSidebarOpen(false);
    setIsFormOpen(true);
  };

  const handleOpenFormNew = () => {
    setEditMemberData(null);
    setDefaultParentId('');
    setIsFormOpen(true);
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${member.name}" dari silsilah?`)) return;

    try {
      const deleteFromNode = (node, targetId) => {
        if (!node) return null;
        
        // Jika yang dihapus adalah pasangan (spouse)
        if (node.spouse && node.spouse.id === targetId) {
          return { ...node, spouse: null };
        }
        
        // Filter anak-anak dan lakukan rekursi
        const updatedChildren = (node.children || [])
          .filter((child) => child.person && child.person.id !== targetId)
          .map((child) => deleteFromNode(child, targetId));
          
        return { ...node, children: updatedChildren };
      };

      let updatedTrees = trees.filter((tree) => tree.person.id !== member.id);
      
      // Jika root bukan yang dihapus, cari ke dalam tree
      if (updatedTrees.length === trees.length) {
        updatedTrees = trees.map((tree) => deleteFromNode(tree, member.id));
      }

      await setDoc(doc(db, 'families', 'root_tree'), { trees: updatedTrees });
      setIsSidebarOpen(false);
    } catch (err) {
      console.error('Error menghapus anggota:', err);
      alert('Gagal menghapus: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f9f9ff]">
        <div className="w-10 h-10 border-4 border-[#0d631b] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-[#0d631b] font-medium text-sm">Memuat Silsilah Keluarga...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <FamilyTree
        trees={trees}
        onMemberClick={handleMemberClick}
      />

      <MemberDetailSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        member={selectedMember}
        onEdit={handleOpenEdit}
        onAddRelative={handleAddRelative}
        onDelete={handleDeleteMember}
        onViewFullProfile={(member) => {
          alert(`Mengarahkan ke halaman detail lengkap untuk: ${member.name}`);
        }}
      />

      <MemberForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        trees={trees}
        editMember={editMemberData}
        defaultParentId={defaultParentId}
      />
    </div>
  );
}

// Komponen Utama App
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* =========================================
              ALUR 1: LANDING PAGE (PUBLIK) 
          ========================================= */}
          <Route path="/" element={<LandingPage />} />

          {/* =========================================
              ALUR 2: LOGIN & REGISTER (PUBLIK) 
          ========================================= */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* =========================================
              ALUR 3: ADMIN PANEL (PUBLIK - Hardcoded Login)
          ========================================= */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* =========================================
              ALUR 4: HOME & DASHBOARD (PROTECTED)
              (Hanya bisa diakses setelah Login)
          ========================================= */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tree" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FamilyTreePage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/members" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Members />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gallery" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Gallery />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;