import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import TagInput from './TagInput.jsx';

export default function GdprConsentFrameworkCard({ data = {}, onChange, disabled = false }) {
  const handleFieldChange = (field) => (event) => {
    onChange?.(field, event.target.value);
  };

  const handleNumberChange = (field) => (event) => {
    onChange?.(field, event.target.value);
  };

  const handleToggle = (field) => (event) => {
    onChange?.(field, event.target.checked);
  };

  const handleWithdrawChannelsChange = (channels) => {
    onChange?.('withdrawalChannels', channels);
  };

  return (
    <section id="gdpr-consent" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Consent & preferences</h3>
          <p className="text-sm text-slate-600">
            Configure opt-in defaults, cookie governance, and how members withdraw consent across surfaces.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marketing opt-in default</label>
            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {data.marketingOptInDefault ? 'Opted in' : 'Opted out'}
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                checked={Boolean(data.marketingOptInDefault)}
                onChange={handleToggle('marketingOptInDefault')}
                disabled={disabled}
              />
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cookie banner enabled</label>
            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {data.cookieBannerEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                checked={Boolean(data.cookieBannerEnabled)}
                onChange={handleToggle('cookieBannerEnabled')}
                disabled={disabled}
              />
            </label>
          </div>
          <div className="space-y-2">
            <label htmlFor="cookieRefresh" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cookie consent refresh (months)
            </label>
            <input
              id="cookieRefresh"
              type="number"
              min="1"
              max="36"
              value={data.cookieRefreshMonths ?? ''}
              onChange={handleNumberChange('cookieRefreshMonths')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="12"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="consentRetention" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Consent log retention (days)
            </label>
            <input
              id="consentRetention"
              type="number"
              min="30"
              max="3650"
              value={data.consentLogRetentionDays ?? ''}
              onChange={handleNumberChange('consentLogRetentionDays')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="1095"
            />
          </div>
        </div>
        <TagInput
          label="Withdrawal channels"
          values={data.withdrawalChannels ?? []}
          onChange={handleWithdrawChannelsChange}
          disabled={disabled}
          placeholder="Add a channel (e.g. privacy portal, account settings)"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="guardianEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Guardian contact email
            </label>
            <input
              id="guardianEmail"
              type="email"
              value={data.guardianContactEmail ?? ''}
              onChange={handleFieldChange('guardianContactEmail')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="guardian@gigvora.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="cookiePolicy" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cookie policy URL
            </label>
            <input
              id="cookiePolicy"
              value={data.cookiePolicyUrl ?? ''}
              onChange={handleFieldChange('cookiePolicyUrl')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="https://gigvora.com/cookie-policy"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="preferenceCenter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preference centre URL
            </label>
            <input
              id="preferenceCenter"
              value={data.preferenceCenterUrl ?? ''}
              onChange={handleFieldChange('preferenceCenterUrl')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="https://gigvora.com/preferences"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
