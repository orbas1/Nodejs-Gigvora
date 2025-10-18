import { useState } from 'react';

export default function SettingsPanel({ accounts, onUpdate }) {
  const [savingId, setSavingId] = useState(null);

  const toggleSetting = async (account, key) => {
    const nextValue = !Boolean(account.settings?.[key]);
    setSavingId(account.id);
    try {
      await onUpdate(account.id, {
        provider: account.provider,
        currencyCode: account.currencyCode,
        metadata: { accountLabel: account.metadata?.accountLabel },
        settings: { ...account.settings, [key]: nextValue },
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Controls</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <div key={account.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{account.metadata?.accountLabel}</p>
                <p className="text-sm text-slate-400">{account.provider}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {account.currencyCode}
              </span>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <button
                type="button"
                onClick={() => toggleSetting(account, 'autoReleaseOnApproval')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  account.settings?.autoReleaseOnApproval
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50'
                }`}
                disabled={savingId === account.id}
              >
                <span>Auto release after approval</span>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {account.settings?.autoReleaseOnApproval ? 'On' : 'Off'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleSetting(account, 'notifyOnDispute')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  account.settings?.notifyOnDispute
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50'
                }`}
                disabled={savingId === account.id}
              >
                <span>Instant dispute alerts</span>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {account.settings?.notifyOnDispute ? 'On' : 'Off'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleSetting(account, 'manualHold')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  account.settings?.manualHold
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50'
                }`}
                disabled={savingId === account.id}
              >
                <span>Manual hold mode</span>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {account.settings?.manualHold ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          </div>
        ))}
        {!accounts.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Add an account first to configure its controls.
          </div>
        ) : null}
      </div>
    </div>
  );
}
