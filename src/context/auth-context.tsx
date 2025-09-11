
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
  updateCurrentUserCredits: (newCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialData = () => {
      try {
        const storedUsersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        const localUsers: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        setUsers(localUsers);

        const storedCurrentUserRaw = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
        if (storedCurrentUserRaw) {
          const storedCurrentUser = JSON.parse(storedCurrentUserRaw);
          // Find user by ID for better reliability, but fallback to username
          const foundUser = localUsers.find((u: User) => u.id === storedCurrentUser.id) || localUsers.find((u: User) => u.username === storedCurrentUser.username);
          
          if(foundUser){
            setCurrentUser(foundUser);
            // Refresh localStorage with the most up-to-date user data
            localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(foundUser));
          } else {
            // User from storage not found in user list, clear it
            localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to load auth data from localStorage", error);
      } finally {
          setIsLoading(false);
      }
    }
    
    loadInitialData();
    
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === AUTH_USERS_STORAGE_KEY && event.newValue) {
            const newUsers: User[] = JSON.parse(event.newValue);
            setUsers(newUsers);
            if (currentUser) {
                const updatedCurrentUser = newUsers.find(u => u.id === currentUser.id);
                if (updatedCurrentUser) {
                    setCurrentUser(updatedCurrentUser);
                    localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedCurrentUser));
                } else {
                    // Current user was deleted, so log out
                    logout();
                }
            }
        }
         if (event.key === AUTH_CURRENT_USER_STORAGE_KEY && event.newValue) {
            const newCurrentUser = JSON.parse(event.newValue);
            if (currentUser?.id === newCurrentUser.id) {
                setCurrentUser(newCurrentUser);
            }
        }
         if (event.key === AUTH_CURRENT_USER_STORAGE_KEY && !event.newValue) {
            // This case handles logout from another tab
            setCurrentUser(null);
        }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [currentUser]); // Add currentUser to dependency array

  useEffect(() => {
    // Persist users to localStorage whenever the list changes, but not on initial load.
    if (!isLoading) {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);
  
  const updateCurrentUserCredits = (newCredits: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, credits: newCredits };
      const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u)
      setUsers(newUsers); // This will trigger the useEffect above to save all users
      setCurrentUser(updatedUser);
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

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
        toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${username}!`, className: "bg-primary text-primary-foreground", duration: 3000 });
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
      credits: 0, // Start with 0 credits
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    setTimeout(() => {
      toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
    }, 0);
    router.push('/login');
    return true;
  }, [users, router, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    setTimeout(() => {
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
    }, 0);
    router.push('/');
  }, [router, toast]);

  const isAuthenticated = !isLoading && !!currentUser;
  
  const value = { currentUser, login, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits };

  return (
    <AuthContext.Provider value={value}>
      {/* Avoids rendering children until auth state is resolved to prevent UI flashes */}
      {!isLoading && children}
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
