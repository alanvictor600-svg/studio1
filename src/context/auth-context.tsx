
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';


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

const sanitizeUsernameForEmail = (username: string) => {
    return username.trim().toLowerCase();
};

const AUTH_COOKIE_NAME = '__session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const isAuthenticated = !authLoading && !!firebaseUser && !!currentUser;
  const isLoading = authLoading || isFirestoreLoading;

  useEffect(() => {
    if (authError) {
      console.error("Firebase Auth Hook Error:", authError);
    }
  }, [authError]);

  useEffect(() => {
    if (firebaseUser) {
        // This is a simplified mechanism for the middleware.
        // In a production app with server-side rendering, you'd use HttpOnly cookies set by a server.
        document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=2592000`; // 30 days

        setIsFirestoreLoading(true);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setCurrentUser({ id: doc.id, ...doc.data() } as User);
            } else {
              console.error("User document not found for authenticated user:", firebaseUser.uid);
              // If user is authenticated but has no DB record, something is wrong. Log them out.
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
        // If there's no Firebase user, ensure the session cookie is removed and state is cleared.
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
        setCurrentUser(null);
        setIsFirestoreLoading(false);
    }
  }, [firebaseUser, toast]);

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin') => {
     const emailUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${emailUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const fbUser = userCredential.user;
        
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          
          if (expectedRole && userData.role !== expectedRole) {
              await signOut(auth); // This will trigger the useEffect to clear cookies
              toast({ title: "Acesso Negado", description: `As credenciais são válidas, mas não para um perfil de ${expectedRole}.`, variant: "destructive" });
              return;
          }
           toast({ title: `Login como ${userData.username} bem-sucedido!`, description: "Redirecionando...", className: "bg-primary text-primary-foreground", duration: 2000 });
           
           const redirectPath = searchParams.get('redirect');
           // The useEffect hook will handle setting the cookie, then we redirect.
           if (redirectPath && redirectPath !== '/') {
             router.push(redirectPath);
           } else {
             router.push(userData.role === 'admin' ? '/admin' : `/dashboard/${userData.role}`);
           }
        } else {
          await signOut(auth);
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados após autenticação.", variant: "destructive" });
        }
     } catch (error: any) {
        if (error.code === 'auth/invalid-credential') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else {
             console.error("Firebase login error:", error.code, error.message);
             toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
        }
     }
  }, [toast, router, searchParams]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // The useEffect observing firebaseUser will handle clearing the cookie and state.
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível fazer o logout. Tente novamente.", variant: "destructive" });
    }
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => {
    const originalUsername = username.trim();
     if (!/^[a-zA-Z0-9_.-]+$/.test(originalUsername)) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido. Use apenas letras (a-z, A-Z), números (0-9) e os caracteres . - _", variant: "destructive" });
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
            saldo: role === 'cliente' ? 50 : 0,
        };
        
        await setDoc(doc(db, "users", newFirebaseUser.uid), newUser);

        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        await signOut(auth); // Log out the user immediately after registration so they have to log in.
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

    