import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ErrorDialog from '../components/Toast/ErrorDialog';
import { setupAxiosInterceptors } from '../utils/axiosSetup';

interface ErrorContextType {
  showError: (message: string, title?: string, type?: 'permission' | 'error' | 'warning', onClose?: () => void) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    type: 'permission' | 'error' | 'warning';
    onCloseCallback?: () => void;
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

  const showError = (
    message: string,
    title?: string,
    type: 'permission' | 'error' | 'warning' = 'error',
    onCloseCallback?: () => void
  ) => {
    setError({
      isOpen: true,
      message,
      title,
      type,
      onCloseCallback,
    });
  };

  const closeError = () => {
    const callback = error.onCloseCallback;
    setError({
      ...error,
      isOpen: false,
      onCloseCallback: undefined,
    });
    // Execute callback after closing
    if (callback) {
      setTimeout(() => callback(), 100);
    }
  };

  // Setup axios interceptors when component mounts
  useEffect(() => {
    setupAxiosInterceptors(showError);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <ErrorDialog
        isOpen={error.isOpen}
        title={error.title}
        message={error.message}
        type={error.type}
        onClose={closeError}
      />
    </ErrorContext.Provider>
  );
};
