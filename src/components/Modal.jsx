import { useEffect } from 'react';

const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        {title && (
          <div style={{
            fontFamily: 'var(--serif)',
            fontSize: 20,
            color: 'var(--text)',
            marginBottom: 20,
          }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
