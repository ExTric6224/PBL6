import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupAxiosInterceptors } from '../utils/axiosSetup';
import { useError } from '../context/ErrorContext';

/**
 * Component to setup axios interceptors with navigation
 * Must be placed inside Router to access useNavigate
 */
const AxiosSetup: React.FC = () => {
  const { showError } = useError();
  const navigate = useNavigate();

  useEffect(() => {
    setupAxiosInterceptors(showError, navigate);
  }, [showError, navigate]);

  return null;
};

export default AxiosSetup;
