
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Suspense } from 'react';
import type { User } from '@/types';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';


interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, loginAs?: 'admin') => Promise<void>;
  signInWithGoogle: (role: 'cliente' | 'vendedor') => Promise<void>;
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

// Este é o componente filho que usará os hooks que precisam de Suspense.
function AuthProviderContent({ children }: { children: ReactNode }) {
    const authContextValue = useAuthContextValue();
    const router = useRouter();
    const pathname = usePathname();
    const { currentUser, isAuthenticated, isLoading } = authContextValue;

    useEffect(() => {
        if (isLoading) {
            return; // Don't do anything while loading
        }
        
        // If user is authenticated
        if (isAuthenticated && currentUser) {
            const isLoginPage = pathname.startsWith('/login');
            const isRegisterPage = pathname.startsWith('/cadastrar');
            const targetDashboardPath = currentUser.role === 'admin' ? '/admin' : `/dashboard/${currentUser.role}`;

            // If user is on login/register page, redirect them to their dashboard.
            if (isLoginPage || isRegisterPage) {
                router.replace(targetDashboardPath);
            }
        } 
        // If user is not authenticated
        else {
            // Protect admin and dashboard routes
            const isAdminRoute = pathname.startsWith('/admin');
            const isDashboardRoute = pathname.startsWith('/dashboard');
            
            if (isAdminRoute || isDashboardRoute) {
                router.replace('/login');
            }
        }
    }, [isLoading, isAuthenticated, currentUser, pathname, router]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
}


// Este é o provedor principal que envolve a aplicação.
export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <Suspense>
            <AuthProviderContent>
                {children}
            </AuthProviderContent>
        </Suspense>
    );
}


function useAuthContextValue(): AuthContextType {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const isAuthenticated = !authLoading && !!firebaseUser && !!currentUser;
  const isLoading = authLoading || (!!firebaseUser && isFirestoreLoading);

  useEffect(() => {
    if (authError) {
      console.error("Firebase Auth Hook Error:", authError);
    }
  }, [authError]);

  useEffect(() => {
    if (firebaseUser) {
        setIsFirestoreLoading(true);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setCurrentUser({ id: doc.id, ...doc.data() } as User);
            } else {
              // This can happen if the user is deleted from Firestore but not Auth
              setCurrentUser(null); 
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

  const login = useCallback(async (username: string, passwordAttempt: string, loginAs?: 'admin') => {
     const emailUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${emailUsername}@bolao.potiguar`;

     try {
        await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        // The redirection is now handled by the useEffect in AuthProviderContent
     } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else if (error.code === 'auth/api-key-expired') {
            toast({ title: "Chave de API Expirada", description: "A chave de configuração do Firebase expirou. Verifique o arquivo .env.", variant: "destructive", duration: 6000 });
        } else {
             console.error("Firebase login error:", error.code, error.message);
             toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
        }
        throw error;
     }
  }, [toast]);

  const signInWithGoogle = useCallback(async (role: 'cliente' | 'vendedor') => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            const newUser: User = {
                id: user.uid,
                username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`,
                role: role,
                createdAt: new Date().toISOString(),
                saldo: 0,
            };
            await setDoc(userDocRef, newUser);
        }
        // Redirection will be handled by the main useEffect
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
    router.push('/');
    try {
      await signOut(auth);
      setCurrentUser(null);
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível fazer o logout. Tente novamente.", variant: "destructive" });
    }
  }, [toast, router]);


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


  const updateCurrentUserCredits = (newCredits: number) => {
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, saldo: newCredits };
    });
  };
  
  return { currentUser, login, signInWithGoogle, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits };
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
