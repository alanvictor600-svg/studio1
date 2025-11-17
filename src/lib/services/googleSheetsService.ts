// src/lib/services/googleSheetsService.ts
'use server';

import { google } from 'googleapis';
import type { Ticket } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Esta função garante que a chave privada, que pode vir com quebras de linha `\n`, seja formatada corretamente.
const formatPrivateKey = (key: string | undefined) => {
    if (!key) {
        return undefined;
    }
    return key.replace(/\\n/g, '\n');
};

const getGoogleSheetsClient = () => {
    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    };

    if (!credentials.client_email || !credentials.private_key) {
        console.error("Credenciais do Google Sheets não configuradas nas variáveis de ambiente.");
        return null;
    }

    const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    return google.sheets({ version: 'v4', auth });
};

export const appendTicketToSheet = async (ticket: Ticket) => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheets || !spreadsheetId) {
        console.error('Integração com Google Sheets não está configurada corretamente.');
        // Não lançamos um erro para não quebrar a venda do bilhete
        return;
    }

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
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Bilhetes!A:A', // Nome da aba!Coluna para iniciar. 'A:A' faz o append na primeira linha vazia.
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
    } catch (error) {
        console.error('Erro ao adicionar linha no Google Sheets:', error);
        // Novamente, não lançamos o erro para não impactar o usuário.
        // O ideal aqui seria registrar esse erro em um sistema de logs.
    }
};