import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AppIcon } from './AppIcon';

interface ModalProps {
  title: string;
  children: ReactNode;
  busy?: boolean;
  onClose(): void;
}

export function Modal({ title, children, busy = false, onClose }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    element.querySelector<HTMLInputElement>('[data-initial-focus]')?.focus();
    return () => { element.close(); };
  }, []);

  return (
    <dialog ref={dialog} className="modal" aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button secondary" aria-label="Close editor"
          disabled={busy} onClick={onClose}><AppIcon name="close" /></button>
      </div>
      <div className="modal-content">{children}</div>
    </dialog>
  );
}
