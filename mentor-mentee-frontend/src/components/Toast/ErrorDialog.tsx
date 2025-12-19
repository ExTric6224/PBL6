import React from 'react';
import './ErrorDialog.css';

interface ErrorDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  type?: 'permission' | 'error' | 'warning' | 'success';
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  title,
  message,
  onClose,
  type = 'error',
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'permission':
        return '🔒';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return '❌';
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'permission':
        return 'Access Denied';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'success':
        return 'Success';
      default:
        return 'Error';
    }
  };

  return (
    <div className="error-dialog-overlay" onClick={onClose}>
      <div className="error-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`error-dialog-icon ${type}`}>
          {getIcon()}
        </div>
        <div className="error-dialog-content">
          <h3 className="error-dialog-title">{getTitle()}</h3>
          <p className="error-dialog-message">{message}</p>
        </div>
        <div className="error-dialog-actions">
          <button
            className="error-dialog-button"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;
