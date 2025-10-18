import { useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { useEscrow } from './EscrowContext.jsx';

const TONE_STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
};

const ICONS = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
};

export default function EscrowToast() {
  const { state, triggerToast } = useEscrow();
  const { toast } = state;

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => {
      triggerToast(null);
    }, 3200);
    return () => window.clearTimeout(timeout);
  }, [toast, triggerToast]);

  if (!toast) {
    return null;
  }

  const Icon = ICONS[toast.tone || 'success'] ?? CheckCircleIcon;
  const tone = toast.tone || 'success';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div className={`pointer-events-auto inline-flex items-center gap-3 rounded-full px-4 py-2 shadow-lg ${TONE_STYLES[tone] ?? TONE_STYLES.success}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>
    </div>
  );
}
