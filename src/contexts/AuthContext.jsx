import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase Auth user object
  const [userData, setUserData] = useState(null); // { loginId, alias, role, active }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);

      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (!userSnap.exists()) {
          // Auth account exists but no user doc — treat as invalid, sign out.
          await firebaseSignOut(auth);
          setUser(null);
          setUserData(null);
          setError('No account record found. Contact your admin.');
          setLoading(false);
          return;
        }

        const data = userSnap.data();

        if (data.active !== true) {
          await firebaseSignOut(auth);
          setUser(null);
          setUserData(null);
          setError('This account has been disabled. Contact your admin.');
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
        setUserData(data);
      } catch (e) {
        setError('Failed to load account. Try again.');
        setUser(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = () => firebaseSignOut(auth);

  const value = {
    user,
    userData,
    isAdmin: userData?.role === 'admin',
    isViewer: userData?.role === 'viewer',
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
