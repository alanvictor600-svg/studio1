
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, writeBatch, getFirestore } from 'firebase/firestore';
import { RoleSelectionDialog } from '@/components/role-selection-dialog';
import { useFirebase } from '@/firebase/client-provider';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null | undefined; 
  login: (username: string, passwordAttempt: string) => Promise<void>;
  signInWithGoogle: (role?: 'cliente' | 'vendedor') => Promise<void>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUsernameForEmail = (username: string) => {
    return username.trim().toLowerCase();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { firebaseApp } = useFirebase();
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);

  const isAuthenticated = !authLoading && !!firebaseUser && !!currentUser;
  const isLoading = authLoading || (!!firebaseUser && isFirestoreLoading);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    
    if (authLoading) {
      setIsFirestoreLoading(true);
      return;
    }

    if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        userUnsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const userData = doc.data();
              if (userData) {
                setCurrentUser({ id: doc.id, ...userData } as User);
              } else {
                setCurrentUser(null);
              }
            } else {
              setCurrentUser(null);
            }
            setIsFirestoreLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            toast({ title: "Erro de Conexão", description: "Não foi possível carregar os dados do usuário.", variant: "destructive" });
            setIsFirestoreLoading(false);
        });
    } else {
        setCurrentUser(null);
        setIsFirestoreLoading(false);
    }

    return () => {
        if(userUnsubscribe) userUnsubscribe();
    };
  }, [firebaseUser, authLoading, toast, db]);

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
  }, [toast, auth]);

  const handleRoleSelectedForNewUser = async (role: 'cliente' | 'vendedor') => {
    if (!pendingGoogleUser) return;
    
    const user = pendingGoogleUser;
    const username = user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`;
    const emailUsername = sanitizeUsernameForEmail(username);
    
    const userDocRef = doc(db, "users", user.uid);
    const userCheckRef = doc(db, "users_username_lookup", emailUsername);
    
    try {
        const userCheckDoc = await getDoc(userCheckRef);
        if (userCheckDoc.exists()) {
            toast({ title: "Erro no Cadastro", description: `O nome de usuário '${username}' já está em uso.`, variant: "destructive" });
            await signOut(auth); // Log out the user to allow them to try again
            return;
        }

        const batch = writeBatch(db);
        const newUser: User = {
            id: user.uid,
            username: username,
            role: role,
            createdAt: new Date().toISOString(),
            saldo: 0,
        };
        batch.set(userDocRef, newUser);
        batch.set(userCheckRef, { userId: user.uid });
        await batch.commit();

        setCurrentUser(newUser); 
        toast({ title: "Cadastro Concluído!", description: "Bem-vindo ao Bolão Potiguar!", className: "bg-primary text-primary-foreground" });
    } catch(e) {
        console.error("Error creating new user document:", e);
        toast({ title: "Erro no Cadastro", description: "Não foi possível criar sua conta.", variant: "destructive" });
        await signOut(auth);
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
          const username = user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`;
          const emailUsername = sanitizeUsernameForEmail(username);
          const userCheckRef = doc(db, "users_username_lookup", emailUsername);
          
          if (role) {
             const userCheckDoc = await getDoc(userCheckRef);
             if (userCheckDoc.exists()) {
                toast({ title: "Erro de Cadastro", description: "Um usuário com um nome similar já existe. Por favor, cadastre-se com e-mail e senha para escolher um nome de usuário único.", variant: "destructive", duration: 7000 });
                await signOut(auth);
                throw new Error("Username already exists");
             }
             const newUser: User = {
                id: user.uid,
                username: username,
                role: role,
                createdAt: new Date().toISOString(),
                saldo: 0,
            };
            const batch = writeBatch(db);
            batch.set(userDocRef, newUser);
            batch.set(userCheckRef, { userId: user.uid });
            await batch.commit();

            setCurrentUser(newUser); // Optimistic update
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
        } else if (error.message !== "Username already exists") {
            console.error("Google Sign-In Error:", error);
            toast({ title: "Erro de Login", description: "Não foi possível fazer login com o Google. Tente novamente.", variant: "destructive" });
        }
        throw error;
    }
  }, [toast, auth, db]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      router.push('/');
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível fazer o logout. Tente novamente.", variant: "destructive" });
    }
  }, [toast, router, auth]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => {
    const originalUsername = username.trim();
     if (!/^[a-zA-Z0-9_.-]+$/.test(originalUsername)) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido.", variant: "destructive" });
         throw new Error("Invalid username");
    }
    const emailUsername = sanitizeUsernameForEmail(originalUsername);
    const fakeEmail = `${emailUsername}@bolao.potiguar`;
    
    const userCheckRef = doc(db, "users_username_lookup", emailUsername);
    
    try {
        const userCheckDoc = await getDoc(userCheckRef);
        if (userCheckDoc.exists()) {
            toast({ title: "Erro de Cadastro", description: "Este nome de usuário já está em uso.", variant: "destructive" });
            throw new Error("Username already exists");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, passwordRaw);
        const newFirebaseUser = userCredential.user;
        
        const newUser: User = {
            id: newFirebaseUser.uid,
            username: originalUsername, 
            role,
            createdAt: new Date().toISOString(),
            saldo: 0,
        };
        
        const batch = writeBatch(db);
        batch.set(doc(db, "users", newFirebaseUser.uid), newUser);
        batch.set(userCheckRef, { userId: newFirebaseUser.uid });
        
        await batch.commit();

        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        await signOut(auth);
        router.push('/login');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
             toast({ title: "Erro de Cadastro", description: "Este nome de usuário já está em uso.", variant: "destructive" });
        } else if (error.code === 'auth/weak-password') {
            toast({ title: "Erro de Cadastro", description: "A senha é muito fraca. Use pelo menos 6 caracteres.", variant: "destructive" });
        } else if (!["Username already exists", "Invalid username"].includes(error.message)) {
            console.error("Firebase registration error:", error);
            toast({ title: "Erro de Cadastro", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
        }
        throw error;
    }
  }, [router, toast, auth, db]);
  
  const value = { currentUser, firebaseUser, login, signInWithGoogle, logout, register, isLoading, isAuthenticated };

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

    