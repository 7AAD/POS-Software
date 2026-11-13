import { useRef, useState, type FormEvent } from 'react';
import type { Category, CategoryInput } from '../data/menu-types';
import { menuErrorMessage } from '../data/menu-error';
import { Modal } from './Modal';

interface CategoryEditorProps {
  categories: Category[];
  onSave(input: CategoryInput): Promise<void>;
  onClose(): void;
}

export function CategoryEditor({ categories, onSave, onClose }: CategoryEditorProps) {
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await onSave({ id: editing, name });
      setEditing(undefined); setName(''); setNotice('Category saved.');
    } catch (failure) { setError(menuErrorMessage(failure)); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Manage categories" busy={saving} onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <label>Category name<input ref={input} data-initial-focus value={name} required maxLength={100}
          disabled={saving} onChange={event => setName(event.target.value)} /></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        {notice && <p role="status" className="save-notice">{notice}</p>}
        <div className="form-actions">
          {editing && <button type="button" className="secondary" disabled={saving}
            onClick={() => { setEditing(undefined); setName(''); }}>Cancel rename</button>}
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save category' : 'Add category'}</button>
        </div>
      </form>
      <h3>Existing categories</h3>
      <ul className="category-list">
        {categories.map(category => <li key={category.id}>
          <span>{category.name}</span>
          <button type="button" className="secondary" disabled={saving} aria-label={`Rename ${category.name}`}
            onClick={() => { setEditing(category.id); setName(category.name); setError(''); setNotice(''); input.current?.focus(); }}>
            Rename
          </button>
        </li>)}
      </ul>
    </Modal>
  );
}
