
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User as AppUser } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile,
    getAuth, // Import getAuth
    type User as FirebaseUser 
} from 'firebase/auth';
import { app } from '@/lib/firebase'; // Correctly import the initialized app instance

const auth = getAuth(app); // Create auth instance using the app

const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor') => Promise<boolean>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateCurrentUserCredits: (newCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in with Firebase, now get our app-specific user data (role, credits)
        const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        const users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
        const appUser = users.find(u => u.username.toLowerCase() === (user.displayName || '').toLowerCase());
        
        if (appUser) {
          setCurrentUser(appUser);
        } else {
            // This case can happen if user exists in Firebase Auth but not in our local user list.
            // For now, we create a temporary user object. This will be solved with Firestore.
             const username = user.displayName || user.email?.split('@')[0] || 'unknown';
             const temporaryUser: AppUser = {
                id: user.uid,
                username: username,
                role: 'cliente', // default role
                saldo: 0,
                passwordHash: '', // not needed on client
                createdAt: user.metadata.creationTime || new Date().toISOString(),
             };
             setCurrentUser(temporaryUser);
        }

      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // `onAuthStateChanged` will handle setting users to null.
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro", description: "Não foi possível fazer logout.", variant: "destructive" });
    }
  }, [router, toast]);
  
  const updateCurrentUserCredits = (newCredits: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, saldo: newCredits };
      setCurrentUser(updatedUser);

      // Persist this change to our temporary local storage
      const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
      let users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
      users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
    }
  };

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor'): Promise<boolean> => {
    setIsLoading(true);
    
    if (!username || username.trim() === '') {
        toast({ title: "Erro de Login", description: "O nome de usuário não pode estar vazio.", variant: "destructive" });
        setIsLoading(false);
        return false;
    }

    try {
      // Firebase Auth uses email, so we'll construct an email from the username.
      const email = `${username.trim().toLowerCase()}@bolao.app`;
      const userCredential = await signInWithEmailAndPassword(auth, email, passwordAttempt);
      
      // After firebase login, check role from our local storage data
      const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
      const users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
      const appUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

      if (!appUser) {
          await signOut(auth);
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados.", variant: "destructive" });
          return false;
      }
      
      if (expectedRole && appUser.role !== expectedRole) {
         await signOut(auth);
         toast({ title: "Acesso Negado", description: `Esta conta é de ${appUser.role}. Use o portal correto.`, variant: "destructive" });
         return false;
      }

      // onAuthStateChanged will set the user state.
      toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${username}!`, className: "bg-primary text-primary-foreground", duration: 3000 });
      
      const redirectPath = appUser.role === 'cliente' ? '/cliente' : '/vendedor';
      router.push(redirectPath);
      return true;

    } catch (error: any) {
      console.error("Firebase login error:", error);
      let message = "Ocorreu um erro ao fazer login.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          message = "Usuário ou senha inválidos.";
      } else if (error.code === 'auth/invalid-email') {
          message = "Nome de usuário inválido. Verifique se não há espaços ou caracteres especiais.";
      }
      toast({ title: "Erro de Login", description: message, variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
     setIsLoading(true);
     
     if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido. Use apenas letras, números e os caracteres: . - _", variant: "destructive" });
         setIsLoading(false);
         return false;
     }

     // For Firebase Auth, username must be a valid email format. We'll create a fake one.
     const email = `${username.trim().toLowerCase()}@bolao.app`;

     try {
        // Step 1: Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, passwordRaw);
        const firebaseUser = userCredential.user;
        
        // Step 1.5: Set the displayName on the firebase user profile
        await updateProfile(firebaseUser, { displayName: username.trim() });

        // Step 2: Store our app-specific user data (role, saldo) in localStorage for now.
        const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        const users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
        
        if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
            toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
            // Should also delete the created firebase user here, but skipping for simplicity in this phase.
            return false;
        }

        const newUser: AppUser = {
          id: firebaseUser.uid, // Use Firebase UID as the user ID
          username: username.trim(),
          passwordHash: '', // Don't store password hash locally anymore
          role,
          createdAt: new Date().toISOString(),
          saldo: 0, 
        };
        
        const newUsers = [...users, newUser];
        localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(newUsers));

        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        router.push('/login');
        return true;

     } catch (error: any) {
        console.error("Firebase registration error: ", error);
        let message = "Ocorreu um erro durante o cadastro.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Este nome de usuário já está em uso.";
        } else if (error.code === 'auth/weak-password') {
            message = "A senha é muito fraca. Tente uma senha com pelo menos 6 caracteres.";
        } else if (error.code === 'auth/invalid-email') {
            message = "Nome de usuário inválido. Use apenas letras, números e os caracteres: . - _";
        } else if (error.code === 'auth/configuration-not-found') {
            message = "Erro de configuração do Firebase. O serviço de autenticação pode não estar ativado.";
        }
        toast({ title: "Erro de Cadastro", description: message, variant: "destructive" });
        return false;
     } finally {
        setIsLoading(false);
     }
  }, [router, toast]);

  const isAuthenticated = !isLoading && !!firebaseUser;
  
  const value = { currentUser, firebaseUser, login, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : (
        <div className="flex justify-center items-center min-h-screen bg-background">
          <p className="text-foreground text-xl">Carregando Aplicação...</p>
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
