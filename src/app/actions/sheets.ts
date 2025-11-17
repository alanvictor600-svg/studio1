// src/app/actions/sheets.ts
'use server';

import { google } from 'googleapis';
import type { Ticket, User, LotteryConfig } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Esta função garante que a chave privada, que pode vir com quebras de linha `\n`, seja formatada corretamente.
const formatPrivateKey = (key: string | undefined) => {
    if (!key) {
        return undefined;
    }
    return key.replace(/\\n/g, '\n');
};

const getGoogleSheetsClient = () => {
    console.log("Tentando obter o cliente do Google Sheets...");

    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    };

    if (!credentials.client_email || !credentials.private_key) {
        console.error("Erro Crítico: Credenciais do Google Sheets não configuradas nas variáveis de ambiente.");
        console.log("GOOGLE_CLIENT_EMAIL está definido?", !!process.env.GOOGLE_CLIENT_EMAIL);
        console.log("GOOGLE_PRIVATE_KEY está definido?", !!process.env.GOOGLE_PRIVATE_KEY);
        return null;
    }

    console.log("Credenciais encontradas. Configurando autenticação JWT...");

    const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    return google.sheets({ version: 'v4', auth });
};

export const appendTicketToSheet = async (ticket: Ticket) => {
    console.log(`Iniciando appendTicketToSheet para o bilhete ID: ${ticket.id}`);
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheets) {
        console.error('Falha ao obter o cliente do Google Sheets. A função será interrompida.');
        throw new Error('Falha ao autenticar com o Google Sheets.');
    }
    if(!spreadsheetId) {
        console.error('Erro Crítico: GOOGLE_SHEET_ID não está definido nas variáveis de ambiente. A função será interrompida.');
        throw new Error('ID da Planilha não configurado no servidor.');
    }

    console.log(`Pronto para enviar dados para a planilha ID: ${spreadsheetId}`);

    // Formata os dados do bilhete para o formato da planilha
    const rowData = [
        format(parseISO(ticket.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        ticket.id,
        ticket.buyerName || '',
        ticket.sellerUsername || 'Cliente (App)',
        ...ticket.numbers, // Adiciona os 10 números do bilhete
        ticket.status,
    ];

    try {
        console.log("Enviando dados para a API do Google Sheets...");
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Bilhetes!A:A', // Nome da aba!Coluna para iniciar. 'A:A' faz o append na primeira linha vazia.
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
        console.log(`Sucesso! Bilhete ID: ${ticket.id} adicionado à planilha.`);
    } catch (error) {
        console.error('ERRO AO ADICIONAR LINHA NO GOOGLE SHEETS:');
        console.error('============================================');
        if (error instanceof Error) {
            console.error('Mensagem de Erro:', error.message);
        }
        console.error('Objeto de Erro Completo:', JSON.stringify(error, null, 2));
        console.error('============================================');
        // Agora, lançamos o erro para que o cliente saiba que a integração falhou.
        throw new Error('Falha ao enviar dados para a planilha.');
    }
};

interface CreateSellerTicketParams {
    seller: User;
    lotteryConfig: LotteryConfig;
    ticketPicks: number[];
    buyerName: string;
    buyerPhone?: string;
}

export const createSellerTicketAction = async ({
    seller,
    lotteryConfig,
    ticketPicks,
    buyerName,
    buyerPhone,
}: CreateSellerTicketParams): Promise<{ createdTicket: Ticket, newBalance: number }> => {
    if (!seller || !seller.id) throw new Error("Vendedor não autenticado.");
    if (ticketPicks.length !== 10) throw new Error("O bilhete deve conter 10 números.");
    if (!buyerName) throw new Error("O nome do comprador é obrigatório.");

    const ticketPrice = lotteryConfig.ticketPrice;
    const userRef = adminDb.collection("users").doc(seller.id);
    
    let createdTicket: Ticket | null = null;
    let newBalance = 0;

    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Usuário do vendedor não encontrado.");
        
        const currentBalance = userDoc.data()?.saldo || 0;
        if (currentBalance < ticketPrice) throw new Error("Saldo insuficiente.");

        newBalance = currentBalance - ticketPrice;
        transaction.update(userRef, { saldo: newBalance });
        
        const newTicketRef = adminDb.collection("tickets").doc();
        const newTicketData: Omit<Ticket, 'id'> = {
            numbers: [...ticketPicks].sort((a,b) => a-b),
            status: 'active',
            createdAt: new Date().toISOString(),
            buyerName: buyerName.trim(),
            buyerPhone: buyerPhone?.trim() || undefined,
            sellerId: seller.id,
            sellerUsername: seller.username,
        };
        transaction.set(newTicketRef, newTicketData);
        createdTicket = { ...newTicketData, id: newTicketRef.id };
    });

    if (!createdTicket) throw new Error("Falha ao criar o bilhete na transação.");
    
    try {
        await appendTicketToSheet(createdTicket);
    } catch (error) {
        console.error("Falha ao enviar bilhete para o Google Sheets (não fatal):", error);
    }

    return { createdTicket, newBalance };
};

interface CreateClientTicketsParams {
    user: User;
    cart: number[][];
    lotteryConfig: LotteryConfig;
}

export const createClientTicketsAction = async ({ user, cart, lotteryConfig }: CreateClientTicketsParams): Promise<{ createdTickets: Ticket[], newBalance: number }> => {
    const totalCost = cart.length * lotteryConfig.ticketPrice;
    const userRef = adminDb.collection("users").doc(user.id);
    const createdTickets: Ticket[] = [];
    let newBalance = 0;

    await adminDb.runTransaction(async (transaction) => {
        const freshUserDoc = await transaction.get(userRef);
        if (!freshUserDoc.exists()) throw new Error("Usuário não encontrado.");
        
        const currentBalance = freshUserDoc.data()?.saldo || 0;
        if (currentBalance < totalCost) throw new Error("Saldo insuficiente.");

        newBalance = currentBalance - totalCost;
        transaction.update(userRef, { saldo: newBalance });

        for (const ticketNumbers of cart) {
            const newTicketRef = adminDb.collection("tickets").doc();
            const newTicketData: Omit<Ticket, 'id'> = {
                numbers: ticketNumbers.sort((a, b) => a - b),
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                buyerName: user.username,
                buyerId: user.id,
            };
            transaction.set(newTicketRef, newTicketData);
            createdTickets.push({ ...newTicketData, id: newTicketRef.id });
        }
    });

    for (const ticket of createdTickets) {
        try {
            await appendTicketToSheet(ticket);
        } catch (error) {
            console.error("Falha ao enviar bilhete para o Google Sheets (não fatal):", error);
        }
    }

    return { createdTickets, newBalance };
};
