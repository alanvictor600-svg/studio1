
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Draw, Ticket, LotteryConfig, SellerHistoryEntry, User, AdminHistoryEntry, CreditRequestConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Trophy, Rocket, AlertTriangle, Settings, DollarSign, Percent, PlusCircle, ShieldCheck, History, Menu, X, Palette as PaletteIcon, KeyRound, Users, Trash2, Edit, PieChart, BookText, Search, Coins, CreditCard, Contact, Ticket as TicketIcon } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { UserDetailsDialog } from '@/components/user-details-dialog';
import { CreditManagementDialog } from '@/components/credit-management-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, writeBatch, query } from 'firebase/firestore';


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

type AdminSection = 'configuracoes' | 'cadastrar-sorteio' | 'controles-loteria' | 'historico-sorteios' | 'bilhetes-premiados' | 'relatorios';

const menuItems: { id: AdminSection; label: string; Icon: React.ElementType }[] = [
  { id: 'configuracoes', label: 'Configurações', Icon: Settings },
  { id: 'cadastrar-sorteio', label: 'Cadastrar Sorteio', Icon: PlusCircle },
  { id: 'controles-loteria', label: 'Controles', Icon: ShieldCheck },
  { id: 'relatorios', label: 'Relatórios', Icon: PieChart },
  { id: 'historico-sorteios', label: 'Resultados', Icon: History },
  { id: 'bilhetes-premiados', label: 'Bilhetes Premiados', Icon: Trophy },
];

