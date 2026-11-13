import { cartTotal } from './order-cart';
import { validateOrderDetails, validateOrderLines } from './saved-order-validation';

// Both open orders and completed sales keep their own sale-time names and prices.
export function readOrderSnapshot(detailsJson: string, linesJson: string, totalPaisa: number) {
  const details: unknown = JSON.parse(detailsJson);
  const lines: unknown = JSON.parse(linesJson);
  validateOrderDetails(details);
  validateOrderLines(lines);
  if (cartTotal(lines) !== totalPaisa) {
    throw new Error('The saved order could not be read. Its stored data has not been changed.');
  }
  return { details, lines };
}
