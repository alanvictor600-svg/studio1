
export interface Ticket {
  id: string;
  numbers: number[];
  status: 'active' | 'expired' | 'winning' | 'awaiting_payment' | 'unpaid';
  createdAt: string; // ISO string for date
  buyerName?: string; // For client tickets, this is the client's username. For seller tickets, the customer's name.
  buyerPhone?: string;
  sellerUsername?: string; // The username of the seller who created the ticket
}

export interface Draw {
  id: string;
  name?: string; // Optional name for the draw
  numbers: number[]; // 5 numbers for admin draw
  createdAt: string; // ISO string for date
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Storing a hash is better, but for simplicity, this might store plain if not careful.
  role: 'cliente' | 'vendedor';
  createdAt: string; // ISO string for date
  credits: number; // User's credit balance
}

export interface LotteryConfig {
  ticketPrice: number;
  sellerCommissionPercentage: number; // Stored as a whole number, e.g., 10 for 10%
  ownerCommissionPercentage: number; // Stored as a whole number, e.g., 5 for 5%
  clientSalesCommissionToOwnerPercentage: number; // Stored as a whole number, e.g., 10 for 10%
}

export interface CreditRequestConfig {
  whatsappNumber: string;
  pixKey: string;
  pixQrCodeUrl: string;
}

export interface SellerHistoryEntry {
  id: string;
  sellerUsername: string; // The user this history entry belongs to
  endDate: string; // ISO string for date when the lottery cycle ended
  activeTicketsCount: number;
  totalRevenue: number;
  totalCommission: number;
}

export interface AdminHistoryEntry {
  id: string;
  endDate: string; // ISO string for date when the lottery cycle ended
  totalRevenue: number;
  totalSellerCommission: number;
  totalOwnerCommission: number;
  totalPrizePool: number;
  clientTicketCount: number;
  sellerTicketCount: number;
}
