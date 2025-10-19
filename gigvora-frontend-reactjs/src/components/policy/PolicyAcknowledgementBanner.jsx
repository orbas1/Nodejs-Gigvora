import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';

const STORAGE_KEY = 'gv-policy-ack-2024-11';

export default function PolicyAcknowledgementBanner() {
  const { session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  const storageKey = useMemo(() => {
    const suffix = session?.id ? `:${session.id}` : '';
    return `${STORAGE_KEY}${suffix}`;
  }, [session?.id]);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(storageKey);
      setDismissed(Boolean(existing));
    } catch (error) {
      setDismissed(false);
    }
  }, [storageKey]);

  const acknowledge = () => {
    try {
      window.localStorage.setItem(storageKey, new Date().toISOString());
    } catch (error) {
      // Ignore storage errors; still hide banner to avoid blocking UI
    }
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] max-w-5xl rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Updated legal terms now live</p>
          <p>
            We have refreshed our Terms, Privacy Policy, Refund Policy, and Community Guidelines for the Version 1.00 release. Review the updates and acknowledge to continue using collaboration tools.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm font-semibold md:flex-row">
          <Link
            to="/terms"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            View terms
          </Link>
          <Link
            to="/privacy"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Privacy summary
          </Link>
          <button
            type="button"
            onClick={acknowledge}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-700"
          >
            Acknowledge updates
          </button>
        </div>
      </div>
    </div>
  );
}
