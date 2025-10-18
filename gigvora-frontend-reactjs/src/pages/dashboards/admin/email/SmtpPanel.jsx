import { useEffect, useMemo, useState } from 'react';
import { BoltIcon, CheckCircleIcon, EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = Object.freeze({
  label: 'Primary SMTP',
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromName: '',
  fromAddress: '',
  replyToAddress: '',
  bccAuditRecipients: '',
  rateLimitPerMinute: 120,
});

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

export default function SmtpPanel({ loading, smtpConfig, saving, onSave, onTest }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    if (!smtpConfig) {
      setForm(EMPTY_FORM);
      setPasswordTouched(false);
      return;
    }
    setForm({
      label: smtpConfig.label ?? 'Primary SMTP',
      host: smtpConfig.host ?? '',
      port: smtpConfig.port ?? 587,
      secure: Boolean(smtpConfig.secure),
      username: smtpConfig.username ?? '',
      password: '',
      fromName: smtpConfig.fromName ?? '',
      fromAddress: smtpConfig.fromAddress ?? '',
      replyToAddress: smtpConfig.replyToAddress ?? '',
      bccAuditRecipients: smtpConfig.bccAuditRecipients ?? '',
      rateLimitPerMinute: smtpConfig.rateLimitPerMinute ?? 120,
    });
    setPasswordTouched(false);
  }, [smtpConfig]);

  const status = useMemo(() => {
    if (!smtpConfig) {
      return { label: 'Not set', tone: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    if (smtpConfig.lastVerifiedAt) {
      return { label: 'Verified', tone: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
    return { label: 'Pending', tone: 'text-slate-600 bg-slate-100 border-slate-200' };
  }, [smtpConfig]);

  const disabled = loading || saving;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onSave === 'function') {
      await onSave({ ...form, password: passwordTouched ? form.password : undefined });
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">SMTP</h2>
          <p className="text-sm text-slate-500">Live transport credentials</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${status.tone}`}
        >
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          {status.label}
        </div>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm">
          <p className="font-semibold text-slate-600">Label</p>
          <p className="mt-1 text-slate-900">{smtpConfig?.label ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm">
          <p className="font-semibold text-slate-600">Last test</p>
          <p className="mt-1 text-slate-900">{formatDate(smtpConfig?.metadata?.lastTestedAt || smtpConfig?.lastVerifiedAt)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm">
          <p className="font-semibold text-slate-600">Rate limit</p>
          <p className="mt-1 text-slate-900">{smtpConfig?.rateLimitPerMinute ?? form.rateLimitPerMinute} / min</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Host</span>
            <input
              name="host"
              value={form.host}
              onChange={handleChange}
              required
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="smtp.example.com"
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-600">Port</span>
              <input
                name="port"
                type="number"
                value={form.port}
                onChange={handleChange}
                required
                disabled={disabled}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                min="1"
                max="65535"
              />
            </label>
            <label className="flex items-center gap-2 self-end text-sm text-slate-600">
              <input
                type="checkbox"
                name="secure"
                checked={form.secure}
                onChange={handleChange}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              TLS
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="smtp user"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={(event) => {
                setPasswordTouched(true);
                handleChange(event);
              }}
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder={smtpConfig?.hasPassword ? '••••••••' : ''}
            />
            {smtpConfig?.hasPassword && !passwordTouched ? (
              <span className="text-xs text-slate-400">Saved</span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">From name</span>
            <input
              name="fromName"
              value={form.fromName}
              onChange={handleChange}
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">From email</span>
            <input
              name="fromAddress"
              type="email"
              value={form.fromAddress}
              onChange={handleChange}
              required
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="team@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Reply-to</span>
            <input
              name="replyToAddress"
              type="email"
              value={form.replyToAddress}
              onChange={handleChange}
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Audit BCC</span>
            <input
              name="bccAuditRecipients"
              value={form.bccAuditRecipients}
              onChange={handleChange}
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="ops@example.com"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Label</span>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              disabled={disabled}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Rate per minute</span>
            <input
              name="rateLimitPerMinute"
              type="number"
              value={form.rateLimitPerMinute}
              onChange={handleChange}
              disabled={disabled}
              min="1"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="flex items-end justify-end gap-3">
            <button
              type="button"
              onClick={() => onTest?.({})}
              disabled={disabled || !smtpConfig}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
              Test
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <BoltIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
              )}
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
