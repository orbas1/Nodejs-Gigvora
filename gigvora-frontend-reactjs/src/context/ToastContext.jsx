import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ToastViewport from '../components/toast/ToastViewport.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    setToasts((previous) => {
      const id = toast.id ?? `toast-${Date.now()}-${counterRef.current++}`;
      const payload = {
        id,
        tone: toast.tone || 'info',
        title: toast.title || null,
        message: toast.message || '',
        duration: typeof toast.duration === 'number' ? toast.duration : 5000,
        content: toast.content || null,
        className: toast.className || '',
        style: toast.style || null,
        accent: toast.accent || null,
        actions: Array.isArray(toast.actions)
          ? toast.actions.filter((action) => action && typeof action.label === 'string')
          : [],
        metadata: toast.metadata || null,
      };
      return [...previous, payload];
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
}

export default ToastContext;
