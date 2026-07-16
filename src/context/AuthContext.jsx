import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const basicProfile = {
        uid: user.uid,
        displayName: user.displayName || 'مستثمر جديد',
        email: user.email,
        photoURL: user.photoURL || '',
        phone: '',
        role: 'user',
        balance: 35,
        investments: 0,
        profits: 0,
        depositBonus: 0,
        depositBonusDate: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, basicProfile);

      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      await addDoc(transactionsRef, {
        amount: 35,
        type: 'reward',
        status: 'completed',
        description: 'هدية ترحيبية عند التسجيل',
        createdAt: new Date().toISOString(),
      });

      setUserData(basicProfile);
    } else {
      const raw = userDocSnap.data();
      const basicProfile = {
        ...raw,
        displayName: raw.displayName || raw.name || user.displayName || 'مستثمر',
        balance: raw.balance ?? 35,
        investments: raw.investments ?? 0,
        profits: raw.profits ?? 0,
        depositBonus: raw.depositBonus ?? 0,
        depositBonusDate: raw.depositBonusDate ?? '',
      };

      // إذا كانت الحقول غير موجودة بالداتابيز للمستخدم القديم، نقوم بكتابتها لحفظ التجانس
      if (raw.balance === undefined || raw.investments === undefined || raw.profits === undefined) {
        await setDoc(userDocRef, {
          balance: basicProfile.balance,
          investments: basicProfile.investments,
          profits: basicProfile.profits,
          depositBonus: basicProfile.depositBonus,
          depositBonusDate: basicProfile.depositBonusDate,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      setUserData(basicProfile);
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

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      phone,
      updatedAt: new Date().toISOString(),
    });

    setUserData((prev) => (prev ? { ...prev, phone } : prev));
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
