export interface Ticket {
  id: string;
  numbers: number[];
  status: 'active' | 'expired' | 'winning';
  createdAt: string; // ISO string for date
}

export interface Draw {
  id: string;
  numbers: number[]; // 5 numbers for admin draw
  createdAt: string; // ISO string for date
}
