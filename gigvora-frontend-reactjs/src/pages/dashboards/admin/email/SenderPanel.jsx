import { ShieldCheckIcon, UserIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export default function SenderPanel({ smtpConfig, loading, onEditSender, condensed = false }) {
  const fromLabel = smtpConfig?.fromName ? `${smtpConfig.fromName} <${smtpConfig.fromAddress}>` : smtpConfig?.fromAddress;

  if (condensed) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Checks</h2>
          <button
            type="button"
            onClick={onEditSender}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Edit
          </button>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
            <p className="font-semibold">TLS</p>
            <p className="mt-1 text-xs uppercase tracking-wide">{smtpConfig?.secure ? 'On' : 'Off'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">Audit BCC</p>
            <p className="mt-1 text-xs uppercase tracking-wide">{smtpConfig?.bccAuditRecipients || 'None'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">Last update</p>
            <p className="mt-1 text-xs uppercase tracking-wide">{formatDate(smtpConfig?.metadata?.lastUpdatedAt)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">Last test</p>
            <p className="mt-1 text-xs uppercase tracking-wide">{formatDate(smtpConfig?.metadata?.lastTestedAt || smtpConfig?.lastVerifiedAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Sender</h2>
          <p className="text-sm text-slate-500">Identity and compliance</p>
        </div>
        <button
          type="button"
          onClick={onEditSender}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <WrenchScrewdriverIcon className="h-4 w-4" aria-hidden="true" />
          Manage
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 text-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent shadow-sm">
            <UserIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</p>
          <p className="mt-1 text-slate-900">{fromLabel || '—'}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Reply-to</p>
          <p className="mt-1 text-slate-900">{smtpConfig?.replyToAddress || '—'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 text-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent shadow-sm">
            <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
          <p className="mt-2 text-slate-900">TLS {smtpConfig?.secure ? 'enabled' : 'disabled'}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Audit BCC</p>
          <p className="mt-1 break-words text-slate-900">{smtpConfig?.bccAuditRecipients || '—'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 text-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent shadow-sm">
            <WrenchScrewdriverIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</p>
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last update</p>
              <p className="text-slate-900">{formatDate(smtpConfig?.metadata?.lastUpdatedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">By</p>
              <p className="text-slate-900">{smtpConfig?.metadata?.lastUpdatedBy || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last test</p>
              <p className="text-slate-900">{formatDate(smtpConfig?.metadata?.lastTestedAt || smtpConfig?.lastVerifiedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">By</p>
              <p className="text-slate-900">{smtpConfig?.metadata?.lastTestedBy || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
