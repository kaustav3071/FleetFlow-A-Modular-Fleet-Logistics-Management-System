import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, loading, variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-full bg-red-50 ring-1 ring-red-200">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-surface-600 text-sm">{message || 'Are you sure? This action cannot be undone.'}</p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} loading={loading}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
