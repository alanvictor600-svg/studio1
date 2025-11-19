

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Draw, Ticket, LotteryConfig, User, AdminHistoryEntry, CreditRequestConfig, RankedTicket } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { UserDetailsDialog } from '@/components/user-details-dialog';
import { CreditManagementDialog } from '@/components/credit-management-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase-client';
import { collection, onSnapshot, doc, query, orderBy, getDocs } from 'firebase/firestore';

import { addDrawAction, startNewLotteryAction } from '@/app/actions/lottery';
import { saveLotteryConfig, saveCreditRequestConfig } from '@/lib/services/configService';
import { updateUserCredits } from '@/lib/services/userService';
import { deleteUserAction } from '@/app/actions/user';

import { SettingsSection } from '@/components/admin/sections/SettingsSection';
import { NewDrawSection } from '@/components/admin/sections/NewDrawSection';
import { ControlsSection } from '@/components/admin/sections/ControlsSection';
import { ReportsSection } from '@/components/admin/sections/ReportsSection';
import { DrawHistorySection } from '@/components/admin/sections/DrawHistorySection';
import { WinningTicketsSection } from '@/components/admin/sections/WinningTicketsSection';
import { CycleRankingSection } from '@/components/admin/sections/CycleRankingSection';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { generateFinancialReport } from '@/lib/reports';
import { SuspenseWrapper } from '@/components/suspense-wrapper';


const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

const DEFAULT_CREDIT_CONFIG: CreditRequestConfig = {
    whatsappNumber: '',
    pixKey: '',
};

export type AdminSection = 'configuracoes' | 'cadastrar-sorteio' | 'controles-loteria' | 'historico-sorteios' | 'bilhetes-premiados' | 'relatorios' | 'ranking-ciclo';


