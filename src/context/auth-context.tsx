
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';
const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor') => Promise<boolean>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUsersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
      const localUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      setUsers(localUsers);

      const storedCurrentUserRaw = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
      if (storedCurrentUserRaw) {
        const storedCurrentUser = JSON.parse(storedCurrentUserRaw);
        const foundUser = localUsers.find((u: User) => u.username === storedCurrentUser.username);
        setCurrentUser(foundUser || null);
        if (!foundUser) {
            localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load auth data from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Persist users to localStorage whenever the list changes, but not on initial load.
    if (!isLoading) {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor'): Promise<boolean> => {
    const userToLogin = users.find(u => u.username === username);
    
    if (!userToLogin) {
      setTimeout(() => {
        toast({ title: "Erro de Login", description: "Usuário não encontrado.", variant: "destructive" });
      }, 0);
      return false;
    }
    
    if (expectedRole && userToLogin.role !== expectedRole) {
       setTimeout(() => {
        toast({ title: "Acesso Negado", description: `Esta conta é de ${userToLogin.role}. Use o portal correto.`, variant: "destructive" });
      }, 0);
      return false;
    }

    // NOTE: This is plain text comparison. In a real app, use a hashing library like bcrypt.
    if (userToLogin.passwordHash === passwordAttempt) { 
      setCurrentUser(userToLogin);
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(userToLogin));
      setTimeout(() => {
        toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${username}!`, className: "bg-primary text-primary-foreground" });
      }, 0);
      
      const redirectPath = userToLogin.role === 'cliente' ? '/cliente' : '/vendedor';
      router.push(redirectPath);
      return true;
    } else {
      setTimeout(() => {
        toast({ title: "Erro de Login", description: "Senha incorreta.", variant: "destructive" });
      }, 0);
      return false;
    }
  }, [users, router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    if (users.some(u => u.username === username)) {
      setTimeout(() => {
        toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
      }, 0);
      return false;
    }

    const newUser: User = {
      id: uuidv4(),
      username,
      passwordHash: passwordRaw, // Storing plain text for prototype simplicity
      role,
      createdAt: new Date().toISOString(),
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    setTimeout(() => {
      toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground" });
    }, 0);
    router.push('/login');
    return true;
  }, [users, router, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    setTimeout(() => {
      toast({ title: "Logout realizado", description: "Até logo!" });
    }, 0);
    router.push('/');
  }, [router, toast]);

  const isAuthenticated = !isLoading && !!currentUser;
  
  const value = { currentUser, login, logout, register, isLoading, isAuthenticated };

  // This prevents rendering children until the auth state is determined,
  // avoiding flashes of incorrect content.
  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
