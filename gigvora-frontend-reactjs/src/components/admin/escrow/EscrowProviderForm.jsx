import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const PROVIDERS = [
  { value: 'stripe', label: 'Stripe Connect' },
  { value: 'escrow_com', label: 'Escrow.com' },
];

function normalizeDraft(value = {}) {
  return {
    provider: value.provider ?? 'stripe',
    stripe: {
      publishableKey: value.stripe?.publishableKey ?? '',
      secretKey: value.stripe?.secretKey ?? '',
      webhookSecret: value.stripe?.webhookSecret ?? '',
      accountId: value.stripe?.accountId ?? '',
    },
    escrow_com: {
      apiKey: value.escrow_com?.apiKey ?? '',
      apiSecret: value.escrow_com?.apiSecret ?? '',
      sandbox: value.escrow_com?.sandbox ?? true,
    },
    escrowControls: {
      defaultHoldPeriodHours: value.escrowControls?.defaultHoldPeriodHours ?? 72,
      autoReleaseHours: value.escrowControls?.autoReleaseHours ?? 48,
      requireManualApproval: value.escrowControls?.requireManualApproval ?? false,
      manualApprovalThreshold: value.escrowControls?.manualApprovalThreshold ?? 25000,
      notificationEmails: Array.isArray(value.escrowControls?.notificationEmails)
        ? value.escrowControls.notificationEmails.join('\n')
        : '',
      statementDescriptor: value.escrowControls?.statementDescriptor ?? '',
    },
  };
}

