
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Draw, Ticket, LotteryConfig, SellerHistoryEntry, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, Rocket, AlertTriangle, Settings, DollarSign, Percent, PlusCircle, ShieldCheck, History, Menu, X, Palette as PaletteIcon, KeyRound, Users, Trash2, Edit, PieChart, User as UserIcon, ShoppingCart } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { UserEditDialog } from '@/components/user-edit-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets';
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const LOTTERY_CONFIG_STORAGE_KEY = 'bolaoPotiguarLotteryConfig';
const SELLER_HISTORY_STORAGE_KEY = 'bolaoPotiguarSellerHistory';
const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';
const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';


const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

type AdminSection = 'configuracoes' | 'cadastrar-sorteio' | 'controles-loteria' | 'historico-sorteios' | 'bilhetes-premiados' | 'gerenciar-contas' | 'relatorios';

const menuItems: { id: AdminSection; label: string; Icon: React.ElementType }[] = [
  { id: 'gerenciar-contas', label: 'Gerenciar Contas', Icon: Users },
  { id: 'configuracoes', label: 'Configurações', Icon: Settings },
  { id: 'cadastrar-sorteio', label: 'Cadastrar Sorteio', Icon: PlusCircle },
  { id: 'controles-loteria', label: 'Controles', Icon: ShieldCheck },
  { id: 'relatorios', label: 'Relatórios', Icon: PieChart },
  { id: 'historico-sorteios', label: 'Histórico Sorteios', Icon: History },
  { id: 'bilhetes-premiados', label: 'Bilhetes Premiados', Icon: Trophy },
];

