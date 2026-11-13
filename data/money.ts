// Parse decimal text directly so 0.29 PKR becomes exactly 29 paisa.
export function parsePkr(value: string): number {
  const text = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error('Enter a PKR amount with up to two decimal places.');
  }
  const [rupees, fraction = ''] = text.split('.');
  const paisa = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(paisa)) throw new Error('This price is too large.');
  return paisa;
}

export function formatPkr(paisa: number): string {
  if (!Number.isSafeInteger(paisa) || paisa < 0) {
    throw new Error('Prices must be non-negative whole paisa amounts.');
  }
  const rupees = Math.floor(paisa / 100).toLocaleString('en-PK');
  return `PKR ${rupees}.${String(paisa % 100).padStart(2, '0')}`;
}
