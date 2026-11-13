export function menuErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (/unique constraint/i.test(message)) return 'That name already exists. Please choose a different name.';
  if (/foreign key/i.test(message)) return 'Choose an existing category and try again.';
  if (/^(Enter|Prices|This price|Item name|Category|Size|Details|Order choices|Add at least|Enable premium|Premium extra|Item availability)/.test(message)) {
    return message;
  }
  return 'Could not save your changes. Please try again.';
}
