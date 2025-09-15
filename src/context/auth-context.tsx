
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Local storage keys
const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';
const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';

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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // This will now be primarily driven by Firebase's auth loading state
  const router = useRouter();
  const { toast } = useToast();

  const [firebaseUser, authLoading, authError] = useAuthState(auth);

  useEffect(() => {
    const checkUser = async () => {
      if (authLoading) {
        setIsLoading(true);
        return;
      }
      if (authError) {
        console.error("Firebase Auth Error:", authError);
        toast({ title: "Erro de Autenticação", description: "Ocorreu um problema ao verificar sua identidade.", variant: "destructive"});
        setIsLoading(false);
        setCurrentUser(null);
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
      setIsLoading(false);
    };

    checkUser();
  }, [firebaseUser, authLoading, authError, toast]);


  // The functions below are still using the OLD localStorage logic.
  // We will migrate them in the next steps.

  const saveUsersToLocalStorage = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };
  
  const saveCurrentUserToLocalStorage = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    }
  };

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin'): Promise<boolean> => {
    const userToLogin = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!userToLogin) {
      toast({ title: "Erro de Login", description: "Usuário não encontrado.", variant: "destructive" });
      return false;
    }

    if (userToLogin.passwordHash !== passwordAttempt) {
      toast({ title: "Erro de Login", description: "Senha incorreta.", variant: "destructive" });
      return false;
    }

    if (expectedRole && userToLogin.role !== expectedRole) {
      toast({ title: "Acesso Negado", description: `Esta conta é de ${userToLogin.role}. Use o portal correto.`, variant: "destructive" });
      return false;
    }
    
    saveCurrentUserToLocalStorage(userToLogin);
    toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${userToLogin.username}!`, className: "bg-primary text-primary-foreground", duration: 3000 });
    
    // Redirect after successful login
    let redirectPath = '/';
    if(userToLogin.role === 'admin') redirectPath = '/admin';
    else if(userToLogin.role === 'cliente') redirectPath = '/cliente';
    else if(userToLogin.role === 'vendedor') redirectPath = '/vendedor';
    router.push(redirectPath);
    
    return true;
  }, [users, router, toast]);

   const loginWithGoogle = async (): Promise<boolean> => {
     toast({ title: "Funcionalidade Indisponível", description: "Login com Google não está disponível na versão offline.", variant: "destructive" });
     return false;
   };

  const logout = useCallback(() => {
    saveCurrentUserToLocalStorage(null);
    toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
    router.push('/');
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    const trimmedUsername = username.trim();
    if (users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
      return false;
    }

    const newUser: User = {
      id: uuidv4(),
      username: trimmedUsername,
      passwordHash: passwordRaw, // Storing plain text for prototype simplicity
      role,
      createdAt: new Date().toISOString(),
      saldo: role === 'cliente' ? 50 : 0, // Give new clients a starting balance
    };

    const updatedUsers = [...users, newUser];
    saveUsersToLocalStorage(updatedUsers);
    
    toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
    router.push('/login');
    return true;
  }, [users, router, toast]);

  const updateCurrentUserCredits = (newCredits: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, saldo: newCredits };
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      saveUsersToLocalStorage(updatedUsers);
      saveCurrentUserToLocalStorage(updatedUser);
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
