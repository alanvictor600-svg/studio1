
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Draw, Ticket, LotteryConfig, SellerHistoryEntry, User, AdminHistoryEntry, CreditRequestConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, Rocket, AlertTriangle, Settings, DollarSign, Percent, PlusCircle, ShieldCheck, History, Menu, X, Palette as PaletteIcon, KeyRound, Users, Trash2, Edit, PieChart, BookText, Search, Coins, CreditCard, Contact, Eye } from 'lucide-react';
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

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets';
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const LOTTERY_CONFIG_STORAGE_KEY = 'bolaoPotiguarLotteryConfig';
const SELLER_HISTORY_STORAGE_KEY = 'bolaoPotiguarSellerHistory';
const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';
const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';
const ADMIN_HISTORY_STORAGE_KEY = 'bolaoPotiguarAdminHistory';
const CREDIT_REQUEST_CONFIG_STORAGE_KEY = 'bolaoPotiguarCreditRequestConfig';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

const DEFAULT_CREDIT_CONFIG: CreditRequestConfig = {
    whatsappNumber: '',
    pixKey: '',
    pixQrCodeUrl: ''
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
  const [clientTickets, setClientTickets] = useState<Ticket[]>([]);
  const [vendedorTickets, setVendedorTickets] = useState<Ticket[]>([]);
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

  const [whatsappInput, setWhatsappInput] = useState('');
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [pixQrCodeUrlInput, setPixQrCodeUrlInput] = useState('');

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

  // Load all data from localStorage on component mount
  useEffect(() => {
    setIsClient(true);
    
    try {
        const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
        const initialDraws = storedDraws ? JSON.parse(storedDraws) : [];
        setDraws(initialDraws);

        const storedClientTickets = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
        const initialClientTickets = storedClientTickets ? JSON.parse(storedClientTickets) : [];
        setClientTickets(updateTicketStatusesBasedOnDraws(initialClientTickets, initialDraws));

        const storedVendedorTickets = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
        const initialVendedorTickets = storedVendedorTickets ? JSON.parse(storedVendedorTickets) : [];
        setVendedorTickets(updateTicketStatusesBasedOnDraws(initialVendedorTickets, initialDraws));

        const storedConfig = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
        const initialConfig = storedConfig ? JSON.parse(storedConfig) : DEFAULT_LOTTERY_CONFIG;
        setLotteryConfig(initialConfig);
        setTicketPriceInput(initialConfig.ticketPrice.toString());
        setCommissionInput(initialConfig.sellerCommissionPercentage.toString());
        setOwnerCommissionInput((initialConfig.ownerCommissionPercentage || 0).toString());
        setClientSalesCommissionInput((initialConfig.clientSalesCommissionToOwnerPercentage || 0).toString());

        const storedCreditConfig = localStorage.getItem(CREDIT_REQUEST_CONFIG_STORAGE_KEY);
        const initialCreditConfig = storedCreditConfig ? JSON.parse(storedCreditConfig) : DEFAULT_CREDIT_CONFIG;
        setCreditRequestConfig(initialCreditConfig);
        setWhatsappInput(initialCreditConfig.whatsappNumber);
        setPixKeyInput(initialCreditConfig.pixKey);
        setPixQrCodeUrlInput(initialCreditConfig.pixQrCodeUrl);

        const storedUsers = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        setAllUsers(storedUsers ? JSON.parse(storedUsers) : []);
        
        const storedAdminHistory = localStorage.getItem(ADMIN_HISTORY_STORAGE_KEY);
        setAdminHistory(storedAdminHistory ? JSON.parse(storedAdminHistory) : []);
    } catch (error) {
        console.error("Failed to load data from localStorage on admin page:", error);
        toast({
            title: "Erro ao Carregar Dados",
            description: "Não foi possível carregar os dados do sistema. Tente limpar o cache do navegador.",
            variant: "destructive"
        });
    }
  }, [toast]);

  // Save draws to localStorage whenever they change
  useEffect(() => {
    if (isClient) localStorage.setItem(DRAWS_STORAGE_KEY, JSON.stringify(draws));
  }, [draws, isClient]);
  
  // Save tickets to localStorage whenever they change
  useEffect(() => {
    if (isClient) localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(clientTickets));
  }, [clientTickets, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem(VENDEDOR_TICKETS_STORAGE_KEY, JSON.stringify(vendedorTickets));
  }, [vendedorTickets, isClient]);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (isClient) localStorage.setItem(LOTTERY_CONFIG_STORAGE_KEY, JSON.stringify(lotteryConfig));
  }, [lotteryConfig, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem(CREDIT_REQUEST_CONFIG_STORAGE_KEY, JSON.stringify(creditRequestConfig));
  }, [creditRequestConfig, isClient]);
  
  // Save users to localStorage whenever they change
  useEffect(() => {
    if (isClient) localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers, isClient]);
  
  // Save admin history to localStorage whenever it changes
  useEffect(() => {
    if (isClient) localStorage.setItem(ADMIN_HISTORY_STORAGE_KEY, JSON.stringify(adminHistory));
  }, [adminHistory, isClient]);

  const allSystemTickets = [...clientTickets, ...vendedorTickets];

  const winningTickets = allSystemTickets.filter(ticket => ticket.status === 'winning');
  
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

    if (isClient) {
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
    }
    return report;
  }, [clientTickets, vendedorTickets, lotteryConfig, isClient]);


  const handleAddDraw = (newNumbers: number[], name?: string) => {
    if (winningTickets.length > 0) {
      toast({ title: "Ação Bloqueada", description: "Não é possível cadastrar sorteios enquanto houver bilhetes premiados. Inicie uma nova loteria.", variant: "destructive" });
      return;
    }
    if (newNumbers.length !== 5) {
      toast({ title: "Erro de Validação", description: "O sorteio deve conter exatamente 5 números.", variant: "destructive" });
      return;
    }

    const newDraw: Draw = {
      id: uuidv4(),
      numbers: newNumbers,
      createdAt: new Date().toISOString(),
      name: name || undefined,
    };
    const updatedDraws = [newDraw, ...draws];
    setDraws(updatedDraws);

    // Update ticket statuses based on the new draw
    setClientTickets(updateTicketStatusesBasedOnDraws(clientTickets, updatedDraws));
    setVendedorTickets(updateTicketStatusesBasedOnDraws(vendedorTickets, updatedDraws));
    
    toast({ title: "Sorteio Cadastrado!", description: "O novo sorteio foi registrado.", className: "bg-primary text-primary-foreground", duration: 3000 });
  };
  
  const captureAndSaveSellerHistory = useCallback(() => {
    const sellerTicketsRaw = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    const sellerTickets: Ticket[] = sellerTicketsRaw ? JSON.parse(sellerTicketsRaw) : [];
    
    const configRaw = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    const currentConfig: LotteryConfig = configRaw ? JSON.parse(configRaw) : DEFAULT_LOTTERY_CONFIG;
    
    const historyRaw = localStorage.getItem(SELLER_HISTORY_STORAGE_KEY);
    const existingHistory: SellerHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];

    const sellers = allUsers.filter(u => u.role === 'vendedor');

    sellers.forEach(seller => {
        const activeTickets = sellerTickets.filter(ticket => ticket.status === 'active' && ticket.sellerUsername === seller.username);
        const activeSellerTicketsCount = activeTickets.length;
        const totalRevenueFromActiveTickets = activeSellerTicketsCount * currentConfig.ticketPrice;
        const commissionEarned = totalRevenueFromActiveTickets * (currentConfig.sellerCommissionPercentage / 100);

        if (activeSellerTicketsCount > 0) {
            const newHistoryEntry: SellerHistoryEntry = {
              id: `${seller.username}-${new Date().toISOString()}`,
              sellerUsername: seller.username,
              endDate: new Date().toISOString(),
              activeTicketsCount: activeSellerTicketsCount,
              totalRevenue: totalRevenueFromActiveTickets,
              totalCommission: commissionEarned,
            };
            existingHistory.push(newHistoryEntry);
        }
    });

    localStorage.setItem(SELLER_HISTORY_STORAGE_KEY, JSON.stringify(existingHistory));
    toast({ title: "Histórico de Vendedores Salvo!", description: "Um resumo do ciclo de vendas atual foi salvo para cada vendedor.", className: "bg-secondary text-secondary-foreground", duration: 3000 });
  }, [allUsers, toast]);
  
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
      setAdminHistory(prevHistory => [...prevHistory, newHistoryEntry]);
      toast({ title: "Histórico do Admin Salvo!", description: "Um resumo financeiro do ciclo atual foi salvo.", className: "bg-secondary text-secondary-foreground", duration: 3000 });
  }, [financialReport, toast]);

  const handleStartNewLottery = () => {
    const CONTROL_PASSWORD = "Al@n2099";
    if (startLotteryPassword !== CONTROL_PASSWORD) {
      toast({ title: "Ação Bloqueada", description: "Senha de controle incorreta.", variant: "destructive" });
      return;
    }
    
    captureAndSaveSellerHistory();
    captureAndSaveAdminHistory();
  
    setDraws([]);
    
    const expireStatuses: Ticket['status'][] = ['active', 'winning', 'unpaid'];
    setClientTickets(prev => prev.map(t => expireStatuses.includes(t.status) ? { ...t, status: 'expired' } : t));
    setVendedorTickets(prev => prev.map(t => expireStatuses.includes(t.status) ? { ...t, status: 'expired' } : t));

    toast({
      title: "Nova Loteria Iniciada!",
      description: "Sorteios e bilhetes ativos/premiados foram resetados/expirados.",
      className: "bg-primary text-primary-foreground",
      duration: 3000,
    });
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
    setLotteryConfig({ 
      ticketPrice: price, 
      sellerCommissionPercentage: commission, 
      ownerCommissionPercentage: ownerCommission,
      clientSalesCommissionToOwnerPercentage: clientSalesCommission
    });
    toast({ title: "Configurações Salvas!", description: "Configurações da loteria atualizadas.", className: "bg-primary text-primary-foreground", duration: 3000 });
  };
  
  const handleSaveCreditRequestConfig = () => {
    setCreditRequestConfig({
      whatsappNumber: whatsappInput.trim(),
      pixKey: pixKeyInput.trim(),
      pixQrCodeUrl: pixQrCodeUrlInput.trim()
    });
    toast({ title: "Configurações Salvas!", description: "Informações de contato para solicitação de crédito atualizadas.", className: "bg-primary text-primary-foreground", duration: 3000 });
  };

  const handleOpenViewUser = (user: User) => {
    setUserToView(user);
    setIsUserViewDialogOpen(true);
  };
  
  const handleOpenCreditDialog = (user: User) => {
    setUserToManageCredits(user);
    setIsCreditDialogOpen(true);
  };
  
  const handleCreditChange = (user: User, amount: number) => {
    const updatedUser = { ...user, credits: (user.credits || 0) + amount };
    const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
    setAllUsers(updatedUsers);

    const loggedInUserRaw = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
    if (loggedInUserRaw) {
        const loggedInUser = JSON.parse(loggedInUserRaw);
        if (loggedInUser.id === user.id) {
            localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
    }

    toast({
        title: "Créditos Atualizados!",
        description: `O saldo de ${user.username} agora é R$ ${updatedUser.credits.toFixed(2).replace('.', ',')}.`,
        className: "bg-primary text-primary-foreground",
        duration: 3000
    });
    setIsCreditDialogOpen(false);
    setUserToManageCredits(null);
  };

  const handleConfirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    const loggedInUserRaw = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
    if (loggedInUserRaw) {
      const currentUser = JSON.parse(loggedInUserRaw);
      if (currentUser && currentUser.username === userToDelete.username) {
          toast({ title: "Ação Bloqueada", description: "Não é possível excluir o usuário que está logado.", variant: "destructive" });
          setIsDeleteConfirmOpen(false);
          setUserToDelete(null);
          return;
      }
    }
    
    // Remove tickets associated with the user
    if (userToDelete.role === 'vendedor') {
      setVendedorTickets(prev => prev.filter(ticket => ticket.sellerUsername !== userToDelete.username));
    }
    // For clients, buyerName is their username
    setClientTickets(prev => prev.filter(ticket => ticket.buyerName !== userToDelete.username));
    

    // Remove the user
    setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    
    // Close the details dialog if the deleted user was being viewed
    if (userToView && userToView.id === userToDelete.id) {
        setIsUserViewDialogOpen(false);
        setUserToView(null);
    }

    toast({ title: "Usuário Excluído", description: `O usuário ${userToDelete.username} e todos os seus bilhetes foram removidos.`, className: "bg-destructive text-destructive-foreground", duration: 3000 });
    
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleSectionChange = (sectionId: AdminSection) => {
    setActiveSection(sectionId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) {
      return allUsers;
    }
    return allUsers.filter(user =>
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [allUsers, userSearchTerm]);

  if (!isClient) {
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
                            <div className="flex items-center gap-x-4">
                                <Badge variant={user.role === 'vendedor' ? 'secondary' : 'outline'}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1 border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
                                    <Coins className="h-3 w-3" />
                                    Créditos: R$ {(user.credits || 0).toFixed(2).replace('.', ',')}
                                </Badge>
                            </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                            <Button variant="outline" size="sm" onClick={() => handleOpenCreditDialog(user)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Créditos
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
                          Defina as informações que serão exibidas na página de solicitação de crédito.
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
                      <div className="space-y-2">
                          <Label htmlFor="pixQrCodeUrl">URL da Imagem do QR Code Pix</Label>
                          <Input 
                              id="pixQrCodeUrl" 
                              type="text" 
                              value={pixQrCodeUrlInput}
                              onChange={(e) => setPixQrCodeUrlInput(e.target.value)}
                              placeholder="Ex: https://meusite.com/qrcode.png"
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
                            type="password"
                            placeholder="Senha de Controle"
                            value={startLotteryPassword}
                            onChange={(e) => setStartLotteryPassword(e.target.value)}
                            className="pl-9"
                            />
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
                          {adminHistory.slice().reverse().map((entry) => (
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
