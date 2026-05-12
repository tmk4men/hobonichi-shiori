import { useEffect } from 'react';

interface Props {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'はい',
  cancelLabel = 'やめる',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-bg" onClick={onCancel} role="alertdialog">
      <div
        className={`modal confirm-dialog${danger ? ' danger' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {message && <p className="confirm-msg">{message}</p>}
        <div className="modal-actions">
          <button className="ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={danger ? 'primary danger-btn' : 'primary'}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
