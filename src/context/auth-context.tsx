
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';


interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin') => Promise<void>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateCurrentUserCredits: (newCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This sanitization is ONLY for creating a valid email string for Firebase Auth.
// The actual username stored in the database should retain its original casing.
const sanitizeUsernameForEmail = (username: string) => {
    return username.trim().toLowerCase();
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const isLoading = authLoading || isFirestoreLoading;
  const isAuthenticated = !authLoading && !!firebaseUser && !!currentUser;

  useEffect(() => {
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setCurrentUser(doc.data() as User);
        } else {
          // This case can happen if a user is deleted from Firestore but not from Auth
          setCurrentUser(null);
          signOut(auth);
        }
        setIsFirestoreLoading(false);
      }, (error) => {
        console.error("Error listening to user document:", error);
        toast({ title: "Erro de Conexão", description: "Não foi possível sincronizar seus dados.", variant: "destructive" });
        setIsFirestoreLoading(false);
      });

      return () => unsubscribe();
    } else {
      setCurrentUser(null);
      setIsFirestoreLoading(false);
    }
  }, [firebaseUser, toast]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !currentUser) return;

    const redirectPath = searchParams.get('redirect');
    if (redirectPath) {
        if ( (redirectPath.includes('admin') && currentUser.role !== 'admin') ||
             (redirectPath.includes('cliente') && currentUser.role !== 'cliente') ||
             (redirectPath.includes('vendedor') && currentUser.role !== 'vendedor') ) 
        {
          toast({ title: "Acesso Negado", description: `Você não tem permissão para acessar essa área.`, variant: "destructive" });
          router.push('/'); 
        } else {
          router.push(redirectPath);
        }
    } else {
        // Default redirection logic after login if no redirect param is present
        switch(currentUser.role) {
            case 'admin':
                router.push('/admin');
                break;
            case 'cliente':
                router.push('/cliente');
                break;
            case 'vendedor':
                router.push('/vendedor');
                break;
            default:
                router.push('/');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, currentUser, router, searchParams]);


  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin') => {
     // Sanitize username to create the email, but keep original username for checks if needed.
     const emailUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${emailUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const fbUser = userCredential.user;
        
        // Directly get user data from Firestore using the authenticated user's UID.
        // This is the most reliable way.
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          
          if (expectedRole && userData.role !== expectedRole) {
              toast({ title: "Acesso Negado", description: `As credenciais são válidas, mas não para um perfil de ${expectedRole}.`, variant: "destructive" });
              await signOut(auth);
              return;
          }
           toast({ title: `Login como ${userData.username} bem-sucedido!`, description: "Redirecionando...", className: "bg-primary text-primary-foreground", duration: 2000 });
           // The useEffect above will handle redirection.
        } else {
          // This is a failsafe, should not happen in normal flow.
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados após autenticação.", variant: "destructive" });
          await signOut(auth);
        }
     } catch (error: any) {
        console.error("Firebase login error:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else {
            toast({ title: "Erro de Login", description: error.message || "Ocorreu um erro inesperado.", variant: "destructive" });
        }
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
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => {
    const originalUsername = username.trim();
    const emailUsername = sanitizeUsernameForEmail(originalUsername);

    if (!emailUsername) {
        toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido.", variant: "destructive" });
        return;
    }

    // Check if username already exists in Firestore (case-insensitive)
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", originalUsername));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        toast({ title: "Erro de Cadastro", description: "Este nome de usuário já está em uso.", variant: "destructive" });
        return;
    }

    const fakeEmail = `${emailUsername}@bolao.potiguar`;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, passwordRaw);
        const newFirebaseUser = userCredential.user;

        const newUser: User = {
            id: newFirebaseUser.uid,
            username: originalUsername, // Store the original username
            role,
            createdAt: new Date().toISOString(),
            saldo: role === 'cliente' ? 50 : 0,
        };
        
        await setDoc(doc(db, "users", newFirebaseUser.uid), newUser);

        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        await signOut(auth); // Force user to log in after registering
        router.push('/login');

    } catch (error: any) {
        console.error("Firebase registration error:", error);
        // The username check above handles this, but this is a fallback.
        if (error.code === 'auth/email-already-in-use') {
            toast({ title: "Erro de Cadastro", description: "Este nome de usuário já está em uso.", variant: "destructive" });
        } else if (error.code === 'auth/weak-password') {
            toast({ title: "Erro de Cadastro", description: "A senha é muito fraca. Use pelo menos 6 caracteres.", variant: "destructive" });
        } else {
            toast({ title: "Erro de Cadastro", description: error.message || "Ocorreu um erro inesperado ao se registrar.", variant: "destructive" });
        }
    }
  }, [router, toast]);


  const updateCurrentUserCredits = (newCredits: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, saldo: newCredits });
    }
  };
  
  const value = { currentUser, login, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
