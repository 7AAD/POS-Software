import type { OrderSnapshot } from './saved-order-types';

export const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'bank-transfer', label: 'Bank transfer' },
] as const;

export type PaymentMethod = typeof paymentMethods[number]['value'];

export interface PaymentInput {
  id: string;
  orderId: string;
  expectedRevision: number;
  expectedTotalPaisa: number;
  method: PaymentMethod;
  receivedPaisa: number;
  confirmedReceived: boolean;
  reference: string;
}

export interface CompletedSale extends OrderSnapshot {
  id: string;
  orderId: string;
  orderNumber: number;
  orderRevision: number;
  totalPaisa: number;
  method: PaymentMethod;
  receivedPaisa: number;
  changePaisa: number;
  confirmedReceived: boolean;
  reference: string;
  paidAt: string;
}
