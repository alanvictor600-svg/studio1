// src/services/lottery-service.ts
import type { LotteryConfig } from '@/types';

const DEFAULT_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

export const getLotteryConfig = (): LotteryConfig => {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }
  const savedConfig = localStorage.getItem('lotteryConfig');
  return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;
};

    