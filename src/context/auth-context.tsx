"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, LotteryConfig } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase-client';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { RoleSelectionDialog } from '@/components/role-selection-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null | undefined; 
  login: (username: string, passwordAttempt: string) => Promise<void>;
  signInWithGoogle: (role?: 'cliente' | 'vendedor') => Promise<void>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  lotteryConfig: LotteryConfig | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUsernameForEmail = (username: string) => {
    return username.trim().toLowerCase();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);

  const isAuthenticated = !authLoading && !!firebaseUser && !!currentUser;
  const isLoading = authLoading || isFirestoreLoading;

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    if (firebaseUser) {
        setIsFirestoreLoading(true);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        userUnsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setCurrentUser({ id: doc.id, ...doc.data() } as User);
            } else {
              // This can happen during sign up process
              if (!isRoleSelectionOpen) {
                  setCurrentUser(null);
              }
            }
            setIsFirestoreLoading(false);
        }, (error) => {
            const contextualError = new FirestorePermissionError({
              operation: 'get',
              path: userDocRef.path,
            });
            console.error("Error listening to user document:", contextualError);
            errorEmitter.emit('permission-error', contextualError);
            setIsFirestoreLoading(false);
        });
    } else {
        setCurrentUser(null);
        setIsFirestoreLoading(false);
    }

    const configDocRef = doc(db, 'configs', 'global');
    const configUnsubscribe = onSnapshot(configDocRef, (doc) => {
        if (doc.exists()) {
            setLotteryConfig(doc.data() as LotteryConfig);
        }
    });

    return () => {
        if(userUnsubscribe) userUnsubscribe();
        configUnsubscribe();
    };
  }, [firebaseUser, isRoleSelectionOpen]);

  const login = useCallback(async (username: string, passwordAttempt: string) => {
     const emailUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${emailUsername}@bolao.potiguar`;
     try {
        await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
     } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else {
             console.error("Firebase login error:", error.code, error.message);
             toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
        }
        throw error;
     }
  }, [toast]);

  const handleRoleSelectedForNewUser = async (role: 'cliente' | 'vendedor') => {
    if (!pendingGoogleUser) return;
    
    const user = pendingGoogleUser;
    const userDocRef = doc(db, "users", user.uid);

    try {
        const newUser: User = {
            id: user.uid,
            username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`,
            role: role,
            createdAt: new Date().toISOString(),
            saldo: 0,
        };
        await setDoc(userDocRef, newUser);
        setCurrentUser(newUser); // Optimistically set current user
        toast({ title: "Cadastro Concluído!", description: "Bem-vindo ao Bolão Potiguar!", className: "bg-primary text-primary-foreground" });
    } catch(e) {
        console.error("Error creating new user document:", e);
        toast({ title: "Erro no Cadastro", description: "Não foi possível criar sua conta.", variant: "destructive" });
    } finally {
        setIsRoleSelectionOpen(false);
        setPendingGoogleUser(null);
    }
  };


  const signInWithGoogle = useCallback(async (role?: 'cliente' | 'vendedor') => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          if (role) {
             const newUser: User = {
                id: user.uid,
                username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`,
                role: role,
                createdAt: new Date().toISOString(),
                saldo: 0,
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          } else {
            setPendingGoogleUser(user);
            setIsRoleSelectionOpen(true);
          }
        }
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            toast({ title: "Erro de Login", description: "Já existe uma conta com este e-mail. Tente fazer login com outro método.", variant: "destructive", duration: 5000 });
        } else if (error.code === 'auth/popup-closed-by-user') {
            // User closed popup, do nothing.
        } else {
            console.error("Google Sign-In Error:", error);
            toast({ title: "Erro de Login", description: "Não foi possível fazer login com o Google. Tente novamente.", variant: "destructive" });
        }
        throw error;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível fazer o logout. Tente novamente.", variant: "destructive" });
    }
  }, [toast, router]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => {
    const originalUsername = username.trim();
     if (!/^[a-zA-Z0-9_.-]+$/.test(originalUsername)) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido.", variant: "destructive" });
         return;
    }
    const emailUsername = sanitizeUsernameForEmail(originalUsername);
    const fakeEmail = `${emailUsername}@bolao.potiguar`;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, passwordRaw);
        const newFirebaseUser = userCredential.user;
        const newUser: User = {
            id: newFirebaseUser.uid,
            username: originalUsername, 
            role,
            createdAt: new Date().toISOString(),
            saldo: 0,
        };
        await setDoc(doc(db, "users", newFirebaseUser.uid), newUser);
        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        await signOut(auth);
        router.push('/login');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({ title: "Erro de Cadastro", description: "Este nome de usuário já está em uso.", variant: "destructive" });
        } else if (error.code === 'auth/weak-password') {
            toast({ title: "Erro de Cadastro", description: "A senha é muito fraca. Use pelo menos 6 caracteres.", variant: "destructive" });
        } else {
            console.error("Firebase registration error:", error);
            toast({ title: "Erro de Cadastro", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
        }
        throw error;
    }
  }, [router, toast]);
  
  const value = { currentUser, firebaseUser, login, signInWithGoogle, logout, register, isLoading, isAuthenticated, lotteryConfig };

  return (
    <AuthContext.Provider value={value}>
      {children}
       <RoleSelectionDialog
        isOpen={isRoleSelectionOpen}
        onOpenChange={setIsRoleSelectionOpen}
        onRoleSelect={handleRoleSelectedForNewUser}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
