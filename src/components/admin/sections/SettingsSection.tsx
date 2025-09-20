
"use client";

import { useState, useCallback, useMemo, type FC, useEffect } from 'react';
import type { User, Ticket, LotteryConfig, CreditRequestConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Settings, Palette as PaletteIcon, Users, Contact, DollarSign, Percent, Search, CreditCard, Eye, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const USERS_PER_PAGE = 15;

interface SettingsSectionProps {
  lotteryConfig: LotteryConfig;
  creditRequestConfig: CreditRequestConfig;
  allTickets: Ticket[];
  onSaveLotteryConfig: (newConfig: Partial<LotteryConfig>) => Promise<void>;
  onSaveCreditRequestConfig: (newConfig: CreditRequestConfig) => Promise<void>;
  onOpenCreditDialog: (user: User) => void;
  onOpenViewUser: (user: User) => void;
}

export const SettingsSection: FC<SettingsSectionProps> = ({
  lotteryConfig,
  creditRequestConfig,
  allTickets,
  onSaveLotteryConfig,
  onSaveCreditRequestConfig,
  onOpenCreditDialog,
  onOpenViewUser,
}) => {
  const { toast } = useToast();
  const [ticketPriceInput, setTicketPriceInput] = useState(lotteryConfig.ticketPrice.toString());
  const [commissionInput, setCommissionInput] = useState(lotteryConfig.sellerCommissionPercentage.toString());
  const [ownerCommissionInput, setOwnerCommissionInput] = useState(lotteryConfig.ownerCommissionPercentage.toString());
  const [clientSalesCommissionInput, setClientSalesCommissionInput] = useState(lotteryConfig.clientSalesCommissionToOwnerPercentage.toString());
  const [whatsappInput, setWhatsappInput] = useState(creditRequestConfig.whatsappNumber);
  const [pixKeyInput, setPixKeyInput] = useState(creditRequestConfig.pixKey);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Pagination state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchUsers = useCallback(async (loadMore = false) => {
    if (loadMore) {
        setIsFetchingMore(true);
    } else {
        setIsLoadingUsers(true);
    }
    
    try {
        const userQueryConstraints = [
            orderBy("username"),
            limit(USERS_PER_PAGE)
        ];

        if (loadMore && lastVisible) {
            userQueryConstraints.push(startAfter(lastVisible));
        }
        
        const q = query(collection(db, 'users'), ...userQueryConstraints);
        const documentSnapshots = await getDocs(q);

        const newUsers = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);
        setHasMore(newUsers.length === USERS_PER_PAGE);

        if (loadMore) {
            setUsers(prev => [...prev, ...newUsers]);
        } else {
            setUsers(newUsers);
        }

    } catch (error) {
        console.error("Error fetching users: ", error);
        toast({ title: "Erro ao Carregar Usuários", description: "Não foi possível buscar a lista de usuários.", variant: "destructive" });
    } finally {
        setIsLoadingUsers(false);
        setIsFetchingMore(false);
    }
  }, [toast, lastVisible]);

  useEffect(() => {
    fetchUsers(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveLottery = () => {
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

    onSaveLotteryConfig({ 
      ticketPrice: price, 
      sellerCommissionPercentage: commission, 
      ownerCommissionPercentage: ownerCommission,
      clientSalesCommissionToOwnerPercentage: clientSalesCommission
    });
  };

  const handleSaveContact = () => {
    onSaveCreditRequestConfig({
      whatsappNumber: whatsappInput.trim(),
      pixKey: pixKeyInput.trim(),
    });
  };

  const getUserActiveTicketsCount = useCallback((user: User) => {
    const idField = user.role === 'cliente' ? 'buyerId' : 'sellerId';
    return allTickets.filter(t => t.status === 'active' && t[idField] === user.id).length;
  }, [allTickets]);

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) {
      return users;
    }
    return users.filter(user =>
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

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
                    <Button onClick={handleSaveLottery} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
            <Card className="bg-card/80 backdrop-blur-sm shadow-md">
              <CardHeader>
                  <div className="mb-4 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                      placeholder="Pesquisar por nome de usuário (na lista carregada)..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 h-10 w-full"
                      />
                  </div>
              </CardHeader>
              <CardContent>
              <ScrollArea className="h-96">
                {isLoadingUsers ? (
                  <p className="text-center text-muted-foreground py-10">Carregando usuários...</p>
                ) : (
                  <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead className="text-center">Saldo</TableHead>
                        <TableHead className="text-center">Bilhetes Ativos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-foreground">{user.username}</span>
                            </div>
                            </TableCell>
                            <TableCell>
                            <Badge variant={user.role === 'vendedor' ? 'secondary' : (user.role === 'admin' ? 'destructive' : 'outline')}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono text-yellow-600 dark:text-yellow-400">
                            R$ {(user.saldo || 0).toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                            {getUserActiveTicketsCount(user)}
                            </TableCell>
                            <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => onOpenCreditDialog(user)}>
                                    <CreditCard className="mr-2 h-4 w-4" /> Saldo
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => onOpenViewUser(user)}>
                                    <Eye className="mr-2 h-4 w-4"/> Detalhes
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <p className="text-lg text-muted-foreground">Nenhum usuário encontrado.</p>
                                    <p className="text-sm text-muted-foreground/80">
                                      {userSearchTerm ? 'Tente um termo de busca diferente.' : 'Nenhum usuário registrado ainda.'}
                                  </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
              </CardContent>
              {hasMore && !userSearchTerm && (
                  <CardFooter className="pt-4 justify-center">
                      <Button
                          onClick={() => fetchUsers(true)}
                          disabled={isFetchingMore}
                      >
                          {isFetchingMore ? (
                              <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando...
                              </>
                          ) : (
                              'Carregar Mais Usuários'
                          )}
                      </Button>
                  </CardFooter>
              )}
            </Card>
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
                <Button onClick={handleSaveContact} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Settings className="mr-2 h-4 w-4" /> Salvar Informações de Contato
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

    

    