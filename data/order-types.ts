export const maxOrderQuantity = 99;

export interface OrderChoiceSnapshot {
  label: string;
  name: string;
  premium: boolean;
}

export interface CartLine {
  id: string;
  menuItemId: string;
  variantId: string;
  itemName: string;
  variantName: string;
  description: string;
  basePricePaisa: number;
  premiumPaisa: number;
  unitPricePaisa: number;
  quantity: number;
  choices: OrderChoiceSnapshot[];
  notes: string;
}

export interface OrderDetails {
  type: 'dine-in' | 'takeaway' | 'delivery';
  table: string;
  customerName: string;
  customerPhone: string;
}

export const emptyOrderDetails: OrderDetails = {
  type: 'dine-in', table: '', customerName: '', customerPhone: '',
};

export type OrderSelections = Record<string, string>;
