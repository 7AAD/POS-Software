export class OrderValidationError extends Error {}
export class OrderConflictError extends Error {
  constructor() {
    super('This order was changed elsewhere. Reopen it from Orders before saving again.');
  }
}

export function orderErrorMessage(error: unknown, fallback: string): string {
  return error instanceof OrderValidationError || error instanceof OrderConflictError ? error.message : fallback;
}
