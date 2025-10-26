import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { addDays, addWeeks, addMonths, format, startOfDay } from 'date-fns';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatStatus } from '../../wallet/walletFormatting.js';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'manual', label: 'Manual' },
];

const DAY_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function buildInitialState(settings = {}, workspaceId = '') {
  return {
    workspaceId: settings.workspaceId ?? workspaceId ?? '',
    frequency: settings.payoutCadence ?? settings.frequency ?? 'weekly',
    dayOfWeek: settings.payoutDay ?? 'friday',
    threshold: settings.autoSweepThreshold ?? settings.threshold ?? '',
    minimumPayout: settings.minimumPayout ?? '',
    fundingSourceId: settings.primaryFundingSourceId ?? settings.fundingSourceId ?? '',
    backupFundingSourceId: settings.backupFundingSourceId ?? '',
    notificationsEmail: settings.complianceContactEmail ?? settings.notificationsEmail ?? '',
    autoApprove: Boolean(settings.autoSweepEnabled ?? settings.autoApprove),
    dualControl: Boolean(settings.dualControlEnabled ?? true),
    retainReserve: Boolean(settings.retainReserve ?? false),
    metadata: settings.metadata ?? {},
  };
}

function computeSchedule({ frequency, dayOfWeek }, { iterations = 4 } = {}) {
  const today = startOfDay(new Date());
  const results = [];
  let cursor = today;
  const normalizeDay = DAY_INDEX[String(dayOfWeek ?? 'friday').toLowerCase()] ?? DAY_INDEX.friday;

  const pushDate = (date) => {
    results.push({
      date,
      label: format(date, 'EEE d MMM'),
    });
  };

  if (frequency === 'manual') {
    pushDate(today);
    return results;
  }

  for (let index = 0; index < iterations; index += 1) {
    if (frequency === 'daily') {
      cursor = index === 0 ? today : addDays(cursor, 1);
      pushDate(cursor);
      continue;
    }

    if (frequency === 'weekly') {
      const diff = (normalizeDay - cursor.getDay() + 7) % 7;
      cursor = index === 0 ? addDays(cursor, diff) : addDays(cursor, 7);
      pushDate(cursor);
      continue;
    }

    if (frequency === 'biweekly') {
      if (index === 0) {
        const diff = (normalizeDay - cursor.getDay() + 7) % 7;
        cursor = addDays(cursor, diff);
      } else {
        cursor = addDays(cursor, 14);
      }
      pushDate(cursor);
      continue;
    }

    if (frequency === 'monthly') {
      cursor = index === 0 ? today : addMonths(cursor, 1);
      pushDate(cursor);
      continue;
    }

    cursor = addWeeks(cursor, 1);
    pushDate(cursor);
  }

  return results;
}