function AdminPageContent() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [creditRequestConfig, setCreditRequestConfig] = useState<CreditRequestConfig>(DEFAULT_CREDIT_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  const [userToView, setUserToView] = useState<User | null>(null);
  const [isUserViewDialogOpen, setIsUserViewDialogOpen] = useState(false);
  const [userToManageCredits, setUserToManageCredits] = useState<User | null>(null);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [adminHistory, setAdminHistory] = useState<AdminHistoryEntry[]>([]);
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeSection = (searchParams.get('section') as AdminSection) || 'configuracoes';


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      router.push('/login?redirect=/admin');
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin' || !isAuthenticated) return;

    const configDocRef = doc(db, 'configs', 'global');
    const unsubscribeConfig = onSnapshot(configDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const newLotteryConfig = {
                ticketPrice: data.ticketPrice || DEFAULT_LOTTERY_CONFIG.ticketPrice,
                sellerCommissionPercentage: data.sellerCommissionPercentage || DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage,
                ownerCommissionPercentage: data.ownerCommissionPercentage || DEFAULT_LOTTERY_CONFIG.ownerCommissionPercentage,
                clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || DEFAULT_LOTTERY_CONFIG.clientSalesCommissionToOwnerPercentage,
            };
            const newCreditConfig = {
                whatsappNumber: data.whatsappNumber || DEFAULT_CREDIT_CONFIG.whatsappNumber,
                pixKey: data.pixKey || DEFAULT_CREDIT_CONFIG.pixKey,
            };

            setLotteryConfig(newLotteryConfig);
            setCreditRequestConfig(newCreditConfig);
        } else {
          setLotteryConfig(DEFAULT_LOTTERY_CONFIG);
          setCreditRequestConfig(DEFAULT_CREDIT_CONFIG);
        }
    }, (error) => {
        console.error("Error fetching configs: ", error);
        toast({ title: "Erro ao Carregar Configurações", description: "Não foi possível carregar as configurações do sistema.", variant: "destructive" });
    });

    const ticketsQuery = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        setAllTickets(ticketsData);
    }, (error) => {
        console.error("Error fetching tickets: ", error);
        toast({ title: "Erro ao Carregar Bilhetes", description: "Não foi possível carregar os dados dos bilhetes.", variant: "destructive" });
    });

    const drawsQuery = query(collection(db, 'draws'));
    const unsubscribeDraws = onSnapshot(drawsQuery, (querySnapshot) => {
        const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
        setDraws(drawsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
        console.error("Error fetching draws: ", error);
        toast({ title: "Erro ao Carregar Sorteios", description: "Não foi possível carregar os dados dos sorteios.", variant: "destructive" });
    });

    const adminHistoryQuery = query(collection(db, 'adminHistory'), orderBy('endDate', 'desc'));
    const unsubscribeAdminHistory = onSnapshot(adminHistoryQuery, (querySnapshot) => {
      const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminHistoryEntry));
      setAdminHistory(historyData);
    }, (error) => {
      console.error("Error fetching admin history: ", error);
      toast({ title: "Erro ao Carregar Histórico", description: "Não foi possível carregar o histórico do admin.", variant: "destructive" });
    });
    
    return () => {
        unsubscribeConfig();
        unsubscribeTickets();
        unsubscribeDraws();
        unsubscribeAdminHistory();
    };
  }, [currentUser, isAuthenticated, toast]);


  const processedTickets = useMemo(() => updateTicketStatusesBasedOnDraws(allTickets, draws), [allTickets, draws]);
  const winningTickets = useMemo(() => processedTickets.filter(ticket => ticket.status === 'winning'), [processedTickets]);
  
  const financialReport = useMemo(() => 
    generateFinancialReport(allTickets, lotteryConfig), 
    [allTickets, lotteryConfig]
  );
  
  const cycleRanking = useMemo(() => {
    const activeTickets = processedTickets.filter(t => t.status === 'active' || t.status === 'winning');
    
    const ticketsWithMatches = activeTickets.map(ticket => {
        const ticketNumbersFrequency = ticket.numbers.reduce((acc, num) => {
            acc[num] = (acc[num] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const allDrawnNumbers = draws.flatMap(d => d.numbers);
        const drawnNumbersFrequency = allDrawnNumbers.reduce((acc, num) => {
            acc[num] = (acc[num] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        let matches = 0;
        for (const numStr in ticketNumbersFrequency) {
            const num = parseInt(numStr, 10);
            matches += Math.min(ticketNumbersFrequency[num] || 0, drawnNumbersFrequency[num] || 0);
        }
        return { ...ticket, matches };
    });

    return ticketsWithMatches.sort((a, b) => b.matches - a.matches);
}, [processedTickets, draws]);


  const handleAddDraw = async (newNumbers: number[], name?: string) => {
    if (winningTickets.length > 0) {
      toast({ title: "Ação Bloqueada", description: "Não é possível cadastrar sorteios enquanto houver bilhetes premiados. Inicie uma nova loteria.", variant: "destructive" });
      return;
    }
    try {
        await addDrawAction(newNumbers, name);
        toast({ title: "Sorteio Cadastrado!", description: "O novo sorteio foi registrado e os bilhetes atualizados.", className: "bg-primary text-primary-foreground", duration: 3000 });
    } catch (e) {
        console.error("Error adding draw: ", e);
        if (e instanceof Error) {
            toast({ title: "Erro ao Salvar", description: e.message, variant: "destructive" });
        } else {
            toast({ title: "Erro ao Salvar", description: "Não foi possível registrar o sorteio. Tente novamente.", variant: "destructive" });
        }
    }
  };
  
  const handleStartNewLottery = async () => {
    const usersSnapshot = await getDocs(query(collection(db, 'users')));
    const allUsersForLottery = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    try {
        await startNewLotteryAction({ allUsers: allUsersForLottery, processedTickets, lotteryConfig, financialReport });
        toast({
          title: "Nova Loteria Iniciada!",
          description: "Históricos foram salvos e o ciclo foi resetado com sucesso.",
          className: "bg-primary text-primary-foreground",
          duration: 4000,
        });
    } catch (e) {
        console.error("Error starting new lottery: ", e);
        if (e instanceof Error) {
            toast({ title: "Erro", description: `Falha ao iniciar nova loteria: ${e.message}`, variant: "destructive" });
        } else {
            toast({ title: "Erro", description: "Falha ao iniciar nova loteria no banco de dados.", variant: "destructive" });
        }
    }
  };

  const handleSaveLotteryConfig = async (newConfig: Partial<LotteryConfig>) => {
    try {
        await saveLotteryConfig(newConfig);
        toast({ title: "Configurações Salvas!", description: "As novas configurações da loteria foram salvas na nuvem.", className: "bg-primary text-primary-foreground", duration: 3000 });
    } catch(e) {
        console.error("Error saving lottery config: ", e);
        toast({ title: "Erro", description: "Não foi possível salvar as configurações.", variant: "destructive" });
    }
  };
  
  const handleSaveCreditRequestConfig = async (newConfig: CreditRequestConfig) => {
    try {
        await saveCreditRequestConfig(newConfig);
        toast({ title: "Configurações Salvas!", description: "As informações de contato foram salvas na nuvem.", className: "bg-primary text-primary-foreground", duration: 3000 });
    } catch (e) {
        console.error("Error saving credit request config: ", e);
        toast({ title: "Erro", description: "Não foi possível salvar as informações de contato.", variant: "destructive" });
    }
  };

  const handleOpenViewUser = (user: User) => {
    setUserToView(user);
    setIsUserViewDialogOpen(true);
  };
  
  const handleOpenCreditDialog = (user: User) => {
    setUserToManageCredits(user);
    setIsCreditDialogOpen(true);
  };
  
  const handleCreditChange = async (user: User, amount: number) => {
    try {
        const newBalance = await updateUserCredits(user.id, amount);
        
        if (userToManageCredits && userToManageCredits.id === user.id) {
            setUserToManageCredits(prev => prev ? { ...prev, saldo: newBalance } : null);
        }
        if (userToView && userToView.id === user.id) {
            setUserToView(prev => prev ? { ...prev, saldo: newBalance } : null);
        }

        toast({
            title: "Saldo Atualizado!",
            description: `O saldo de ${user.username} agora é R$ ${newBalance.toFixed(2).replace('.', ',')}. A lista será atualizada.`,
            className: "bg-primary text-primary-foreground",
            duration: 4000
        });
        
    } catch(e) {
        console.error("Error updating credits: ", e);
        toast({ title: "Erro", description: "Não foi possível atualizar o saldo do usuário.", variant: "destructive" });
    }
    
    setIsCreditDialogOpen(false);
    setUserToManageCredits(null);
  };

  const handleConfirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !currentUser) return;

    if (currentUser.id === userToDelete.id) {
      toast({ title: "Ação Bloqueada", description: "Não é possível excluir o usuário que está logado.", variant: "destructive" });
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      return;
    }
    
    try {
        await deleteUserAction(userToDelete.id);
        
        if (userToView && userToView.id === userToDelete.id) {
            setIsUserViewDialogOpen(false);
            setUserToView(null);
        }
        toast({ title: "Usuário Excluído", description: `O usuário ${userToDelete.username} foi removido.`, className: "bg-destructive text-destructive-foreground", duration: 3000 });

    } catch (e) {
        console.error("Error deleting user: ", e);
        toast({ title: "Erro", description: "Falha ao excluir o usuário no banco de dados.", variant: "destructive" });
    }

    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };
  
  if (!isClient || isLoading || !isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Admin...</p>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'configuracoes':
        return (
          <SettingsSection 
            lotteryConfig={lotteryConfig}
            creditRequestConfig={creditRequestConfig}
            allTickets={allTickets}
            onSaveLotteryConfig={handleSaveLotteryConfig}
            onSaveCreditRequestConfig={handleSaveCreditRequestConfig}
            onOpenCreditDialog={handleOpenCreditDialog}
            onOpenViewUser={handleOpenViewUser}
          />
        );
      case 'cadastrar-sorteio':
        return (
          <NewDrawSection
            onAddDraw={handleAddDraw}
            hasWinningTickets={winningTickets.length > 0}
          />
        );
      case 'controles-loteria':
        return (
          <ControlsSection 
            onStartNewLottery={handleStartNewLottery}
          />
        );
       case 'relatorios':
        return (
          <ReportsSection
            financialReport={financialReport}
            adminHistory={adminHistory}
            allTickets={processedTickets}
            draws={draws}
          />
        );
      case 'historico-sorteios':
        return (
          <DrawHistorySection draws={draws} />
        );
      case 'bilhetes-premiados':
        return (
          <WinningTicketsSection 
            winningTickets={winningTickets} 
            draws={draws} 
          />
        );
      case 'ranking-ciclo':
        return (
          <CycleRankingSection rankedTickets={cycleRanking} draws={draws} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {renderSectionContent()}
      </div>

      {userToView && (
          <UserDetailsDialog
              isOpen={isUserViewDialogOpen}
              onOpenChange={setIsUserViewDialogOpen}
              user={userToView}
              allTickets={processedTickets}
              onDelete={() => {
                if (userToView) {
                  handleConfirmDeleteUser(userToView);
                }
              }}
              onClose={() => setUserToView(null)}
          />
      )}
      
      {userToManageCredits && (
          <CreditManagementDialog
              isOpen={isCreditDialogOpen}
              onOpenChange={setIsCreditDialogOpen}
              user={userToManageCredits}
              onSave={handleCreditChange}
              onClose={() => setUserToManageCredits(null)}
          />
      )}
      
      {userToDelete && (
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir o usuário <span className="font-bold">{userToDelete?.username}</span>? Esta ação não pode ser desfeita. 
                        <br/><br/>
                        <span className="text-xs text-muted-foreground">Nota: A conta do usuário será removida, mas seus bilhetes permanecerão no sistema para preservar o histórico de vendas e relatórios.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}


export default function AdminPage() {
  return (
    <SuspenseWrapper>
      <AdminPageContent />
    </SuspenseWrapper>
  );
}
