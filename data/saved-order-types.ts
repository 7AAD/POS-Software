import type { CartLine, OrderDetails } from './order-types';

export interface OrderSnapshot {
  lines: CartLine[];
  details: OrderDetails;
}

export interface SavedOrder extends OrderSnapshot {
  id: string;
  number: number;
  revision: number;
  totalPaisa: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveOrderInput extends OrderSnapshot {
  id: string;
  expectedRevision: number;
}
