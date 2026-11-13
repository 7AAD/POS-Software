// Replace an edited entry in place; append a new entry at the end of the menu.
export function updateMenuEntry<Entry extends { id: string }>(entries: Entry[], saved: Entry): Entry[] {
  return entries.some(entry => entry.id === saved.id)
    ? entries.map(entry => entry.id === saved.id ? saved : entry)
    : [...entries, saved];
}
