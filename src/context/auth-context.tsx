
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
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
        setIsFirestoreLoading(true);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setCurrentUser({ id: doc.id, ...doc.data() } as User);
            } else {
              // This can happen briefly during logout or if user is deleted from Firestore but not Auth.
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
        // If there's no Firebase user, ensure local state is also cleared
        setCurrentUser(null);
        setIsFirestoreLoading(false);
    }
  }, [firebaseUser, toast]);

  const login = useCallback(async (username: string, passwordAttempt: string, loginAs?: 'admin') => {
     const emailUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${emailUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const fbUser = userCredential.user;
        
        // After signIn, the useEffect hook will run and set the currentUser.
        // We need to fetch the document directly here to get the role for immediate redirection.
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          
          if(loginAs === 'admin' && userData.role !== 'admin') {
            await signOut(auth); // Sign out if trying to log in as admin without permission
            toast({ title: "Acesso Negado", description: "Este usuário não tem permissões de administrador.", variant: "destructive" });
            return;
          }

           toast({ title: `Login como ${userData.username} bem-sucedido!`, description: "Redirecionando...", className: "bg-primary text-primary-foreground", duration: 2000 });
           
           // Handle redirection logic inside the successful login
           const redirectPath = searchParams.get('redirect');
           
           if (redirectPath && redirectPath !== '/') {
             router.replace(redirectPath);
           } else {
             // Default redirection based on role
             router.replace(userData.role === 'admin' ? '/admin' : `/dashboard/${userData.role}`);
           }
        } else {
          // This case should be rare if user creation is robust
          await signOut(auth);
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados após autenticação.", variant: "destructive" });
        }
     } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else if (error.code === 'auth/api-key-expired') {
            toast({ title: "Chave de API Expirada", description: "A chave de configuração do Firebase expirou. Verifique o arquivo .env.", variant: "destructive", duration: 6000 });
        } else {
             console.error("Firebase login error:", error.code, error.message);
             toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
        }
        // Rethrow to allow component to stop loading state
        throw error;
     }
  }, [toast, router, searchParams]);

  const signInWithGoogle = useCallback(async (role: 'cliente' | 'vendedor') => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        let finalRole: User['role'] = role;
        let finalUsername = user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`;

        if (userDoc.exists()) {
            const existingUserData = userDoc.data() as User;
            finalRole = existingUserData.role;
            finalUsername = existingUserData.username;
            toast({ title: `Bem-vindo(a) de volta, ${finalUsername}!`, description: "Redirecionando...", className: "bg-primary text-primary-foreground", duration: 2000 });
        } else {
            const newUser: User = {
                id: user.uid,
                username: finalUsername,
                role: finalRole,
                createdAt: new Date().toISOString(),
                saldo: 0,
            };
            await setDoc(userDocRef, newUser);
            toast({ title: "Conta criada com sucesso!", description: "Bem-vindo(a) ao Bolão Potiguar!", className: "bg-primary text-primary-foreground", duration: 3000 });
        }
        
        const redirectPath = searchParams.get('redirect');
        
        if (redirectPath && redirectPath !== '/') {
            router.replace(redirectPath);
        } else {
            router.replace(finalRole === 'admin' ? '/admin' : `/dashboard/${finalRole}`);
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
         // Rethrow to allow component to stop loading state
        throw error;
    }
  }, [router, toast, searchParams]);


  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Let the useEffect handle state changes, but force a redirect to be safe.
      router.push('/');
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
        await signOut(auth); // Sign out the new user so they have to log in
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
    // Directly update the state to ensure UI is always in sync.
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, saldo: newCredits };
    });
  };
  
  const value = { currentUser, login, signInWithGoogle, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
