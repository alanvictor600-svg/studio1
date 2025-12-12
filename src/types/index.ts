

export interface Ticket {
  id: string;
  numbers: number[];
  status: 'active' | 'expired' | 'winning' | 'awaiting_payment' | 'unpaid';
  createdAt: string; // ISO string for date
  buyerName?: string; // For client tickets, this is the client's username. For seller tickets, the customer's name.
  buyerPhone?: string;
  sellerUsername?: string | null; // The username of the seller who created the ticket. Null for client tickets.
  buyerId?: string; // Firestore document ID of the user who bought it (if they are a registered client)
  sellerId?: string; // Firestore document ID of the user who sold it
  participants: string[]; // Array of user IDs (buyerId, sellerId) who can view the ticket
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
  role: 'cliente' | 'vendedor' | 'admin';
  createdAt: string; // ISO string for date
  saldo: number; // User's balance
}

export interface LotteryConfig {
  ticketPrice: number;
  sellerCommissionPercentage: number; // Stored as a whole number, e.g., 10 for 10%
  ownerCommissionPercentage: number; // Stored as a whole number, e.g., 5 for 5%
  clientSalesCommissionToOwnerPercentage: number; // Stored as a whole number, e.g., 10 for 10%
  configVersion?: number; // Timestamp to force client-side updates
}

export interface CreditRequestConfig {
  whatsappNumber: string;
  pixKey: string;
}

export interface SellerHistoryEntry {
  id: string;
  sellerId: string; // The user ID this history entry belongs to
  sellerUsername: string | null; // Denormalized for easier querying/display
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

export interface RankedTicket extends Ticket {
  matches: number;
}
