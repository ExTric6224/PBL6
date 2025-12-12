import api from '../services/api';
import { AxiosResponse, AxiosError } from 'axios';
import { translateErrorMessage } from './permissionTranslations';

let showErrorCallback: ((message: string, title?: string, type?: 'permission' | 'error' | 'warning', onClose?: () => void) => void) | null = null;
let redirectCallback: ((path: string) => void) | null = null;

export const setupAxiosInterceptors = (
  showError: (message: string, title?: string, type?: 'permission' | 'error' | 'warning', onClose?: () => void) => void,
  redirect?: (path: string) => void
) => {
  showErrorCallback = showError;
  redirectCallback = redirect || null;

  // Add response interceptor for 403 errors
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<any>) => {
      // Handle 403 Forbidden errors
      if (error.response?.status === 403) {
        const errorData = error.response?.data?.error;
        let errorMessage = 'Bạn không có quyền thực hiện hành động này';
        
        // Extract message from error object or use string directly
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || errorMessage;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        // Translate permission codes to Vietnamese
        const translatedMessage = translateErrorMessage(errorMessage);
        
        // Check if this is a view permission error that should redirect to dashboard
        const isProfileViewError = errorMessage.includes('profile:view_own');
        const isScheduleViewError = errorMessage.includes('schedule:view_own') || errorMessage.includes('schedule:view_any');
        const isBookingViewError = errorMessage.includes('booking:view_own') || errorMessage.includes('booking:view_any');
        const isSessionViewError = errorMessage.includes('session:view_own') || errorMessage.includes('session:view_any');
        const isFeedbackViewError = errorMessage.includes('feedback:view_own') || errorMessage.includes('feedback:view_any');
        const shouldRedirectToDashboard = isProfileViewError || isScheduleViewError || isBookingViewError || isSessionViewError || isFeedbackViewError;
        
        // Show error dialog
        if (showErrorCallback) {
          // For view permission errors, redirect to dashboard after dialog closes
          if (shouldRedirectToDashboard && redirectCallback) {
            const redirect = redirectCallback; // Capture in closure
            showErrorCallback(
              translatedMessage, 
              'Không có quyền truy cập', 
              'permission',
              () => redirect('/dashboard')
            );
          } else {
            showErrorCallback(translatedMessage, 'Không có quyền truy cập', 'permission');
          }
        }
      }
      
      return Promise.reject(error);
    }
  );
};
