import { useEffect, useMemo, useState } from 'react';
import SlideOver from './SlideOver.jsx';

const STATUS_OPTIONS = ['draft', 'scheduled', 'active', 'paused', 'expired'];
const OBJECTIVE_OPTIONS = ['awareness', 'lead_generation', 'retargeting', 'waitlist'];

export default function AdsPanel({ open, campaign, onClose, onCreate, onUpdate, busy }) {
  const isEditing = Boolean(campaign);
  const initialValues = useMemo(
    () => ({
      name: campaign?.name ?? '',
      objective: campaign?.objective ?? 'awareness',
      status: campaign?.status ?? 'draft',
      budget: campaign?.budgetCents != null ? (campaign.budgetCents / 100).toString() : '',
      currency: campaign?.currencyCode ?? 'USD',
      startDate: campaign?.startDate ? campaign.startDate.slice(0, 10) : '',
      endDate: campaign?.endDate ? campaign.endDate.slice(0, 10) : '',
      headline: campaign?.metadata?.creative?.headline ?? '',
      description: campaign?.metadata?.creative?.description ?? '',
      mediaUrl: campaign?.metadata?.creative?.mediaUrl ?? '',
      cta: campaign?.metadata?.creative?.cta ?? '',
      ctaUrl: campaign?.metadata?.creative?.ctaUrl ?? '',
      placements: Array.isArray(campaign?.metadata?.placements)
        ? campaign.metadata.placements.join(', ')
        : '',
      audience: campaign?.metadata?.audience ?? '',
      spend: campaign?.metrics?.spendCents != null ? (campaign.metrics.spendCents / 100).toString() : '',
      impressions: campaign?.metrics?.impressions ?? '',
      clicks: campaign?.metrics?.clicks ?? '',
      conversions: campaign?.metrics?.conversions ?? '',
    }),
    [campaign],
  );

  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(initialValues);
    setError(null);
  }, [initialValues]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      objective: form.objective,
      status: form.status,
      budget: form.budget,
      currencyCode: form.currency,
      startDate: form.startDate,
      endDate: form.endDate,
      headline: form.headline,
      description: form.description,
      mediaUrl: form.mediaUrl,
      cta: form.cta,
      ctaUrl: form.ctaUrl,
      placements: form.placements,
      audience: form.audience,
      metrics: {
        spend: form.spend,
        impressions: form.impressions,
        clicks: form.clicks,
        conversions: form.conversions,
      },
    };
    try {
      if (isEditing) {
        await onUpdate?.(campaign.id, payload);
      } else {
        await onCreate?.(payload);
      }
      onClose?.();
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save campaign.');
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={busy ? () => {} : onClose}
      title={isEditing ? 'Update campaign' : 'Launch campaign'}
      subtitle="Promote your services across Gigvora surfaces."
      footer={
        <button
          type="submit"
          form="network-ads-form"
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save campaign'}
        </button>
      }
    >
      <form id="network-ads-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Campaign name
          <input
            value={form.name}
            onChange={handleChange('name')}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Q2 awareness push"
            disabled={busy}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Objective
            <select
              value={form.objective}
              onChange={handleChange('objective')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm capitalize focus:border-emerald-400 focus:outline-none"
              disabled={busy}
            >
              {OBJECTIVE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <select
              value={form.status}
              onChange={handleChange('status')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm capitalize focus:border-emerald-400 focus:outline-none"
              disabled={busy}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Budget
            <input
              value={form.budget}
              onChange={handleChange('budget')}
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="500"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Currency
            <input
              value={form.currency}
              onChange={handleChange('currency')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-emerald-400 focus:outline-none"
              maxLength={3}
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Spend to date
            <input
              value={form.spend}
              onChange={handleChange('spend')}
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="200"
              disabled={busy}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Start date
            <input
              value={form.startDate}
              onChange={handleChange('startDate')}
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            End date
            <input
              value={form.endDate}
              onChange={handleChange('endDate')}
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              disabled={busy}
            />
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Headline
          <input
            value={form.headline}
            onChange={handleChange('headline')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Design leaders on demand"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Explain the impact of partnering with you."
            disabled={busy}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Media URL
            <input
              value={form.mediaUrl}
              onChange={handleChange('mediaUrl')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="https://"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            CTA label
            <input
              value={form.cta}
              onChange={handleChange('cta')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="Book session"
              disabled={busy}
            />
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          CTA URL
          <input
            value={form.ctaUrl}
            onChange={handleChange('ctaUrl')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="https://"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Placements
          <input
            value={form.placements}
            onChange={handleChange('placements')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Homepage hero, Weekly newsletter"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Audience notes
          <textarea
            value={form.audience}
            onChange={handleChange('audience')}
            rows={2}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Growth leaders at fintech scale-ups"
            disabled={busy}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Impressions
            <input
              value={form.impressions}
              onChange={handleChange('impressions')}
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="12000"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Clicks
            <input
              value={form.clicks}
              onChange={handleChange('clicks')}
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="320"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Conversions
            <input
              value={form.conversions}
              onChange={handleChange('conversions')}
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="18"
              disabled={busy}
            />
          </label>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </form>
    </SlideOver>
  );
}
