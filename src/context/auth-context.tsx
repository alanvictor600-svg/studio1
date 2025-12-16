
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
// Importa diretamente do módulo de cliente do Firebase
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';


interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, loginAs?: 'admin', redirectPath?: string | null) => Promise<void>;
  signInWithGoogle: (role: 'cliente' | 'vendedor', redirectPath?: string | null) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const isAuthenticated = !isLoading && !!currentUser;

  useEffect(() => {
    // onAuthStateChanged é seguro de ser chamado aqui porque a importação de `auth`
    // vem de um módulo que é garantido de rodar apenas no cliente.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setCurrentUser({ id: doc.id, ...doc.data() } as User);
          } else {
            // O usuário existe no Auth mas não no Firestore, desloga para evitar inconsistência.
            signOut(auth);
            setCurrentUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          signOut(auth);
          setCurrentUser(null);
          setIsLoading(false);
        });
        
        return () => unsubscribeSnapshot();
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    }, (error) => {
        console.error("Firebase Auth State Error:", error);
        setCurrentUser(null);
        setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (username: string, passwordAttempt: string, loginAs?: 'admin', redirectPath?: string | null) => {
     const emailUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${emailUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const fbUser = userCredential.user;
        
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          
          if(loginAs === 'admin' && userData.role !== 'admin') {
            await signOut(auth);
            toast({ title: "Acesso Negado", description: "Este usuário não tem permissões de administrador.", variant: "destructive" });
            return;
          }

           toast({ title: `Login como ${userData.username} bem-sucedido!`, description: "Redirecionando...", className: "bg-primary text-primary-foreground", duration: 2000 });
           
           const targetPath = redirectPath && redirectPath !== pathname ? redirectPath : (userData.role === 'admin' ? '/admin' : `/dashboard/${userData.role}`);
           router.replace(targetPath);
        } else {
          await signOut(auth);
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados após autenticação.", variant: "destructive" });
        }
     } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else {
             // Generic error for other cases, including connectivity issues like 'unavailable'
             toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.", variant: "destructive" });
        }
        throw error;
     }
  }, [toast, router, pathname]);

  const signInWithGoogle = useCallback(async (role: 'cliente' | 'vendedor', redirectPath?: string | null) => {
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
        
        const targetPath = redirectPath && redirectPath !== pathname ? redirectPath : (finalRole === 'admin' ? '/admin' : `/dashboard/${finalRole}`);
        router.replace(targetPath);

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
  }, [router, toast, pathname]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
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
    }
  }, [router, toast]);

  const updateCurrentUserCredits = (newCredits: number) => {
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
