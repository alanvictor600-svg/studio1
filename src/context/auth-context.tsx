
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
    GoogleAuthProvider,
    signInWithPopup,
    type User as FirebaseUser 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, where, query, getDocs } from 'firebase/firestore';


const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';


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
  
  const saveUserToLocalStorage = (user: AppUser | null) => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    }
  };

  const fetchAppUser = async (user: FirebaseUser): Promise<AppUser | null> => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const appUser = userSnap.data() as AppUser;
          setCurrentUser(appUser);
          saveUserToLocalStorage(appUser);
          return appUser;
      }
      return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchAppUser(user);
      } else {
        setCurrentUser(null);
        saveUserToLocalStorage(null);
      }
      setIsLoading(false);
    });

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_CURRENT_USER_STORAGE_KEY) {
        const userRaw = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
        setCurrentUser(userRaw ? JSON.parse(userRaw) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      saveUserToLocalStorage(null);
      toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Erro", description: "Não foi possível fazer logout.", variant: "destructive" });
    }
  }, [router, toast]);
  
  const updateCurrentUserCredits = async (newCredits: number) => {
    if (currentUser && firebaseUser) {
      const userRef = doc(db, "users", firebaseUser.uid);
      try {
        await updateDoc(userRef, { saldo: newCredits });
        const updatedUser = { ...currentUser, saldo: newCredits };
        setCurrentUser(updatedUser);
        saveUserToLocalStorage(updatedUser);
      } catch (error) {
        console.error("Error updating credits in Firestore: ", error);
        toast({ title: "Erro", description: "Não foi possível atualizar o saldo.", variant: "destructive" });
      }
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
      // Firebase Auth uses email for login, so we construct it.
      const email = `${username.trim().toLowerCase()}@bolao.app`;
      const userCredential = await signInWithEmailAndPassword(auth, email, passwordAttempt);
      const fbUser = userCredential.user;
      
      const appUser = await fetchAppUser(fbUser);

      if (!appUser) {
          await signOut(auth);
          toast({ title: "Erro de Login", description: "Dados do usuário não encontrados no sistema.", variant: "destructive" });
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
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
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

            const userRef = doc(db, "users", gUser.uid);
            const userSnap = await getDoc(userRef);

            let appUser: AppUser;
            let isNewUser = false;

            if (!userSnap.exists()) {
                isNewUser = true;
                if (!gUser.displayName) {
                    toast({ title: "Erro de Login", description: "Não foi possível obter um nome de usuário da sua conta Google.", variant: "destructive" });
                    await signOut(auth);
                    return false;
                }
                
                const sanitizedUsername = gUser.displayName.replace(/[^a-zA-Z0-9_.-]/g, '');

                // Check if sanitized username already exists
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", sanitizedUsername));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                     toast({ title: "Erro de Cadastro", description: "Um usuário com um nome similar já existe. Tente o login com e-mail/senha.", variant: "destructive" });
                    await signOut(auth);
                    return false;
                }

                appUser = {
                    id: gUser.uid,
                    username: sanitizedUsername,
                    passwordHash: '(Login com Google)',
                    role: 'cliente', // Google sign-up defaults to 'cliente'
                    createdAt: new Date().toISOString(),
                    saldo: 0,
                };
                await setDoc(userRef, appUser);
            } else {
                appUser = userSnap.data() as AppUser;
            }

            setCurrentUser(appUser);
            saveUserToLocalStorage(appUser);
            
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
            if (error.code === 'auth/popup-closed-by-user') {
                toast({ title: "Login cancelado", description: "Você fechou a janela de login do Google.", variant: "default" });
            } else {
                 console.error("Google sign-in error:", error);
                 toast({ title: "Erro de Login", description: "Não foi possível fazer login com o Google.", variant: "destructive" });
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };


  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
     setIsLoading(true);
     
     const trimmedUsername = username.trim();
     if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido. Use apenas letras, números e os caracteres: . - _", variant: "destructive" });
         setIsLoading(false);
         return false;
     }

     if (passwordRaw.length < 6) {
        toast({ title: "Erro de Cadastro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
        setIsLoading(false);
        return false;
     }

     const email = `${trimmedUsername.toLowerCase()}@bolao.app`;

     try {
        // Check if username already exists in Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", trimmedUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
            setIsLoading(false);
            return false;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, passwordRaw);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: trimmedUsername });

        const newUser: AppUser = {
          id: firebaseUser.uid,
          username: trimmedUsername,
          passwordHash: '**********', // Placeholder - DO NOT STORE RAW PASSWORD
          role,
          createdAt: new Date().toISOString(),
          saldo: 0, 
        };
        
        // Save the new user's profile to Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);

        toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
        await signOut(auth); // Sign out user after registration to force them to log in
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
