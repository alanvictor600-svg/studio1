
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';


interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin') => Promise<boolean>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateCurrentUserCredits: (newCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to sanitize username for Firebase email compatibility
const sanitizeUsernameForEmail = (username: string) => {
    // Firebase emails are sensitive. Let's allow letters, numbers, and specific chars.
    // Replace any character that is NOT a letter, number, period, underscore, or hyphen.
    return username.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const isLoading = authLoading || isFirestoreLoading;
  
  const fetchUserDocument = useCallback(async (user: import('firebase/auth').User) => {
    const userDocRef = doc(db, "users", user.uid);
    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return userDoc.data() as User;
        }
    } catch (e) {
        console.error("Error fetching user document: ", e);
    }
    return null;
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      if (authLoading) {
        setIsFirestoreLoading(true);
        return;
      }
      if (authError) {
        console.error("Firebase Auth Error:", authError);
        toast({ title: "Erro de Autenticação", description: "Ocorreu um problema ao verificar sua identidade.", variant: "destructive"});
        setCurrentUser(null);
        setIsFirestoreLoading(false);
        return;
      }
      if (firebaseUser) {
        const userData = await fetchUserDocument(firebaseUser);
        if (userData) {
          setCurrentUser(userData);
          const redirectPath = searchParams.get('redirect');
          if (redirectPath) {
             if ((redirectPath.includes('admin') && userData.role !== 'admin') ||
                (redirectPath.includes('cliente') && userData.role !== 'cliente') ||
                (redirectPath.includes('vendedor') && userData.role !== 'vendedor')) 
             {
                toast({ title: "Acesso Negado", description: `Você não tem permissão para acessar essa área.`, variant: "destructive" });
                router.push('/'); 
             } else {
                router.push(redirectPath);
             }
          }
        } else {
          toast({ title: "Erro de Perfil", description: "Não foi possível encontrar os dados do seu perfil.", variant: "destructive" });
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsFirestoreLoading(false);
    };
    checkUser();
  }, [firebaseUser, authLoading, authError, toast, router, searchParams, fetchUserDocument]);


  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin'): Promise<boolean> => {
     const sanitizedUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${sanitizedUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const fbUser = userCredential.user;
        const userData = await fetchUserDocument(fbUser);
        
        if (userData && expectedRole && userData.role !== expectedRole) {
            toast({ title: "Acesso Negado", description: `As credenciais são válidas, mas não para um perfil de ${expectedRole}.`, variant: "destructive" });
            await signOut(auth); // Sign out the user
            return false;
        }

        // The useEffect will now handle setting the user and redirecting.
        return true;
     } catch (error: any) {
        console.error("Firebase login error:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else {
            toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado.", variant: "destructive" });
        }
        return false;
     }
  }, [toast, fetchUserDocument]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível fazer o logout. Tente novamente.", variant: "destructive" });
    }
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido. Use apenas letras, números e os caracteres: . - _", variant: "destructive" });
         return false;
    }
    const sanitizedUsername = sanitizeUsernameForEmail(username);
    const fakeEmail = `${sanitizedUsername}@bolao.potiguar`;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, passwordRaw);
        const newFirebaseUser = userCredential.user;

        const newUser: User = {
            id: newFirebaseUser.uid,
            username: sanitizedUsername, // Save the sanitized username
            role,
            createdAt: new Date().toISOString(),
            saldo: role === 'cliente' ? 50 : 0,
        };
        
        await setDoc(doc(db, "users", newFirebaseUser.uid), newUser);

        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        router.push('/login');
        return true;

    } catch (error: any) {
        console.error("Firebase registration error:", error);
        if (error.code === 'auth/email-already-in-use') {
            toast({ title: "Erro de Cadastro", description: "Este nome de usuário já está em uso.", variant: "destructive" });
        } else if (error.code === 'auth/weak-password') {
            toast({ title: "Erro de Cadastro", description: "A senha é muito fraca. Use pelo menos 6 caracteres.", variant: "destructive" });
        } else {
            toast({ title: "Erro de Cadastro", description: "Ocorreu um erro inesperado ao se registrar.", variant: "destructive" });
        }
        return false;
    }
  }, [router, toast]);


  const updateCurrentUserCredits = async (newCredits: number) => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.id);
      try {
        await updateDoc(userDocRef, { saldo: newCredits });
        setCurrentUser({ ...currentUser, saldo: newCredits });
      } catch (error) {
        console.error("Error updating user credits in Firestore:", error);
        toast({ title: "Erro", description: "Não foi possível atualizar seu saldo.", variant: "destructive" });
      }
    }
  };

  const isAuthenticated = !isLoading && !!currentUser;
  
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
