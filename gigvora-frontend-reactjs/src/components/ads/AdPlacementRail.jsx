import { useEffect, useMemo, useState } from 'react';
import { SparklesIcon, TicketIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { fetchAdPlacements } from '../../services/ads.js';

const SURFACE_LABELS = {
  global_dashboard: 'Gigvora network',
  company_dashboard: 'Company dashboard',
  agency_dashboard: 'Agency dashboard',
  freelancer_dashboard: 'Freelancer dashboard',
  user_dashboard: 'Member dashboard',
  headhunter_dashboard: 'Headhunter dashboard',
  admin_dashboard: 'Admin control centre',
  pipeline_dashboard: 'Pipeline operations',
};

const LIFECYCLE_BADGES = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  scheduled: 'border-blue-200 bg-blue-50 text-blue-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-500',
  archived: 'border-slate-200 bg-slate-100 text-slate-500',
  draft: 'border-slate-200 bg-slate-100 text-slate-500',
};

function formatDiscount(coupon) {
  if (coupon.discountType === 'fixed_amount') {
    return `Save $${Number(coupon.discountValue ?? 0).toFixed(0)}`;
  }
  return `Save ${Number(coupon.discountValue ?? 0).toFixed(0)}%`;
}

function formatRange(startAt, endAt) {
  if (!startAt && !endAt) {
    return 'Always on';
  }
  const format = (value) => {
    if (!value) return 'Now';
    try {
      const date = new Date(value);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Now';
    }
  };
  return `${format(startAt)} – ${format(endAt)}`;
}

