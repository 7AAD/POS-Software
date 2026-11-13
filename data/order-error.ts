export class OrderValidationError extends Error {}
export class OrderPaidError extends OrderValidationError {
  constructor() { super('This order is already paid. Review its completed sale in Paid orders.'); }
}
export class OrderConflictError extends Error {
  constructor() {
    super('This order was changed elsewhere. Reopen it from Orders before saving again.');
  }
}

export function orderErrorMessage(error: unknown, fallback: string): string {
  return error instanceof OrderValidationError || error instanceof OrderConflictError ? error.message : fallback;
}