export default function AdminPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [creditRequestConfig, setCreditRequestConfig] = useState<CreditRequestConfig>(DEFAULT_CREDIT_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const [ticketPriceInput, setTicketPriceInput] = useState('');
  const [commissionInput, setCommissionInput] = useState('');
  const [ownerCommissionInput, setOwnerCommissionInput] = useState('');
  const [clientSalesCommissionInput, setClientSalesCommissionInput] = useState('');
  const [startLotteryPassword, setStartLotteryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [whatsappInput, setWhatsappInput] = useState('');
  const [pixKeyInput, setPixKeyInput] = useState('');

  const [activeSection, setActiveSection] = useState<AdminSection>('configuracoes');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [isUserViewDialogOpen, setIsUserViewDialogOpen] = useState(false);
  const [userToManageCredits, setUserToManageCredits] = useState<User | null>(null);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [adminHistory, setAdminHistory] = useState<AdminHistoryEntry[]>([]);
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Load static data from localStorage and listen for realtime data from Firestore
  useEffect(() => {
    setIsClient(true);
    // Static data from localStorage
    if (typeof window !== 'undefined') {
        const storedConfig = localStorage.getItem('lotteryConfig');
        const storedCreditConfig = localStorage.getItem('creditRequestConfig');
        const storedAdminHistory = localStorage.getItem('adminHistory');

        if (storedAdminHistory) setAdminHistory(JSON.parse(storedAdminHistory));
        
        if (storedConfig) {
            const config = JSON.parse(storedConfig);
            setLotteryConfig(config);
            setTicketPriceInput(config.ticketPrice.toString());
            setCommissionInput(config.sellerCommissionPercentage.toString());
            setOwnerCommissionInput((config.ownerCommissionPercentage || 0).toString());
            setClientSalesCommissionInput((config.clientSalesCommissionToOwnerPercentage || 0).toString());
        } else {
             setLotteryConfig(DEFAULT_LOTTERY_CONFIG);
        }

        if (storedCreditConfig) {
            const creditConfig = JSON.parse(storedCreditConfig);
            setCreditRequestConfig(creditConfig);
            setWhatsappInput(creditConfig.whatsappNumber);
            setPixKeyInput(creditConfig.pixKey);
        } else {
            setCreditRequestConfig(DEFAULT_CREDIT_CONFIG);
        }
    }

    // Realtime data from Firestore
    const ticketsQuery = query(collection(db, 'tickets'));
    const drawsQuery = query(collection(db, 'draws'));
    const usersQuery = query(collection(db, 'users'));

    const unsubscribeTickets = onSnapshot(ticketsQuery, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        setAllTickets(ticketsData);
    }, (error) => {
        console.error("Error fetching tickets: ", error);
        toast({ title: "Erro ao Carregar Bilhetes", description: "Não foi possível carregar os dados dos bilhetes.", variant: "destructive" });
    });

    const unsubscribeDraws = onSnapshot(drawsQuery, (querySnapshot) => {
        const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
        setDraws(drawsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
        console.error("Error fetching draws: ", error);
        toast({ title: "Erro ao Carregar Sorteios", description: "Não foi possível carregar os dados dos sorteios.", variant: "destructive" });
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersData);
    }, (error) => {
        console.error("Error fetching users: ", error);
        toast({ title: "Erro ao Carregar Usuários", description: "Não foi possível carregar os dados dos usuários.", variant: "destructive" });
    });

    // Cleanup subscription on unmount
    return () => {
        unsubscribeTickets();
        unsubscribeDraws();
        unsubscribeUsers();
    };
  }, [toast]);

  // Auth check
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/login?redirect=/admin');
    }
  }, [isLoading, isAuthenticated, currentUser, router]);


  const saveAdminHistory = (newHistory: AdminHistoryEntry[]) => {
      setAdminHistory(newHistory);
      localStorage.setItem('adminHistory', JSON.stringify(newHistory));
  }

  const processedTickets = useMemo(() => updateTicketStatusesBasedOnDraws(allTickets, draws), [allTickets, draws]);
  const winningTickets = processedTickets.filter(ticket => ticket.status === 'winning');
  const clientTickets = processedTickets.filter(t => !t.sellerUsername);
  const vendedorTickets = processedTickets.filter(t => !!t.sellerUsername);
  
  const financialReport = useMemo(() => {
    const report = {
        totalRevenue: 0,
        sellerCommission: 0,
        ownerCommission: 0,
        prizePool: 0,
        clientRevenue: 0,
        sellerRevenue: 0,
        clientTicketCount: 0,
        sellerTicketCount: 0
    };

    const activeClientTickets = clientTickets.filter(t => t.status === 'active');
    const activeVendedorTickets = vendedorTickets.filter(t => t.status === 'active');
    
    const price = lotteryConfig.ticketPrice || 0;
    const sellerCommPercent = lotteryConfig.sellerCommissionPercentage || 0;
    const ownerCommPercent = lotteryConfig.ownerCommissionPercentage || 0;
    const clientSalesCommPercent = lotteryConfig.clientSalesCommissionToOwnerPercentage || 0;
    
    report.clientTicketCount = activeClientTickets.length;
    report.sellerTicketCount = activeVendedorTickets.length;

    report.clientRevenue = report.clientTicketCount * price;
    report.sellerRevenue = report.sellerTicketCount * price;
    report.totalRevenue = report.clientRevenue + report.sellerRevenue;

    report.sellerCommission = report.sellerRevenue * (sellerCommPercent / 100);
    const ownerBaseCommission = report.totalRevenue * (ownerCommPercent / 100);
    const ownerExtraCommission = report.clientRevenue * (clientSalesCommPercent / 100);
    report.ownerCommission = ownerBaseCommission + ownerExtraCommission;

    report.prizePool = report.totalRevenue - report.sellerCommission - report.ownerCommission;
    
    return report;
  }, [clientTickets, vendedorTickets, lotteryConfig]);


  const handleAddDraw = async (newNumbers: number[], name?: string) => {
    if (winningTickets.length > 0) {
      toast({ title: "Ação Bloqueada", description: "Não é possível cadastrar sorteios enquanto houver bilhetes premiados. Inicie uma nova loteria.", variant: "destructive" });
      return;
    }
    if (newNumbers.length !== 5) {
      toast({ title: "Erro de Validação", description: "O sorteio deve conter exatamente 5 números.", variant: "destructive" });
      return;
    }

    const newDrawData = {
      numbers: newNumbers,
      createdAt: new Date().toISOString(),
      name: name || undefined,
    };
    
    try {
        const docRef = await addDoc(collection(db, 'draws'), newDrawData);
        
        // This part is now handled by the onSnapshot listener,
        // but we need to trigger the ticket status update logic after a draw is added.
        // The onSnapshot will fetch the new draw, which triggers the useMemo for processedTickets.
        // We might need to manually trigger an update of tickets if statuses are stored in DB.
        
        toast({ title: "Sorteio Cadastrado!", description: "O novo sorteio foi registrado e os bilhetes atualizados.", className: "bg-primary text-primary-foreground", duration: 3000 });

    } catch (e) {
        console.error("Error adding draw: ", e);
        toast({ title: "Erro ao Salvar", description: "Não foi possível registrar o sorteio. Tente novamente.", variant: "destructive" });
    }
  };
  
  const captureAndSaveSellerHistory = useCallback(() => {
    const sellers = allUsers.filter(u => u.role === 'vendedor');
    const existingHistory = localStorage.getItem('sellerHistory') ? JSON.parse(localStorage.getItem('sellerHistory')!) : [];
    let newEntries: SellerHistoryEntry[] = [];
    
    sellers.forEach(seller => {
        const activeTickets = vendedorTickets.filter(ticket => ticket.status === 'active' && ticket.sellerUsername === seller.username);
        const activeSellerTicketsCount = activeTickets.length;
        const totalRevenueFromActiveTickets = activeSellerTicketsCount * lotteryConfig.ticketPrice;
        const commissionEarned = totalRevenueFromActiveTickets * (lotteryConfig.sellerCommissionPercentage / 100);

        if (activeSellerTicketsCount > 0) {
            newEntries.push({
              id: uuidv4(),
              sellerUsername: seller.username,
              endDate: new Date().toISOString(),
              activeTicketsCount: activeSellerTicketsCount,
              totalRevenue: totalRevenueFromActiveTickets,
              totalCommission: commissionEarned,
            });
        }
    });

    if (newEntries.length > 0) {
        localStorage.setItem('sellerHistory', JSON.stringify([...newEntries, ...existingHistory]));
        toast({ title: "Histórico de Vendedores Salvo!", description: "Um resumo do ciclo de vendas atual foi salvo para cada vendedor.", className: "bg-secondary text-secondary-foreground", duration: 3000 });
    }
  }, [allUsers, vendedorTickets, lotteryConfig, toast]);
  
  const captureAndSaveAdminHistory = useCallback(() => {
      const currentReport = financialReport;
      const newHistoryEntry: AdminHistoryEntry = {
        id: uuidv4(),
        endDate: new Date().toISOString(),
        totalRevenue: currentReport.totalRevenue,
        totalSellerCommission: currentReport.sellerCommission,
        totalOwnerCommission: currentReport.ownerCommission,
        totalPrizePool: currentReport.prizePool,
        clientTicketCount: currentReport.clientTicketCount,
        sellerTicketCount: currentReport.sellerTicketCount,
      };
      
      const updatedHistory = [newHistoryEntry, ...adminHistory];
      saveAdminHistory(updatedHistory);
      toast({ title: "Histórico do Admin Salvo!", description: "Um resumo financeiro do ciclo atual foi salvo.", className: "bg-secondary text-secondary-foreground", duration: 3000 });
  }, [financialReport, adminHistory, toast]);

  const handleStartNewLottery = async () => {
    const CONTROL_PASSWORD = "Al@n2099";
    if (startLotteryPassword !== CONTROL_PASSWORD) {
      toast({ title: "Ação Bloqueada", description: "Senha de controle incorreta.", variant: "destructive" });
      return;
    }
    
    captureAndSaveSellerHistory();
    captureAndSaveAdminHistory();
  
    // Expire active/winning tickets in Firestore
    const batch = writeBatch(db);
    allTickets.forEach(ticket => {
        if (ticket.status === 'active' || ticket.status === 'winning' || ticket.status === 'unpaid') {
            const ticketRef = doc(db, 'tickets', ticket.id);
            batch.update(ticketRef, { status: 'expired' });
        }
    });

    // Clear draws in Firestore
    draws.forEach(draw => {
        const drawRef = doc(db, 'draws', draw.id);
        batch.delete(drawRef);
    });

    try {
        await batch.commit();
        toast({
          title: "Nova Loteria Iniciada!",
          description: "Sorteios e bilhetes ativos/premiados foram resetados/expirados.",
          className: "bg-primary text-primary-foreground",
          duration: 3000,
        });
    } catch (e) {
        console.error("Error starting new lottery: ", e);
        toast({ title: "Erro", description: "Falha ao iniciar nova loteria no banco de dados.", variant: "destructive" });
    }

    setStartLotteryPassword('');
    setIsConfirmDialogOpen(false); 
  };

  const handleSaveLotteryConfig = () => {
    const price = parseFloat(ticketPriceInput);
    const commission = parseInt(commissionInput, 10);
    const ownerCommission = parseInt(ownerCommissionInput, 10);
    const clientSalesCommission = parseInt(clientSalesCommissionInput, 10);

    if (isNaN(price) || price <= 0) {
      toast({ title: "Erro de Configuração", description: "Preço do bilhete inválido.", variant: "destructive" });
      return;
    }
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast({ title: "Erro de Configuração", description: "Porcentagem de comissão do vendedor inválida (deve ser entre 0 e 100).", variant: "destructive" });
      return;
    }
    if (isNaN(ownerCommission) || ownerCommission < 0 || ownerCommission > 100) {
      toast({ title: "Erro de Configuração", description: "Porcentagem de comissão geral inválida (deve ser entre 0 e 100).", variant: "destructive" });
      return;
    }
    if (isNaN(clientSalesCommission) || clientSalesCommission < 0 || clientSalesCommission > 100) {
      toast({ title: "Erro de Configuração", description: "Porcentagem de comissão de vendas de cliente inválida (deve ser entre 0 e 100).", variant: "destructive" });
      return;
    }

    const newConfig: LotteryConfig = { 
      ticketPrice: price, 
      sellerCommissionPercentage: commission, 
      ownerCommissionPercentage: ownerCommission,
      clientSalesCommissionToOwnerPercentage: clientSalesCommission
    };

    setLotteryConfig(newConfig);
    localStorage.setItem('lotteryConfig', JSON.stringify(newConfig));
    toast({ title: "Configurações Salvas!", description: "Configurações da loteria atualizadas.", className: "bg-primary text-primary-foreground", duration: 3000 });
  };
  
  const handleSaveCreditRequestConfig = () => {
    const newConfig: CreditRequestConfig = {
      whatsappNumber: whatsappInput.trim(),
      pixKey: pixKeyInput.trim(),
    };
    setCreditRequestConfig(newConfig);
    localStorage.setItem('creditRequestConfig', JSON.stringify(newConfig));
    toast({ title: "Configurações Salvas!", description: "Informações de contato atualizadas.", className: "bg-primary text-primary-foreground", duration: 3000 });
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
    const newBalance = (user.saldo || 0) + amount;
    const userRef = doc(db, 'users', user.id);
    try {
        await updateDoc(userRef, { saldo: newBalance });
        toast({
            title: "Saldo Atualizado!",
            description: `O saldo de ${user.username} agora é R$ ${newBalance.toFixed(2).replace('.', ',')}.`,
            className: "bg-primary text-primary-foreground",
            duration: 3000
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
    if (!userToDelete) return;

    if (currentUser && currentUser.id === userToDelete.id) {
      toast({ title: "Ação Bloqueada", description: "Não é possível excluir o usuário que está logado.", variant: "destructive" });
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      return;
    }
    
    const batch = writeBatch(db);

    // Delete user's tickets
    const ticketsToDelete = allTickets.filter(ticket => ticket.buyerId === userToDelete.id || ticket.sellerId === userToDelete.id);
    ticketsToDelete.forEach(ticket => {
        const ticketRef = doc(db, 'tickets', ticket.id);
        batch.delete(ticketRef);
    });

    // Delete the user
    const userRef = doc(db, 'users', userToDelete.id);
    batch.delete(userRef);
    
    try {
        await batch.commit();
        if (userToView && userToView.id === userToDelete.id) {
            setIsUserViewDialogOpen(false);
            setUserToView(null);
        }
        toast({ title: "Usuário Excluído", description: `O usuário ${userToDelete.username} e todos os seus bilhetes foram removidos.`, className: "bg-destructive text-destructive-foreground", duration: 3000 });
    } catch (e) {
        console.error("Error deleting user: ", e);
        toast({ title: "Erro", description: "Falha ao excluir o usuário no banco de dados.", variant: "destructive" });
    }

    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleSectionChange = (sectionId: AdminSection) => {
    setActiveSection(sectionId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  
  const getUserActiveTicketsCount = useCallback((user: User) => {
    const ticketsToCheck = user.role === 'cliente' ? clientTickets : vendedorTickets;
    const usernameField = user.role === 'cliente' ? 'buyerName' : 'sellerUsername';
    return ticketsToCheck.filter(t => t.status === 'active' && t[usernameField] === user.username).length;
  }, [clientTickets, vendedorTickets]);

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) {
      return allUsers;
    }
    return allUsers.filter(user =>
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [allUsers, userSearchTerm]);

  if (!isClient || isLoading) {
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
          <section aria-labelledby="lottery-settings-heading">
            <h2 id="lottery-settings-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
                <Settings className="mr-3 h-8 w-8 text-primary" />
                Configurações
            </h2>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="geral" className="py-2.5">
                    <PaletteIcon className="mr-2 h-4 w-4" /> Geral
                </TabsTrigger>
                <TabsTrigger value="contas" className="py-2.5">
                    <Users className="mr-2 h-4 w-4" /> Contas
                </TabsTrigger>
                <TabsTrigger value="contato" className="py-2.5">
                    <Contact className="mr-2 h-4 w-4" /> Contato
                </TabsTrigger>
              </TabsList>
              <TabsContent value="geral" className="mt-6">
                <div className="space-y-8">
                  <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
                      <CardHeader>
                          <CardTitle className="text-xl text-center font-semibold">Definir Preços e Comissões</CardTitle>
                          <CardDescription className="text-center text-muted-foreground">
                              Ajuste os valores da loteria.
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="space-y-2">
                              <Label htmlFor="ticketPrice" className="flex items-center">
                                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Preço do Bilhete (R$)
                              </Label>
                              <Input 
                                  id="ticketPrice" 
                                  type="number" 
                                  value={ticketPriceInput}
                                  onChange={(e) => setTicketPriceInput(e.target.value)}
                                  placeholder="Ex: 2.50"
                                  className="bg-background/70"
                                  step="0.01"
                                  min="0.01"
                              />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="sellerCommission" className="flex items-center">
                                  <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Comissão do Vendedor (%)
                              </Label>
                              <Input 
                                  id="sellerCommission" 
                                  type="number" 
                                  value={commissionInput}
                                  onChange={(e) => setCommissionInput(e.target.value)}
                                  placeholder="Ex: 10"
                                  className="bg-background/70"
                                  min="0"
                                  max="100"
                              />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="ownerCommission" className="flex items-center">
                                  <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Comissão Geral (Bolão %)
                              </Label>
                              <Input 
                                  id="ownerCommission" 
                                  type="number" 
                                  value={ownerCommissionInput}
                                  onChange={(e) => setOwnerCommissionInput(e.target.value)}
                                  placeholder="Ex: 5"
                                  className="bg-background/70"
                                  min="0"
                                  max="100"
                              />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="clientSalesCommissionToOwner" className="flex items-center">
                                  <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Comissão Dono (Vendas Cliente %)
                              </Label>
                              <Input 
                                  id="clientSalesCommissionToOwner" 
                                  type="number" 
                                  value={clientSalesCommissionInput}
                                  onChange={(e) => setClientSalesCommissionInput(e.target.value)}
                                  placeholder="Ex: 10"
                                  className="bg-background/70"
                                  min="0"
                                  max="100"
                              />
                          </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                          <Button onClick={handleSaveLotteryConfig} className="bg-primary text-primary-foreground hover:bg-primary/90">
                              <Settings className="mr-2 h-4 w-4" /> Salvar Configurações
                          </Button>
                      </CardFooter>
                  </Card>

                  <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl text-center font-semibold flex items-center justify-center">
                            <PaletteIcon className="mr-2 h-5 w-5" />
                            Tema da Aplicação
                        </CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            Escolha entre o tema claro ou escuro para a interface.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center py-6">
                        <ThemeToggleButton />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="contas" className="mt-6">
                 <div className="space-y-4">
                  <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome de usuário..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <Card key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card/80 backdrop-blur-sm shadow-md">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <Avatar>
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <p className="font-semibold text-foreground">{user.username}</p>
                            <div className="flex items-center gap-x-2 flex-wrap">
                                <Badge variant={user.role === 'vendedor' ? 'secondary' : (user.role === 'admin' ? 'destructive' : 'outline')}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1 border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
                                    <Coins className="h-3 w-3" />
                                    Saldo: R$ {(user.saldo || 0).toFixed(2).replace('.', ',')}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1 border-primary/50 text-primary">
                                    <TicketIcon className="h-3 w-3" />
                                    Ativos: {getUserActiveTicketsCount(user)}
                                </Badge>
                            </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                            <Button variant="outline" size="sm" onClick={() => handleOpenCreditDialog(user)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Saldo
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleOpenViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4"/> Detalhes
                            </Button>
                      </div>
                    </Card>
                  )) : (
                    <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">Nenhum usuário encontrado.</p>
                      <p className="text-sm text-muted-foreground/80">
                        {userSearchTerm ? 'Tente um termo de busca diferente.' : 'Nenhum usuário registrado ainda.'}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="contato" className="mt-6">
                <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                      <CardTitle className="text-xl text-center font-semibold">Informações de Contato</CardTitle>
                      <CardDescription className="text-center text-muted-foreground">
                          Defina as informações que serão exibidas na página de solicitação de saldo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="space-y-2">
                          <Label htmlFor="whatsappNumber">Número do WhatsApp</Label>
                          <Input 
                              id="whatsappNumber" 
                              type="text" 
                              value={whatsappInput}
                              onChange={(e) => setWhatsappInput(e.target.value)}
                              placeholder="Ex: (84) 91234-5678"
                              className="bg-background/70"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="pixKey">Chave Pix</Label>
                          <Input 
                              id="pixKey" 
                              type="text" 
                              value={pixKeyInput}
                              onChange={(e) => setPixKeyInput(e.target.value)}
                              placeholder="Ex: seu-email@provedor.com"
                              className="bg-background/70"
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                      <Button onClick={handleSaveCreditRequestConfig} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <Settings className="mr-2 h-4 w-4" /> Salvar Informações de Contato
                      </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        );
      case 'cadastrar-sorteio':
        return (
          <section aria-labelledby="draw-submission-heading">
            <h2 id="draw-submission-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <PlusCircle className="mr-3 h-8 w-8 text-primary" />
              Cadastrar Novo Sorteio
            </h2>
            <AdminDrawForm onAddDraw={handleAddDraw} hasWinningTickets={winningTickets.length > 0} />
          </section>
        );
      case 'controles-loteria':
        return (
          <section aria-labelledby="lottery-controls-heading">
            <h2 id="lottery-controls-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
              Controles da Loteria
            </h2>
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-destructive/50">
              <CardHeader>
                <CardTitle className="text-xl text-center font-semibold">
                  Gerenciar Ciclo da Loteria
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Esta ação reinicia a loteria, cria um histórico de vendas e expira bilhetes ativos.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="text-base py-3 px-6 shadow-lg hover:shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Rocket className="mr-2 h-5 w-5" /> Iniciar Nova Loteria
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                        Confirmar Nova Loteria?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá salvar um resumo do ciclo de vendas atual, limpar todos os sorteios existentes e marcar todos os bilhetes ativos, premiados e aguardando pagamento como 'expirados'. Esta ação não pode ser desfeita.
                        <br/><br/>
                        <span className="font-bold text-foreground">Digite a senha de controle para confirmar.</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="control-password" className="sr-only">
                          Senha de Controle
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            id="control-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha de Controle"
                            value={startLotteryPassword}
                            onChange={(e) => setStartLotteryPassword(e.target.value)}
                            className="pl-9 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                        </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setStartLotteryPassword('')}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStartNewLottery} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Confirmar e Iniciar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </section>
        );
       case 'relatorios':
        return (
          <section aria-labelledby="financial-reports-heading" className="space-y-12">
            <h2 id="financial-reports-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <PieChart className="mr-3 h-8 w-8 text-primary" />
              Relatórios Financeiros
            </h2>
            <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center font-bold text-primary">Resumo do Ciclo Atual</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Visão geral das finanças baseada nos bilhetes ativos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Users className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Vendas (Clientes)</p>
                        <p className="text-3xl font-bold text-blue-500">
                            R$ {financialReport.clientRevenue.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">{financialReport.clientTicketCount} bilhetes</p>
                    </div>
                     <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Users className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Vendas (Vendedores)</p>
                        <p className="text-3xl font-bold text-orange-500">
                            R$ {financialReport.sellerRevenue.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">{financialReport.sellerTicketCount} bilhetes</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <DollarSign className="h-10 w-10 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Total Arrecadado</p>
                        <p className="text-3xl font-bold text-green-500">
                            R$ {financialReport.totalRevenue.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">{financialReport.clientTicketCount + financialReport.sellerTicketCount} bilhetes</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Percent className="h-10 w-10 text-secondary mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Comissão (Vendedores)</p>
                        <p className="text-3xl font-bold text-secondary">
                            R$ {financialReport.sellerCommission.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Percent className="h-10 w-10 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Comissão (Bolão)</p>
                        <p className="text-3xl font-bold text-primary">
                            R$ {financialReport.ownerCommission.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Trophy className="h-10 w-10 text-accent mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Prêmio Estimado</p>
                        <p className="text-3xl font-bold text-accent">
                            R$ {financialReport.prizePool.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="pt-6">
                    <p className="text-xs text-muted-foreground text-center w-full">
                        Cálculos baseados em todos os bilhetes com status 'ativo'. O prêmio é o total arrecadado menos todas as comissões.
                    </p>
                </CardFooter>
            </Card>

            <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center font-bold text-primary flex items-center justify-center">
                  <BookText className="mr-3 h-6 w-6" />
                  Histórico de Ciclos Anteriores (Admin)
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Resumo financeiro de cada ciclo de loteria encerrado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminHistory.length > 0 ? (
                  <ScrollArea className="h-80 w-full rounded-md border">
                      <Table>
                        <TableCaption>Um registro financeiro de cada ciclo de loteria.</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Data Fim</TableHead>
                            <TableHead className="text-center">Receita Total</TableHead>
                            <TableHead className="text-center">Comissão Vendedores</TableHead>
                            <TableHead className="text-center">Comissão Bolão</TableHead>
                            <TableHead className="text-right">Prêmio Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminHistory.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-center font-medium text-xs whitespace-nowrap">
                                {format(parseISO(entry.endDate), "dd/MM/yy HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-center font-semibold text-green-500">R$ {entry.totalRevenue.toFixed(2).replace('.', ',')}</TableCell>
                              <TableCell className="text-center">R$ {entry.totalSellerCommission.toFixed(2).replace('.', ',')}</TableCell>
                              <TableCell className="text-center">R$ {entry.totalOwnerCommission.toFixed(2).replace('.', ',')}</TableCell>
                              <TableCell className="text-right font-bold text-accent">R$ {entry.totalPrizePool.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-10">Nenhum histórico de ciclo anterior encontrado.</p>
                )}
              </CardContent>
            </Card>
          </section>
        );
      case 'historico-sorteios':
        return (
          <section aria-labelledby="draw-history-heading">
            <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <History className="mr-3 h-8 w-8 text-primary" />
              Resultados dos Sorteios
            </h2>
            <AdminDrawList draws={draws} />
          </section>
        );
      case 'bilhetes-premiados':
        return (
          <section aria-labelledby="winning-tickets-heading">
            <h2 id="winning-tickets-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <Trophy className="mr-3 h-8 w-8 text-accent" />
              Bilhetes Premiados ({winningTickets.length})
            </h2>
            {winningTickets.length > 0 ? (
              <TicketList tickets={winningTickets} draws={draws} />
            ) : (
              <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                <Trophy size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Nenhum bilhete premiado no momento.</p>
              </div>
            )}
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:justify-start">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline-block sm:ml-2">Voltar para Home</span>
            </Button>
          </Link>
          <div className="text-center flex-grow">
             <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                Área Administrativa
             </h1>
             <p className="text-lg text-muted-foreground mt-2">Gerenciamento de Sorteios, Bilhetes e Configurações</p>
          </div>
          <div className="w-10 md:hidden flex items-center justify-center">
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
          </div>
          <div className="hidden md:block w-10"></div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-x-8 gap-y-6 flex-grow mt-8">
        <aside 
          className={cn(
            "bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-md md:sticky md:top-20 md:self-start max-h-[calc(100vh-10rem)] overflow-y-auto transition-transform duration-300 ease-in-out md:translate-x-0",
            "md:w-64 lg:w-72 flex-shrink-0",
            isMobileMenuOpen 
              ? "fixed inset-0 z-40 w-full h-full flex flex-col md:relative md:inset-auto md:h-auto md:w-64 lg:w-72" 
              : "hidden md:flex" 
          )}
        >
          {isMobileMenuOpen && (
            <div className="flex justify-end p-2 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
          <nav className="space-y-2 flex-grow md:flex-grow-0">
            {menuItems.map(item => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start text-sm py-3 px-4 h-auto",
                  activeSection === item.id 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "hover:bg-muted/50 hover:text-primary"
                )}
                onClick={() => handleSectionChange(item.id)}
              >
                <item.Icon className={cn("mr-3 h-5 w-5", activeSection === item.id ? "text-primary-foreground" : "text-primary")} />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>

        <main className={cn("flex-grow", isMobileMenuOpen && "md:ml-0")}>
          {renderSectionContent()}
        </main>
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
                        Tem certeza que deseja excluir o usuário <span className="font-bold">{userToDelete?.username}</span>? Todos os seus bilhetes também serão removidos. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Admin.
        </p>
      </footer>
    </div>
  );
}

    