function humanize(value) {
  if (!value) return '';
  return `${value}`
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function lifecycleBadge(status) {
  const normalized = `${status ?? 'draft'}`.toLowerCase();
  return LIFECYCLE_BADGES[normalized] ?? LIFECYCLE_BADGES.draft;
}

function OfferCard({ offer, variant = 'desktop' }) {
  const lifecycle = lifecycleBadge(offer.lifecycleStatus);
  const lifecycleLabel = humanize(offer.lifecycleStatus || '');
  const windowLabel = formatRange(offer.startAt, offer.endAt);
  const placementLabel = humanize(offer.placementPosition || '');

  const baseCardClass = offer.isActive
    ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/60'
    : 'border-slate-200 bg-white';

  const containerClass =
    variant === 'mobile'
      ? `rounded-3xl border ${baseCardClass} p-5 shadow-md shadow-blue-100/40`
      : `rounded-2xl border ${baseCardClass} p-4 shadow-sm`;

  const headlineClass = variant === 'mobile' ? 'text-base font-semibold text-slate-900' : 'text-sm font-medium text-slate-800';
  const descriptionClass = variant === 'mobile' ? 'text-sm text-slate-600' : 'text-xs text-slate-600';
  const ctaClass =
    variant === 'mobile'
      ? 'mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-300/60 transition hover:bg-blue-700'
      : 'mt-3 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-blue-700';
  const metaClass = variant === 'mobile' ? 'mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500' : 'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500';

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-blue-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
            <SparklesIcon className="h-4 w-4" /> {offer.discountLabel}
          </div>
          <h4 className={`flex items-center gap-2 ${headlineClass}`}>
            <TicketIcon className="h-4 w-4 text-blue-500" /> {offer.code}
          </h4>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${lifecycle}`}>
          {lifecycleLabel || humanize(offer.lifecycleStatus)}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <p className={headlineClass}>{offer.headline}</p>
        {offer.description ? <p className={descriptionClass}>{offer.description}</p> : null}
      </div>
      <div className={metaClass}>
        <span className="font-medium text-slate-600">{offer.surfaceLabel}</span>
        {placementLabel ? <span>{placementLabel}</span> : null}
        <span>{windowLabel}</span>
      </div>
      <a
        href={offer.ctaUrl}
        target="_blank"
        rel="noreferrer"
        className={ctaClass}
      >
        {offer.callToAction}
      </a>
      {offer.termsUrl ? (
        <a
          href={offer.termsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-center text-[11px] font-medium text-slate-500 transition hover:text-blue-600"
        >
          Terms &amp; details
        </a>
      ) : null}
    </div>
  );
}

export default function AdPlacementRail({ surface }) {
  const resolvedSurface = surface || 'global_dashboard';
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!resolvedSurface) {
      setPlacements([]);
      return undefined;
    }
    setLoading(true);
    setError(null);
    fetchAdPlacements({ surface: resolvedSurface })
      .then((response) => {
        if (!isMounted) return;
        setPlacements(Array.isArray(response) ? response : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message ?? 'Unable to load ad placements.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedSurface, refreshIndex]);

  const offers = useMemo(() => {
    if (!placements.length) {
      return [];
    }
    return placements
      .flatMap((placement) => {
        const coupons = Array.isArray(placement.coupons) ? placement.coupons : [];
        return coupons.map((coupon) => ({
          id: `${placement.id}:${coupon.id}`,
          code: coupon.code,
          headline: placement.creative?.headline ?? coupon.name,
          description: placement.creative?.subheadline ?? coupon.description ?? '',
          discountLabel: formatDiscount(coupon),
          lifecycleStatus: coupon.lifecycleStatus ?? coupon.status ?? 'draft',
          isActive: Boolean(coupon.isActive),
          surface: placement.surface,
          surfaceLabel: SURFACE_LABELS[placement.surface] ?? placement.surface,
          placementPosition: placement.position,
          startAt: coupon.startAt ?? placement.startAt ?? null,
          endAt: coupon.endAt ?? placement.endAt ?? null,
          callToAction: placement.creative?.callToAction ?? coupon.metadata?.cta ?? 'Redeem now',
          ctaUrl: coupon.metadata?.ctaUrl ?? placement.creative?.ctaUrl ?? coupon.termsUrl ?? '#',
          termsUrl: coupon.termsUrl ?? null,
        }));
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        if (a.startAt && b.startAt) {
          return new Date(a.startAt) - new Date(b.startAt);
        }
        return a.code.localeCompare(b.code);
      });
  }, [placements]);

  const visibleOffers = offers.slice(0, 3);
  const surfaceLabel = SURFACE_LABELS[resolvedSurface] ?? resolvedSurface;

  if (!resolvedSurface) {
    return null;
  }

  const renderState = (variant) => {
    if (error) {
      const errorClass =
        variant === 'mobile'
          ? 'mt-4 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700'
          : 'mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700';
      return <div className={errorClass}>{error}</div>;
    }
    if (loading) {
      const loadingClass =
        variant === 'mobile'
          ? 'mt-4 rounded-3xl border border-slate-200 bg-white/70 p-5 text-sm text-slate-500'
          : 'mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500';
      return <div className={loadingClass}>Loading offers…</div>;
    }
    if (!visibleOffers.length) {
      const emptyClass =
        variant === 'mobile'
          ? 'mt-4 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-500'
          : 'mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-xs text-slate-500';
      return (
        <div className={emptyClass}>
          No coupons active for this surface yet. Launch one from the admin control tower.
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-4">
        {visibleOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} variant={variant} />
        ))}
      </div>
    );
  };

  return (
    <>
      <section className="order-last w-full px-4 pb-6 sm:px-6 xl:hidden">
        <div className="rounded-3xl border border-slate-200 bg-white/90 px-5 py-6 shadow-lg shadow-blue-100/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Ad spotlight</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{surfaceLabel}</h3>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
              onClick={() => setRefreshIndex((index) => index + 1)}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
          {renderState('mobile')}
        </div>
      </section>

      <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:border-l xl:border-slate-200 xl:bg-white/80 xl:px-5 xl:py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Ad spotlight</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{surfaceLabel}</h3>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
            onClick={() => setRefreshIndex((index) => index + 1)}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
        {renderState('desktop')}
      </aside>
    </>
  );
}
