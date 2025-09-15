
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const isLoading = authLoading || isFirestoreLoading;

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
        // User is signed in with Firebase. Now, fetch their profile from Firestore.
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // This case is unlikely if registration is handled correctly, but good to have.
          // It means user exists in Firebase Auth but not in Firestore 'users' collection.
          toast({ title: "Erro de Perfil", description: "Não foi possível encontrar os dados do seu perfil.", variant: "destructive" });
          auth.signOut(); // Log out the user
          setCurrentUser(null);
        }
      } else {
        // No user is signed in with Firebase.
        setCurrentUser(null);
      }
      setIsFirestoreLoading(false);
    };

    checkUser();
  }, [firebaseUser, authLoading, authError, toast]);


  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin'): Promise<boolean> => {
     const trimmedUsername = username.trim();
     const fakeEmail = `${trimmedUsername}@bolao.potiguar`;

     try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, passwordAttempt);
        const loggedInUser = userCredential.user;

        // The useEffect will handle setting the currentUser based on the Firebase auth state change
        // But we can check the role here for immediate redirection logic.
        const userDocRef = doc(db, "users", loggedInUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // Role verification
            if (expectedRole && userData.role !== expectedRole) {
                toast({ title: "Acesso Negado", description: `Você não tem permissão para acessar a área de ${expectedRole}.`, variant: "destructive" });
                await signOut(auth); // Sign out the user
                return false;
            }

            toast({ title: "Login realizado com sucesso!", description: `Bem-vindo(a) de volta, ${userData.username}!`, className: "bg-primary text-primary-foreground", duration: 3000 });

            const redirectPath = searchParams.get('redirect');
            if (redirectPath) {
                router.push(redirectPath);
            } else {
                // Default redirect based on role
                switch(userData.role) {
                    case 'admin': router.push('/admin'); break;
                    case 'cliente': router.push('/cliente'); break;
                    case 'vendedor': router.push('/vendedor'); break;
                    default: router.push('/');
                }
            }
            return true;
        } else {
            // Should not happen if data is consistent
            toast({ title: "Erro de Login", description: "Dados do usuário não encontrados.", variant: "destructive" });
            await signOut(auth);
            return false;
        }
     } catch (error: any) {
        console.error("Firebase login error:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            toast({ title: "Erro de Login", description: "Usuário ou senha incorretos.", variant: "destructive" });
        } else {
            toast({ title: "Erro de Login", description: "Ocorreu um erro inesperado.", variant: "destructive" });
        }
        return false;
     }
  }, [router, toast, searchParams]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // The useEffect will handle setting currentUser to null automatically.
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível fazer o logout. Tente novamente.", variant: "destructive" });
    }
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    const trimmedUsername = username.trim();
    const fakeEmail = `${trimmedUsername}@bolao.potiguar`; // Firebase requires an email for auth

    // Check if a user with this username (and thus fake email) already exists in Firestore.
    // This is a more robust check than relying solely on Firebase Auth errors.
    // Note: This requires an index in Firestore for production apps to be efficient. 
    // For this prototype, it's fine.

    try {
        // 1. Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, passwordRaw);
        const newFirebaseUser = userCredential.user;

        // 2. Create user profile in Firestore
        const newUser: User = {
            id: newFirebaseUser.uid, // Use Firebase UID as the unique ID
            username: trimmedUsername,
            role,
            createdAt: new Date().toISOString(),
            saldo: role === 'cliente' ? 50 : 0, // Give new clients a starting balance
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