export default function EscrowProviderForm({ value, onSave, saving = false, onReset, currency = 'USD' }) {
  const [draft, setDraft] = useState(() => normalizeDraft(value));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(normalizeDraft(value));
    setDirty(false);
  }, [value]);

  const providerLabel = useMemo(() => {
    return PROVIDERS.find((option) => option.value === draft.provider)?.label ?? 'Stripe Connect';
  }, [draft.provider]);

  const handleProviderChange = (event) => {
    const nextProvider = event.target.value;
    setDraft((previous) => ({ ...previous, provider: nextProvider }));
    setDirty(true);
  };

  const handleStripeChange = (field, newValue) => {
    setDraft((previous) => ({
      ...previous,
      stripe: { ...previous.stripe, [field]: newValue },
    }));
    setDirty(true);
  };

  const handleEscrowComChange = (field, newValue) => {
    setDraft((previous) => ({
      ...previous,
      escrow_com: { ...previous.escrow_com, [field]: newValue },
    }));
    setDirty(true);
  };

  const handleControlChange = (field, newValue) => {
    setDraft((previous) => ({
      ...previous,
      escrowControls: { ...previous.escrowControls, [field]: newValue },
    }));
    setDirty(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    const payload = {
      provider: draft.provider,
      stripe: {
        publishableKey: draft.stripe.publishableKey || undefined,
        secretKey: draft.stripe.secretKey || undefined,
        webhookSecret: draft.stripe.webhookSecret || undefined,
        accountId: draft.stripe.accountId || undefined,
      },
      escrow_com: {
        apiKey: draft.escrow_com.apiKey || undefined,
        apiSecret: draft.escrow_com.apiSecret || undefined,
        sandbox: Boolean(draft.escrow_com.sandbox),
      },
      escrowControls: {
        defaultHoldPeriodHours: Number(draft.escrowControls.defaultHoldPeriodHours ?? 0) || 0,
        autoReleaseHours: Number(draft.escrowControls.autoReleaseHours ?? 0) || 0,
        requireManualApproval: Boolean(draft.escrowControls.requireManualApproval),
        manualApprovalThreshold:
          draft.escrowControls.manualApprovalThreshold != null
            ? Number(draft.escrowControls.manualApprovalThreshold)
            : undefined,
        notificationEmails: draft.escrowControls.notificationEmails
          ? draft.escrowControls.notificationEmails
              .split(/\n|,/)
              .map((email) => email.trim())
              .filter(Boolean)
          : [],
        statementDescriptor: draft.escrowControls.statementDescriptor || undefined,
      },
    };
    onSave(payload);
  };

  const handleReset = () => {
    setDraft(normalizeDraft(value));
    setDirty(false);
    onReset?.();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Provider</h3>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {providerLabel}
          </span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PROVIDERS.map((provider) => (
            <label
              key={provider.value}
              className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
                draft.provider === provider.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <span className="text-sm font-semibold text-slate-900">{provider.label}</span>
              <input
                type="radio"
                name="escrow-provider"
                value={provider.value}
                checked={draft.provider === provider.value}
                onChange={handleProviderChange}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Stripe credentials</h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="stripe-publishable">
                Publishable key
              </label>
              <input
                id="stripe-publishable"
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={draft.stripe.publishableKey}
                onChange={(event) => handleStripeChange('publishableKey', event.target.value)}
                placeholder="pk_live_..."
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="stripe-secret">
                Secret key
              </label>
              <input
                id="stripe-secret"
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={draft.stripe.secretKey}
                onChange={(event) => handleStripeChange('secretKey', event.target.value)}
                placeholder="sk_live_..."
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="stripe-webhook">
                Webhook secret
              </label>
              <input
                id="stripe-webhook"
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={draft.stripe.webhookSecret}
                onChange={(event) => handleStripeChange('webhookSecret', event.target.value)}
                placeholder="whsec_..."
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="stripe-account">
                Connected account ID
              </label>
              <input
                id="stripe-account"
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={draft.stripe.accountId}
                onChange={(event) => handleStripeChange('accountId', event.target.value)}
                placeholder="acct_..."
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Escrow.com credentials</h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="escrow-api-key">
                API key
              </label>
              <input
                id="escrow-api-key"
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={draft.escrow_com.apiKey}
                onChange={(event) => handleEscrowComChange('apiKey', event.target.value)}
                placeholder="Escrow key"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="escrow-api-secret">
                API secret
              </label>
              <input
                id="escrow-api-secret"
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={draft.escrow_com.apiSecret}
                onChange={(event) => handleEscrowComChange('apiSecret', event.target.value)}
                placeholder="Escrow secret"
                autoComplete="off"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={Boolean(draft.escrow_com.sandbox)}
                onChange={(event) => handleEscrowComChange('sandbox', event.target.checked)}
              />
              Use Escrow.com sandbox environment
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Release controls</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="hold-hours">
              Default hold period (hours)
            </label>
            <input
              id="hold-hours"
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={draft.escrowControls.defaultHoldPeriodHours}
              onChange={(event) => handleControlChange('defaultHoldPeriodHours', event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="auto-release">
              Auto-release after (hours)
            </label>
            <input
              id="auto-release"
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={draft.escrowControls.autoReleaseHours}
              onChange={(event) => handleControlChange('autoReleaseHours', event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="manual-threshold">
              Manual approval threshold ({currency})
            </label>
            <input
              id="manual-threshold"
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={draft.escrowControls.manualApprovalThreshold}
              onChange={(event) => handleControlChange('manualApprovalThreshold', event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="require-manual"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={Boolean(draft.escrowControls.requireManualApproval)}
              onChange={(event) => handleControlChange('requireManualApproval', event.target.checked)}
            />
            <label htmlFor="require-manual" className="text-sm font-medium text-slate-700">
              Always require manual approval
            </label>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="escrow-notifications">
              Escrow notification emails
            </label>
            <textarea
              id="escrow-notifications"
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={draft.escrowControls.notificationEmails}
              onChange={(event) => handleControlChange('notificationEmails', event.target.value)}
              placeholder="finance@gigvora.com\nops@gigvora.com"
            />
            <p className="mt-1 text-xs text-slate-500">Comma or line separated.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="statement-descriptor">
              Statement descriptor / notes
            </label>
            <textarea
              id="statement-descriptor"
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={draft.escrowControls.statementDescriptor}
              onChange={(event) => handleControlChange('statementDescriptor', event.target.value)}
              placeholder="Displayed on client statements"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Saving...' : 'Save provider settings'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving || !dirty}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reset changes
        </button>
      </div>
    </form>
  );
}

EscrowProviderForm.propTypes = {
  value: PropTypes.shape({
    provider: PropTypes.string,
    stripe: PropTypes.shape({
      publishableKey: PropTypes.string,
      secretKey: PropTypes.string,
      webhookSecret: PropTypes.string,
      accountId: PropTypes.string,
    }),
    escrow_com: PropTypes.shape({
      apiKey: PropTypes.string,
      apiSecret: PropTypes.string,
      sandbox: PropTypes.bool,
    }),
    escrowControls: PropTypes.shape({
      defaultHoldPeriodHours: PropTypes.number,
      autoReleaseHours: PropTypes.number,
      requireManualApproval: PropTypes.bool,
      manualApprovalThreshold: PropTypes.number,
      notificationEmails: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
      ]),
      statementDescriptor: PropTypes.string,
    }),
  }),
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  onReset: PropTypes.func,
  currency: PropTypes.string,
};

EscrowProviderForm.defaultProps = {
  value: undefined,
  onSave: undefined,
  saving: false,
  onReset: undefined,
  currency: 'USD',
};
