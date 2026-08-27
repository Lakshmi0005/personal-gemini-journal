import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  FirebaseUser, 
  signInWithPopup, 
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  fbSignOut,
  getIdToken
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (err) => {
      console.error("Auth state observer error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Email login error:", err);
      setError(err.message || 'Invalid email or password');
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Email signup error:", err);
      setError(err.message || 'Failed to create account');
      throw err;
    }
  };

  const loginAsGuest = async () => {
    try {
      setError(null);
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Guest login error:", err);
      setError(err.message || 'Failed to sign in as guest');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await fbSignOut(auth);
    } catch (err: any) {
      console.error("Sign out error:", err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const getToken = async () => {
    return await getIdToken();
  };

  const userProfile: UserProfile | null = user ? {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.isAnonymous ? 'Guest Explorer' : user.email?.split('@')[0] || 'Journaler'),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
    lastLoginAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).getTime() : Date.now(),
  } : null;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      signInWithGoogle,
      loginWithEmail,
      signupWithEmail,
      loginAsGuest,
      logout,
      getToken,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
