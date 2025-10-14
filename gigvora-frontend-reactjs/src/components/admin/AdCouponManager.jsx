import { useEffect, useMemo, useState } from 'react';
import {
  SparklesIcon,
  TicketIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  fetchAdCoupons,
  createAdCoupon,
  updateAdCoupon,
} from '../../services/admin.js';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
  expired: 'bg-slate-200 text-slate-600 border-slate-300',
  archived: 'bg-slate-200 text-slate-500 border-slate-300',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DEFAULT_FORM = {
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: 15,
  status: 'scheduled',
  startAt: '',
  endAt: '',
  maxRedemptions: '',
  perUserLimit: '',
  surfaceTargets: '',
  placements: '',
};

function formatDiscount(coupon) {
  if (coupon.discountType === 'fixed_amount') {
    return `Save $${Number(coupon.discountValue ?? 0).toFixed(0)}`;
  }
  return `Save ${Number(coupon.discountValue ?? 0).toFixed(0)}%`;
}

function formatDate(value) {
  if (!value) {
    return 'Anytime';
  }
  try {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (error) {
    return 'Anytime';
  }
}

function buildStatusBadge(status) {
  const normalized = `${status ?? 'draft'}`.toLowerCase();
  return STATUS_COLORS[normalized] ?? STATUS_COLORS.draft;
}

function normalizeLifecycleStatus(coupon) {
  if (!coupon) {
    return 'draft';
  }
  return coupon.lifecycleStatus ?? coupon.status ?? 'draft';
}

function summarizePlacements(placements = []) {
  if (!placements.length) {
    return 'No placements assigned';
  }
  const surfaces = Array.from(new Set(placements.map((placement) => placement.surface)));
  return `${placements.length} placement${placements.length === 1 ? '' : 's'} • ${surfaces.join(', ')}`;
}

export default function AdCouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchAdCoupons({ includePlacements: true })
      .then((response) => {
        if (!isMounted) return;
        setCoupons(Array.isArray(response) ? response : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message ?? 'Unable to load ad coupons.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const metrics = useMemo(() => {
    if (!coupons.length) {
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        placements: 0,
      };
    }
    const active = coupons.filter((coupon) => normalizeLifecycleStatus(coupon) === 'active').length;
    const scheduled = coupons.filter((coupon) => normalizeLifecycleStatus(coupon) === 'scheduled').length;
    const placements = coupons.reduce((sum, coupon) => sum + (coupon.placements?.length ?? 0), 0);
    return {
      total: coupons.length,
      active,
      scheduled,
      placements,
    };
  }, [coupons]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        status: form.status,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
        surfaceTargets: form.surfaceTargets
          ? form.surfaceTargets
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : undefined,
        placements: form.placements
          ? form.placements
              .split(',')
              .map((value) => Number.parseInt(value.trim(), 10))
              .filter((value) => Number.isInteger(value) && value > 0)
              .map((placementId, index) => ({ placementId, priority: index }))
          : undefined,
      };
      await createAdCoupon(payload);
      setSuccessMessage('Coupon created successfully.');
      resetForm();
      setRefreshIndex((index) => index + 1);
    } catch (err) {
      setError(err?.message ?? 'Unable to create coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    if (!coupon) return;
    setSaving(true);
    setError(null);
    const lifecycle = normalizeLifecycleStatus(coupon);
    const nextStatus = lifecycle === 'active' ? 'paused' : 'active';
    try {
      await updateAdCoupon(coupon.id, { status: nextStatus });
      setSuccessMessage(
        nextStatus === 'active' ? 'Coupon activated.' : 'Coupon paused until you reactivate it.',
      );
      setRefreshIndex((index) => index + 1);
    } catch (err) {
      setError(err?.message ?? 'Unable to update coupon status.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (coupon) => {
    if (!coupon) return;
    setSaving(true);
    setError(null);
    try {
      await updateAdCoupon(coupon.id, { status: 'archived' });
      setSuccessMessage('Coupon archived. It will no longer appear in ad surfaces.');
      setRefreshIndex((index) => index + 1);
    } catch (err) {
      setError(err?.message ?? 'Unable to archive coupon.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <SparklesIcon className="h-4 w-4" /> Coupon orchestration
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Campaign incentives</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Launch, pause, and assign promotional coupons across ad placements. Attach active incentives to
            surface-level campaigns so members see timely offers alongside creatives.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <ArrowPathIcon className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total coupons</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Live</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{metrics.active}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Scheduled</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">{metrics.scheduled}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Placement links</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.placements}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Synchronising coupon catalogue…
            </div>
          ) : !coupons.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-500">
              No coupons configured yet. Create your first incentive to elevate ad placements.
            </div>
          ) : (
            coupons.map((coupon) => {
              const lifecycle = normalizeLifecycleStatus(coupon);
              const badgeClass = buildStatusBadge(lifecycle);
              return (
                <div
                  key={coupon.id}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/40 to-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow-sm ${badgeClass}`}>
                        {lifecycle}
                      </div>
                      <h3 className="mt-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <TicketIcon className="h-5 w-5 text-blue-500" /> {coupon.code}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-700">{coupon.name}</p>
                      {coupon.description ? (
                        <p className="mt-1 text-sm text-slate-600">{coupon.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                        {formatDiscount(coupon)}
                      </span>
                      <span className="text-xs text-slate-500">
                        Valid {formatDate(coupon.startAt)} – {formatDate(coupon.endAt)}
                      </span>
                      <span className="text-xs text-slate-500">{summarizePlacements(coupon.placements)}</span>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                          disabled={saving}
                        >
                          {normalizeLifecycleStatus(coupon) === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(coupon)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-red-200 hover:text-red-600"
                          disabled={saving}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <PlusIcon className="h-4 w-4" /> Create coupon
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure a launch-ready incentive and optionally map it to existing placements by ID.
          </p>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="coupon-code">
                Code
              </label>
              <input
                id="coupon-code"
                name="code"
                value={form.code}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="coupon-name">
                Name
              </label>
              <input
                id="coupon-name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="coupon-description">
                Description
              </label>
              <textarea
                id="coupon-description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="discount-type">
                  Discount type
                </label>
                <select
                  id="discount-type"
                  name="discountType"
                  value={form.discountType}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="discount-value">
                  Value
                </label>
                <input
                  id="discount-value"
                  name="discountValue"
                  type="number"
                  min="1"
                  step="1"
                  value={form.discountValue}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="coupon-status">
                Status
              </label>
              <select
                id="coupon-status"
                name="status"
                value={form.status}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="start-at">
                  Starts
                </label>
                <input
                  id="start-at"
                  name="startAt"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="end-at">
                  Ends
                </label>
                <input
                  id="end-at"
                  name="endAt"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="max-redemptions">
                  Max redemptions
                </label>
                <input
                  id="max-redemptions"
                  name="maxRedemptions"
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxRedemptions}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="per-user-limit">
                  Per-user limit
                </label>
                <input
                  id="per-user-limit"
                  name="perUserLimit"
                  type="number"
                  min="1"
                  step="1"
                  value={form.perUserLimit}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="surface-targets">
                Surface targets
              </label>
              <input
                id="surface-targets"
                name="surfaceTargets"
                value={form.surfaceTargets}
                onChange={handleInputChange}
                placeholder="e.g. user_dashboard, global_dashboard"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="placement-ids">
                Placement IDs
              </label>
              <input
                id="placement-ids"
                name="placements"
                value={form.placements}
                onChange={handleInputChange}
                placeholder="Comma-separated IDs"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-300 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? 'Saving…' : 'Create coupon'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
