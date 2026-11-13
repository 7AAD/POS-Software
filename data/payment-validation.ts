import { formatPkr } from './money';
import { OrderValidationError } from './order-error';
import { paymentMethods, type PaymentInput, type PaymentMethod } from './payment-types';

export function paymentAmounts(totalPaisa: number, method: PaymentMethod, receivedPaisa: number) {
  if (!paymentMethods.some(option => option.value === method)) throw new OrderValidationError('Choose a supported payment method.');
  if (![totalPaisa, receivedPaisa].every(amount => Number.isSafeInteger(amount) && amount >= 0)) {
    throw new OrderValidationError('Enter a valid payment amount in whole paisa.');
  }
  if (receivedPaisa < totalPaisa) throw new OrderValidationError(`${formatPkr(totalPaisa - receivedPaisa)} more is needed to pay this order.`);
  if (method !== 'cash' && receivedPaisa !== totalPaisa) {
    throw new OrderValidationError('A digital payment must match the order total exactly.');
  }
  return { totalPaisa, receivedPaisa, changePaisa: receivedPaisa - totalPaisa };
}

export function validatePayment(input: PaymentInput) {
  if (![input.id, input.orderId].every(id => typeof id === 'string' && id.trim().length > 0 && id.length <= 100) ||
      !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1 || input.expectedRevision >= Number.MAX_SAFE_INTEGER) {
    throw new OrderValidationError('Reopen the saved order before recording payment.');
  }
  if (typeof input.reference !== 'string' || input.reference.length > 100) throw new OrderValidationError('Keep the payment reference within 100 characters.');
  const amounts = paymentAmounts(input.expectedTotalPaisa, input.method, input.receivedPaisa);
  if (typeof input.confirmedReceived !== 'boolean' || (input.method !== 'cash' && !input.confirmedReceived)) {
    throw new OrderValidationError('Confirm that the digital payment was received before recording it.');
  }
  return amounts;
}
