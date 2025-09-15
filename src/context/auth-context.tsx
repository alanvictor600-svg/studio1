
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';


interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin') => Promise<boolean>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateCurrentUserCredits: (newCredits: number) => Promise<void>;
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
  
  // This useEffect handles listening for real-time updates to the current user's document
  useEffect(() => {
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setCurrentUser(doc.data() as User);
        } else {
          // This case might happen if the user is deleted from Firestore but not from Auth
          setCurrentUser(null);
        }
        if(isFirestoreLoading) setIsFirestoreLoading(false);
      }, (error) => {
        console.error("Error listening to user document:", error);
        toast({ title: "Erro de Conexão", description: "Não foi possível sincronizar seus dados.", variant: "destructive" });
        setIsFirestoreLoading(false);
      });

      return () => unsubscribe(); // Cleanup the listener on unmount or user change
    } else {
      // No firebaseUser, so not loading and no current user
      setCurrentUser(null);
      setIsFirestoreLoading(false);
    }
  }, [firebaseUser, toast, isFirestoreLoading]);

  // This useEffect handles the initial auth check and redirection logic
  useEffect(() => {
    if (authLoading) return; // Wait until Firebase Auth is ready

    if (authError) {
      console.error("Firebase Auth Error:", authError);
      toast({ title: "Erro de Autenticação", description: "Ocorreu um problema ao verificar sua identidade.", variant: "destructive"});
      return;
    }

    if (firebaseUser && currentUser) { // Check both Firebase user and Firestore data
        const redirectPath = searchParams.get('redirect');
        if (redirectPath) {
            if ((redirectPath.includes('admin') && currentUser.role !== 'admin') ||
              (redirectPath.includes('cliente') && currentUser.role !== 'cliente') ||
              (redirectPath.includes('vendedor') && currentUser.role !== 'vendedor')) 
            {
              toast({ title: "Acesso Negado", description: `Você não tem permissão para acessar essa área.`, variant: "destructive" });
              router.push('/'); 
            } else {
              router.push(redirectPath);
            }
        }
    }
  }, [firebaseUser, currentUser, authLoading, authError, router, searchParams, toast]);


  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin'): Promise<boolean> => {
     const sanitizedUsername = sanitizeUsernameForEmail(username);
     const fakeEmail = `${sanitizedUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const fbUser = userCredential.user;
        
        // After sign-in, we need to fetch the user doc to check the role
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          if (expectedRole && userData.role !== expectedRole) {
              toast({ title: "Acesso Negado", description: `As credenciais são válidas, mas não para um perfil de ${expectedRole}.`, variant: "destructive" });
              await signOut(auth); // Sign out the user
              return false;
          }
        } else {
          // This should ideally not happen if registration is done correctly
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados.", variant: "destructive" });
          await signOut(auth);
          return false;
        }

        // The useEffects will now handle setting the user state and redirecting.
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
  }, [toast]);

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
    // This function can now just update the local state.
    // The server is the source of truth, and the onSnapshot listener will
    // automatically catch the update from the server transaction.
    // However, for immediate UI feedback, we can optimistically update the state.
    if (currentUser) {
      setCurrentUser({ ...currentUser, saldo: newCredits });
      // No need to write to Firestore here, the server flow does it.
    }
  };

  const isAuthenticated = !isLoading && !!currentUser && !!firebaseUser;
  
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