export default function AdminPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [vendedorTickets, setVendedorTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const [ticketPriceInput, setTicketPriceInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.ticketPrice.toString());
  const [commissionInput, setCommissionInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage.toString());
  const [ownerCommissionInput, setOwnerCommissionInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.ownerCommissionPercentage.toString());
  const [clientSalesCommissionInput, setClientSalesCommissionInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.clientSalesCommissionToOwnerPercentage.toString());
  const [startLotteryPassword, setStartLotteryPassword] = useState('');

  const [activeSection, setActiveSection] = useState<AdminSection>('gerenciar-contas');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for user management
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load lottery data
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) setDraws(JSON.parse(storedDraws));
    
    const storedClientTickets = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
    if (storedClientTickets) setAllTickets(JSON.parse(storedClientTickets));

    const storedVendedorTickets = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    if(storedVendedorTickets) setVendedorTickets(JSON.parse(storedVendedorTickets));

    const storedConfig = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      setLotteryConfig(parsedConfig);
      setTicketPriceInput(parsedConfig.ticketPrice.toString());
      setCommissionInput(parsedConfig.sellerCommissionPercentage.toString());
      setOwnerCommissionInput(parsedConfig.ownerCommissionPercentage?.toString() ?? DEFAULT_LOTTERY_CONFIG.ownerCommissionPercentage.toString());
      setClientSalesCommissionInput(parsedConfig.clientSalesCommissionToOwnerPercentage?.toString() ?? DEFAULT_LOTTERY_CONFIG.clientSalesCommissionToOwnerPercentage.toString());
    } else {
      setTicketPriceInput(DEFAULT_LOTTERY_CONFIG.ticketPrice.toString());
      setCommissionInput(DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage.toString());
      setOwnerCommissionInput(DEFAULT_LOTTERY_CONFIG.ownerCommissionPercentage.toString());
      setClientSalesCommissionInput(DEFAULT_LOTTERY_CONFIG.clientSalesCommissionToOwnerPercentage.toString());
      localStorage.setItem(LOTTERY_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_LOTTERY_CONFIG));
    }
    
    // Load user data
    const storedUsers = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (storedUsers) setAllUsers(JSON.parse(storedUsers));

  }, []); 

  const allSystemTickets = useMemo(() => [...allTickets, ...vendedorTickets], [allTickets, vendedorTickets]);

  useEffect(() => {
    if (isClient) {
      const processedClientTickets = updateTicketStatusesBasedOnDraws(allTickets, draws);
      if (JSON.stringify(processedClientTickets) !== JSON.stringify(allTickets)) {
         setAllTickets(processedClientTickets);
      }
      localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(processedClientTickets));
      
      const processedVendedorTickets = updateTicketStatusesBasedOnDraws(vendedorTickets, draws);
      if (JSON.stringify(processedVendedorTickets) !== JSON.stringify(vendedorTickets)) {
         setVendedorTickets(processedVendedorTickets);
      }
      localStorage.setItem(VENDEDOR_TICKETS_STORAGE_KEY, JSON.stringify(processedVendedorTickets));
    }
  }, [allTickets, vendedorTickets, draws, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(DRAWS_STORAGE_KEY, JSON.stringify(draws));
    }
  }, [draws, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOTTERY_CONFIG_STORAGE_KEY, JSON.stringify(lotteryConfig));
    }
  }, [lotteryConfig, isClient]);
  
  useEffect(() => {
    if (isClient) {
        localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(allUsers));
    }
  }, [allUsers, isClient]);

  const winningTickets = useMemo(() => {
    return allSystemTickets.filter(ticket => ticket.status === 'winning');
  }, [allSystemTickets]);

  const financialReport = useMemo(() => {
    const activeClientTickets = allTickets.filter(t => t.status === 'active');
    const activeVendedorTickets = vendedorTickets.filter(t => t.status === 'active');
    
    const price = lotteryConfig.ticketPrice || 0;
    const sellerCommPercent = lotteryConfig.sellerCommissionPercentage || 0;
    const ownerCommPercent = lotteryConfig.ownerCommissionPercentage || 0;
    const clientSalesCommPercent = lotteryConfig.clientSalesCommissionToOwnerPercentage || 0;
    
    const clientTicketCount = activeClientTickets.length;
    const sellerTicketCount = activeVendedorTickets.length;

    const clientRevenue = clientTicketCount * price;
    const sellerRevenue = sellerTicketCount * price;
    const totalRevenue = clientRevenue + sellerRevenue;

    const sellerCommission = sellerRevenue * (sellerCommPercent / 100);
    const ownerBaseCommission = totalRevenue * (ownerCommPercent / 100);
    const ownerExtraCommission = clientRevenue * (clientSalesCommPercent / 100);
    const totalOwnerCommission = ownerBaseCommission + ownerExtraCommission;

    const prizePool = totalRevenue - sellerCommission - totalOwnerCommission;

    return {
      totalRevenue,
      sellerCommission,
      ownerCommission: totalOwnerCommission,
      prizePool,
      clientRevenue,
      sellerRevenue,
      clientTicketCount,
      sellerTicketCount
    };
  }, [allTickets, vendedorTickets, lotteryConfig]);


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
      numbers: newNumbers.sort((a, b) => a - b),
      createdAt: new Date().toISOString(),
      name: name || undefined,
    };
    setDraws(prevDraws => [newDraw, ...prevDraws]);
    toast({ title: "Sorteio Cadastrado!", description: "O novo sorteio foi registrado com sucesso.", className: "bg-primary text-primary-foreground" });
  };
  
  const captureAndSaveSellerHistory = () => {
    const sellerTicketsRaw = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    const sellerTickets: Ticket[] = sellerTicketsRaw ? JSON.parse(sellerTicketsRaw) : [];
    
    const configRaw = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    const currentConfig: LotteryConfig = configRaw ? JSON.parse(configRaw) : DEFAULT_LOTTERY_CONFIG;
    
    const activeTickets = sellerTickets.filter(ticket => ticket.status === 'active');
    const activeSellerTicketsCount = activeTickets.length;
    const totalRevenueFromActiveTickets = activeSellerTicketsCount * currentConfig.ticketPrice;
    const commissionEarned = totalRevenueFromActiveTickets * (currentConfig.sellerCommissionPercentage / 100);

    const newHistoryEntry: SellerHistoryEntry = {
      id: uuidv4(),
      endDate: new Date().toISOString(),
      activeTicketsCount: activeSellerTicketsCount,
      totalRevenue: totalRevenueFromActiveTickets,
      totalCommission: commissionEarned,
    };

    const historyRaw = localStorage.getItem(SELLER_HISTORY_STORAGE_KEY);
    const history: SellerHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.push(newHistoryEntry);
    localStorage.setItem(SELLER_HISTORY_STORAGE_KEY, JSON.stringify(history));

    toast({ title: "Histórico do Vendedor Salvo!", description: "Um resumo do ciclo de vendas atual foi salvo.", className: "bg-secondary text-secondary-foreground" });
  };


  const handleStartNewLottery = () => {
    const CONTROL_PASSWORD = "Al@n2099";
    if (startLotteryPassword !== CONTROL_PASSWORD) {
      toast({ title: "Ação Bloqueada", description: "Senha de controle incorreta.", variant: "destructive" });
      return;
    }
    
    captureAndSaveSellerHistory();
  
    setDraws([]);
    
    // Process client tickets
    setAllTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticket.status === 'active' || ticket.status === 'winning') {
          return { ...ticket, status: 'expired' as Ticket['status'] };
        }
        return ticket;
      })
    );
    
    // Process seller tickets
    setVendedorTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticket.status === 'active' || ticket.status === 'winning') {
          return { ...ticket, status: 'expired' as Ticket['status'] };
        }
        return ticket;
      })
    );


    toast({
      title: "Nova Loteria Iniciada!",
      description: "Sorteios anteriores e bilhetes ativos/premiados foram resetados/expirados.",
      className: "bg-primary text-primary-foreground",
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
    toast({ title: "Configurações Salvas!", description: "Configurações da loteria atualizadas.", className: "bg-primary text-primary-foreground" });
  };
  
  // User Management Handlers
  const handleOpenEditUser = (user: User) => {
    setUserToEdit(user);
    setIsUserEditDialogOpen(true);
  };

  const handleSaveUser = (updatedUser: User) => {
    setAllUsers(prevUsers => {
        const isUsernameTaken = prevUsers.some(u => u.username === updatedUser.username && u.id !== updatedUser.id);
        if (isUsernameTaken) {
            toast({ title: "Erro ao Salvar", description: `O nome de usuário "${updatedUser.username}" já está em uso.`, variant: "destructive" });
            return prevUsers; // Return original state if username is taken
        }
        toast({ title: "Usuário Atualizado!", description: `Os dados de ${updatedUser.username} foram salvos.`, className: "bg-primary text-primary-foreground" });
        return prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
    });
    setIsUserEditDialogOpen(false);
    setUserToEdit(null);
  };
  
  const handleConfirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    // Prevent deleting the currently logged-in user for safety
    const loggedInUserRaw = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
    if(loggedInUserRaw && loggedInUserRaw === userToDelete.username) {
        toast({ title: "Ação Bloqueada", description: "Não é possível excluir o usuário que está logado.", variant: "destructive" });
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
        return;
    }

    setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    toast({ title: "Usuário Excluído", description: `O usuário ${userToDelete.username} foi removido.`, className: "bg-destructive text-destructive-foreground" });
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };


  const handleSectionChange = (sectionId: AdminSection) => {
    setActiveSection(sectionId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Admin...</p>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'gerenciar-contas':
        return (
          <section aria-labelledby="user-management-heading">
            <h2 id="user-management-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
                <Users className="mr-3 h-8 w-8 text-primary" />
                Gerenciar Contas de Usuários
            </h2>
            <div className="space-y-4">
              {allUsers.length > 0 ? allUsers.map(user => (
                <Card key={user.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-card/80 backdrop-blur-sm shadow-md">
                   <div className="flex items-center gap-4 mb-4 sm:mb-0">
                     <Avatar>
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <div className="flex-grow">
                        <p className="font-semibold text-foreground">{user.username}</p>
                        <Badge variant={user.role === 'vendedor' ? 'secondary' : 'outline'}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                     </div>
                   </div>
                   <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4"/> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleConfirmDeleteUser(user)}>
                            <Trash2 className="mr-2 h-4 w-4"/> Excluir
                        </Button>
                   </div>
                </Card>
              )) : (
                <p className="text-center text-muted-foreground py-10">Nenhum usuário registrado.</p>
              )}
            </div>
          </section>
        );
      case 'configuracoes':
        return (
          <section aria-labelledby="lottery-settings-heading">
            <h2 id="lottery-settings-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
                <Settings className="mr-3 h-8 w-8 text-primary" />
                Configurações da Loteria
            </h2>
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
                        Esta ação irá salvar um resumo do ciclo de vendas atual do vendedor, limpar todos os sorteios existentes e marcar todos os bilhetes ativos e premiados como expirados. Esta ação não pode ser desfeita.
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
          <section aria-labelledby="financial-reports-heading">
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
                    {/* Vendas Clientes */}
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <UserIcon className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Vendas (Clientes)</p>
                        <p className="text-3xl font-bold text-blue-500">
                            R$ {financialReport.clientRevenue.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">{financialReport.clientTicketCount} bilhetes</p>
                    </div>
                    {/* Vendas Vendedores */}
                     <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <ShoppingCart className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Vendas (Vendedores)</p>
                        <p className="text-3xl font-bold text-orange-500">
                            R$ {financialReport.sellerRevenue.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">{financialReport.sellerTicketCount} bilhetes</p>
                    </div>
                    {/* Total Arrecadado */}
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <DollarSign className="h-10 w-10 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Total Arrecadado</p>
                        <p className="text-3xl font-bold text-green-500">
                            R$ {financialReport.totalRevenue.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">{financialReport.clientTicketCount + financialReport.sellerTicketCount} bilhetes</p>
                    </div>
                    {/* Comissão Vendedores */}
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Percent className="h-10 w-10 text-secondary mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Comissão (Vendedores)</p>
                        <p className="text-3xl font-bold text-secondary">
                            R$ {financialReport.sellerCommission.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                    {/* Comissão Bolão */}
                    <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                        <Percent className="h-10 w-10 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Comissão (Bolão)</p>
                        <p className="text-3xl font-bold text-primary">
                            R$ {financialReport.ownerCommission.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                    {/* Prêmio Estimado */}
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
          </section>
        );
      case 'historico-sorteios':
        return (
          <section aria-labelledby="draw-history-heading">
            <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <History className="mr-3 h-8 w-8 text-primary" />
              Histórico de Sorteios
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
          <div className="w-10 md:hidden"> {/* Placeholder for hamburger button */}
             <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
          </div>
          <div className="hidden md:block w-[150px] sm:w-[180px] md:w-[200px]"></div> 
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-x-8 gap-y-6 flex-grow mt-8">
        {/* Vertical Menu - Mobile: Overlay, Desktop: Sticky Sidebar */}
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

        {/* Content Area */}
        <main className={cn("flex-grow", isMobileMenuOpen && "md:ml-0")}>
          {renderSectionContent()}
        </main>
      </div>

      {userToEdit && (
          <UserEditDialog
              isOpen={isUserEditDialogOpen}
              onOpenChange={setIsUserEditDialogOpen}
              user={userToEdit}
              onSave={handleSaveUser}
              onClose={() => setUserToEdit(null)}
          />
      )}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tem certeza que deseja excluir o usuário <span className="font-bold">{userToDelete?.username}</span>? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Admin.
        </p>
      </footer>
    </div>
  );
}
    

    


