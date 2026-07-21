import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { api } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(false);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserData(null);
  };

  const fetchUserData = async (user) => {
    try {
      const data = await api.syncUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data from MongoDB API:', error);
      // Fallback local profile structure if API is not fully up yet
      setUserData({
        uid: user.uid,
        displayName: user.displayName || 'مستثمر جديد',
        email: user.email,
        photoURL: user.photoURL || '',
        phone: '',
        role: 'user',
        balance: 35,
        investments: 0,
        profits: 0,
      });
    }
  };

  const refreshUserData = async () => {
    if (!currentUser) return;
    setUserDataLoading(true);
    try {
      await fetchUserData(currentUser);
    } finally {
      setUserDataLoading(false);
    }
  };

  const updatePhone = async (phone) => {
    if (!currentUser) throw new Error('No authenticated user');
    const updatedUser = await api.updatePhone(currentUser.uid, phone);
    setUserData(updatedUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserDataLoading(true);
        try {
          await fetchUserData(user);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setUserDataLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // تتبع حالة الاتصال بالإنترنت (Online Presence) في الوقت الفعلي
  useEffect(() => {
    if (!currentUser) return;

    const updatePresence = async (status) => {
      try {
        await api.updatePresence(currentUser.uid, status);
      } catch {
        // قد يفشل إذا كان المستخدم يسجل الخروج
      }
    };

    // تحديث فوري للحالة كنشط
    updatePresence(true);

    // تحديث دوري كل 20 ثانية لتأكيد النشاط
    const interval = setInterval(() => {
      updatePresence(true);
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence(true);
      } else {
        updatePresence(false);
      }
    };

    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence(false);
    };
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        setUserData,
        loading,
        userDataLoading,
        signInWithGoogle,
        logout,
        updatePhone,
        refreshUserData,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

