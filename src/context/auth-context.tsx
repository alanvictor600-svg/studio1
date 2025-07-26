
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

// localStorage keys
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
    setIsLoading(true);
    try {
      const storedUsersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
      const localUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      setUsers(localUsers);

      const storedCurrentUserUsername = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
      if (storedCurrentUserUsername) {
        const foundUser = localUsers.find((u: User) => u.username === storedCurrentUserUsername);
        if (foundUser) {
          setCurrentUser(foundUser);
        } else {
          localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY); // Clean up if user not found
        }
      }
    } catch (error) {
      console.error("Failed to load auth data from localStorage", error);
      localStorage.removeItem(AUTH_USERS_STORAGE_KEY);
      localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor'): Promise<boolean> => {
    const userToLogin = users.find(u => u.username === username);
    
    if (!userToLogin) {
      toast({ title: "Erro de Login", description: "Usuário não encontrado.", variant: "destructive" });
      return false;
    }
    
    // Check if the user's role matches the expected role for the login portal
    if (expectedRole && userToLogin.role !== expectedRole) {
      toast({ title: "Acesso Negado", description: `Esta conta é de ${userToLogin.role}. Use o portal correto.`, variant: "destructive" });
      return false;
    }

    // NOTE: This is plain text comparison, NOT secure for production.
    if (userToLogin.passwordHash === passwordAttempt) { // Direct comparison for prototype
      setCurrentUser(userToLogin);
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, userToLogin.username);
      toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${username}!`, className: "bg-primary text-primary-foreground" });
      
      // Redirect to the correct dashboard based on the user's actual role
      const redirectPath = userToLogin.role === 'cliente' ? '/cliente' : '/vendedor';
      router.push(redirectPath);
      return true;
    } else {
      toast({ title: "Erro de Login", description: "Senha incorreta.", variant: "destructive" });
      return false;
    }
  }, [users, router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    if (users.find(u => u.username === username)) {
      toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
      return false;
    }
    // NOTE: Storing passwordRaw directly as passwordHash for prototype simplicity.
    const newUser: User = {
      id: uuidv4(),
      username,
      passwordHash: passwordRaw, // Storing raw password as hash for simplicity
      role,
      createdAt: new Date().toISOString(),
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground" });
    router.push('/login');
    return true;
  }, [users, setUsers, router, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    toast({ title: "Logout realizado", description: "Até logo!" });
    router.push('/');
  }, [router, toast]);

  const isAuthenticated = !isLoading && !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, isLoading, isAuthenticated }}>
      {!isLoading && children}
      {isLoading && (
         <div className="flex justify-center items-center min-h-screen bg-background">
           <p className="text-foreground text-xl">Carregando sistema de autenticação...</p>
         </div>
      )}
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
