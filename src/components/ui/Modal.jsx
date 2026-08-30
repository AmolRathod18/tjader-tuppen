import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, children, footer, size = 'md' }) {
  if (!isOpen) return null;

  const maxWidths = { sm: '400px', md: '520px', lg: '700px', xl: '900px' };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: maxWidths[size] }}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-body">
          <div className="delete-confirm">
            <div className="danger-icon">
              <AlertTriangle size={28} />
            </div>
            <h3>Delete Confirmation</h3>
            <p>Are you sure you want to delete <strong>"{itemName}"</strong>? This action cannot be undone.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
