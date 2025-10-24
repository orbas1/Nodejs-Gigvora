import { useId, useMemo, useState } from 'react';

export default function useFormState(initialStatus = 'idle') {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const liveRegionId = useId();

  const setError = (text) => {
    setMessage(text ?? null);
    setMessageType(text ? 'error' : null);
  };

  const setInfo = (text) => {
    setMessage(text ?? null);
    setMessageType(text ? 'info' : null);
  };

  const setSuccess = (text) => {
    setMessage(text ?? null);
    setMessageType(text ? 'success' : null);
  };

  const clearMessage = () => {
    setMessage(null);
    setMessageType(null);
  };

  const feedbackProps = useMemo(
    () => ({
      id: liveRegionId,
      role: 'status',
      'aria-live': messageType === 'error' ? 'assertive' : 'polite',
      'aria-atomic': true,
    }),
    [liveRegionId, messageType],
  );

  return {
    status,
    setStatus,
    message,
    messageType,
    setError,
    setInfo,
    setSuccess,
    clearMessage,
    feedbackProps,
  };
}
