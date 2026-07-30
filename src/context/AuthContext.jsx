import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        return await signInWithEmailAndPassword(auth, email, password);
    };

    // Menerima parameter username, menyimpannya ke Firebase Profile dan Firestore 'users'
    const register = async (email, password, username) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (username) {
            // Simpan ke Firebase Auth Profile
            await updateProfile(user, {
                displayName: username
            });

            // Simpan juga ke Firestore collection 'users' agar bisa dicari saat login pakai username
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                username: username,
                email: email,
                createdAt: new Date().toISOString()
            });
        }
        return userCredential;
    };

    const logout = async () => {
        return await signOut(auth);
    };

    const value = {
        currentUser,
        isLoggedIn: !!currentUser,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}