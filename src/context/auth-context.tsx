
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
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    type User as FirebaseUser 
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor') => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
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
        const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        const users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
        const appUser = users.find(u => u.username.toLowerCase() === (user.displayName || '').toLowerCase());
        
        if (appUser) {
          setCurrentUser(appUser);
        } else {
             const username = user.displayName || user.email?.split('@')[0] || 'unknown';
             const temporaryUser: AppUser = {
                id: user.uid,
                username: username,
                role: 'cliente',
                saldo: 0,
                passwordHash: '',
                createdAt: user.metadata.creationTime || new Date().toISOString(),
             };
             setCurrentUser(temporaryUser);
        }

      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
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
      const email = `${username.trim().toLowerCase()}@bolao.app`;
      await signInWithEmailAndPassword(auth, email, passwordAttempt);
      
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

      toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${appUser.username}!`, className: "bg-primary text-primary-foreground", duration: 3000 });
      
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

    const loginWithGoogle = async (): Promise<boolean> => {
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const gUser = result.user;

            const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
            let users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
            let appUser = users.find(u => u.id === gUser.uid || u.username.toLowerCase() === (gUser.displayName || '').toLowerCase());
            let isNewUser = false;

            if (!appUser) {
                isNewUser = true;
                if (!gUser.displayName) {
                    toast({ title: "Erro de Login", description: "Não foi possível obter um nome de usuário da sua conta Google.", variant: "destructive" });
                    await signOut(auth);
                    return false;
                }
                
                appUser = {
                    id: gUser.uid,
                    username: gUser.displayName,
                    passwordHash: '',
                    role: 'cliente', 
                    createdAt: new Date().toISOString(),
                    saldo: 0,
                };
                users.push(appUser);
                localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
            }
            
            toast({
                title: isNewUser ? 'Cadastro realizado!' : 'Login bem-sucedido!',
                description: `Bem-vindo, ${appUser.username}!`,
                className: "bg-primary text-primary-foreground",
                duration: 3000
            });
            
            const redirectPath = appUser.role === 'cliente' ? '/cliente' : '/vendedor';
            router.push(redirectPath);
            return true;

        } catch (error: any) {
            console.error("Google sign-in error:", error);
            let message = "Não foi possível fazer login com o Google.";
            if (error.code === 'auth/popup-closed-by-user') {
                message = "A janela de login foi fechada. Tente novamente.";
            }
            toast({ title: "Erro de Login", description: message, variant: "destructive" });
            return false;
        } finally {
            setIsLoading(false);
        }
    };


  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
     setIsLoading(true);
     
     if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido. Use apenas letras, números e os caracteres: . - _", variant: "destructive" });
         setIsLoading(false);
         return false;
     }

     const email = `${username.trim().toLowerCase()}@bolao.app`;

     try {
        const usersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        const users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];
        
        if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
            toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
            setIsLoading(false);
            return false;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, passwordRaw);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: username.trim() });

        const newUser: AppUser = {
          id: firebaseUser.uid,
          username: username.trim(),
          passwordHash: '',
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
  
  const value = { currentUser, firebaseUser, login, loginWithGoogle, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits };

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