function ComplianceChecklist({ compliance }) {
  const items = [
    {
      id: 'kyc',
      label: 'Identity verification',
      status: compliance?.kycStatus ?? 'complete',
      description: 'Ensure every payout recipient maintains an up-to-date KYC profile.',
    },
    {
      id: 'aml',
      label: 'AML screening',
      status: compliance?.amlStatus ?? 'clear',
      description: 'Screen payouts against sanctions and adverse media lists.',
    },
    {
      id: 'tax',
      label: 'Tax documentation',
      status: compliance?.taxStatus ?? 'available',
      description: 'Collect W-8/W-9 documentation and country-specific disclosures.',
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <ShieldCheckIcon className="mt-1 h-5 w-5 text-blue-500" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {item.label} · <span className="text-xs text-slate-500">{formatStatus(item.status)}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

ComplianceChecklist.propTypes = {
  compliance: PropTypes.object,
};

ComplianceChecklist.defaultProps = {
  compliance: null,
};

export default function PayoutSetup({
  workspaceId,
  settings,
  fundingSources,
  compliance,
  loading,
  onCreateFundingSource,
  onSave,
  onPreviewSchedule,
  workspaceCurrency,
}) {
  const [formState, setFormState] = useState(() => buildInitialState(settings, workspaceId));
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormState(buildInitialState(settings, workspaceId));
  }, [settings, workspaceId]);

  const fundingOptions = useMemo(() => {
    if (!Array.isArray(fundingSources)) {
      return [];
    }
    return fundingSources.map((source) => ({
      value: String(source.id ?? source.value ?? ''),
      label: source.label ?? source.displayName ?? source.name ?? 'Funding source',
      currency: source.currencyCode ?? source.currency ?? workspaceCurrency,
    }));
  }, [fundingSources, workspaceCurrency]);

  const schedulePreview = useMemo(
    () => computeSchedule({ frequency: formState.frequency, dayOfWeek: formState.dayOfWeek }),
    [formState.frequency, formState.dayOfWeek],
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        workspaceId: formState.workspaceId || workspaceId,
        payoutCadence: formState.frequency,
        payoutDay: formState.dayOfWeek,
        autoSweepThreshold: formState.threshold ? Number(formState.threshold) : null,
        minimumPayout: formState.minimumPayout ? Number(formState.minimumPayout) : null,
        primaryFundingSourceId: formState.fundingSourceId || null,
        backupFundingSourceId: formState.backupFundingSourceId || null,
        autoSweepEnabled: Boolean(formState.autoApprove),
        dualControlEnabled: Boolean(formState.dualControl),
        retainReserve: Boolean(formState.retainReserve),
        complianceContactEmail: formState.notificationsEmail || null,
      };
      await onSave?.(payload);
      setFeedback({ type: 'success', message: 'Payout schedule saved.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message ?? 'Unable to save payout configuration. Try again after resolving validation errors.',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedFunding = fundingOptions.find((option) => option.value === formState.fundingSourceId);

  return (
    <section className="space-y-6" aria-labelledby="wallet-payout-setup">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation studio</p>
          <h3 id="wallet-payout-setup" className="text-2xl font-semibold text-slate-900">
            Payout orchestration
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Define payout cadences, route funds to trusted accounts, and keep compliance requirements front and center.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCreateFundingSource?.()}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add funding source
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-3xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
              : 'border-rose-200 bg-rose-50/70 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace ID</span>
              <input
                name="workspaceId"
                value={formState.workspaceId}
                onChange={handleChange}
                placeholder="workspace-123"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary funding source</span>
              <select
                name="fundingSourceId"
                value={formState.fundingSourceId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select source</option>
                {fundingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frequency</span>
              <select
                name="frequency"
                value={formState.frequency}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred day</span>
              <select
                name="dayOfWeek"
                value={formState.dayOfWeek}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-transfer threshold</span>
              <input
                name="threshold"
                type="number"
                step="0.01"
                value={formState.threshold}
                onChange={handleChange}
                placeholder="25000"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minimum payout</span>
              <input
                name="minimumPayout"
                type="number"
                step="0.01"
                value={formState.minimumPayout}
                onChange={handleChange}
                placeholder="100"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="autoApprove"
              checked={formState.autoApprove}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            Enable automatic payouts when balance exceeds threshold
          </label>

          <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="dualControl"
              checked={formState.dualControl}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            Require dual approval for manual disbursements
          </label>

          <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="retainReserve"
              checked={formState.retainReserve}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            Retain 10% reserve in escrow after each payout cycle
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alerts & notifications</span>
            <input
              name="notificationsEmail"
              type="email"
              value={formState.notificationsEmail}
              onChange={handleChange}
              placeholder="treasury@workspace.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckBadgeIcon className={saving ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" /> Save cadence
            </button>
            <button
              type="button"
              onClick={() => onPreviewSchedule?.(formState)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" /> Preview schedule
            </button>
          </div>

          {selectedFunding ? (
            <p className="text-xs text-slate-500">
              Routing payouts to <span className="font-semibold text-slate-700">{selectedFunding.label}</span> in {selectedFunding.currency}.
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Next payouts</h4>
            <p className="mt-1 text-xs text-slate-500">
              Forecast upcoming disbursements to keep finance and client teams ahead of cash movement.
            </p>
            <div className="mt-4 space-y-3">
              {schedulePreview.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <ArrowRightIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Compliance guardrails</h4>
            <p className="mt-1 text-xs text-slate-500">Audit the readiness of downstream processes before approving payouts.</p>
            <ComplianceChecklist compliance={compliance} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Program summary</h4>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Frequency</dt>
                <dd className="font-semibold text-slate-900">{formatStatus(formState.frequency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Threshold</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(formState.threshold || 0, workspaceCurrency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Minimum payout</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(formState.minimumPayout || 0, workspaceCurrency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Dual control</dt>
                <dd className="font-semibold text-slate-900">{formatStatus(formState.dualControl ? 'enabled' : 'disabled')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </form>
    </section>
  );
}

PayoutSetup.propTypes = {
  workspaceId: PropTypes.string,
  settings: PropTypes.object,
  fundingSources: PropTypes.arrayOf(PropTypes.object),
  compliance: PropTypes.object,
  loading: PropTypes.bool,
  onCreateFundingSource: PropTypes.func,
  onSave: PropTypes.func,
  onPreviewSchedule: PropTypes.func,
  workspaceCurrency: PropTypes.string,
};

PayoutSetup.defaultProps = {
  workspaceId: '',
  settings: null,
  fundingSources: [],
  compliance: null,
  loading: false,
  onCreateFundingSource: undefined,
  onSave: undefined,
  onPreviewSchedule: undefined,
  workspaceCurrency: 'USD',
};
