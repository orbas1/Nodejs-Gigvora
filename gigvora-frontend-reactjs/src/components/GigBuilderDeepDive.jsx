import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  RocketLaunchIcon,
  SparklesIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import useCachedResource from '../hooks/useCachedResource.js';
import DataStatus from './DataStatus.jsx';
import { fetchGigBuilderExperience } from '../services/gigBuilder.js';

const MEDIA_ICON_MAP = {
  video: VideoCameraIcon,
  image: PhotoIcon,
  document: DocumentTextIcon,
};

const DEVICE_LABELS = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

function formatTagLabelFromSlug(slug) {
  if (!slug) {
    return '';
  }
  return `${slug}`
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function MetricTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value ?? '—'}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function RequirementList({ title, items }) {
  if (!items?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item.label ?? item.question} className="flex gap-3">
            <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <div>
              <p className="font-medium text-slate-700">{item.label ?? item.question}</p>
              {item.description ? <p>{item.description}</p> : null}
              {item.answer ? <p>{item.answer}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GigBuilderDeepDive({ freelancerId, gigId }) {
  const enabled = Boolean(freelancerId);
  const cacheKey = useMemo(
    () => (enabled ? `gig-builder:${freelancerId}${gigId ? `:${gigId}` : ''}` : null),
    [enabled, freelancerId, gigId],
  );

  const { data, loading, error, refresh, fromCache, lastUpdated } = useCachedResource(
    cacheKey,
    ({ signal }) => fetchGigBuilderExperience(freelancerId, { gigId, signal }),
    { enabled },
  );

  const previews = data?.previews ?? [];
  const [activeDevice, setActiveDevice] = useState(data?.previewSummary?.activeDevice ?? null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const nextDevice = data?.previewSummary?.activeDevice ?? previews[0]?.deviceType ?? null;
    setActiveDevice((current) => {
      if (!nextDevice) {
        return null;
      }
      if (current && previews.some((preview) => preview.deviceType === current)) {
        return current;
      }
      return nextDevice;
    });
  }, [enabled, data?.previewSummary?.activeDevice, previews]);

  const activePreview = useMemo(
    () => previews.find((preview) => preview.deviceType === activeDevice) ?? null,
    [previews, activeDevice],
  );

  const packages = data?.pricing?.packages ?? [];
  const addons = data?.addons ?? [];
  const callToActions = data?.callToActions ?? [];
  const mediaAssets = data?.media ?? [];
  const sellingPoints = data?.sellingPoints ?? [];
  const requirements = data?.requirements ?? [];
  const faqs = data?.faqs ?? [];
  const conversionCopy = data?.conversionCopy ?? {};
  const performance = data?.performance ?? {};
  const seoTags = useMemo(() => {
    const rawTags = Array.isArray(data?.seo?.tags)
      ? data.seo.tags
      : Array.isArray(data?.gig?.taxonomies)
        ? data.gig.taxonomies
        : [];
    if (!rawTags.length) {
      return [];
    }
    const seen = new Set();
    return rawTags
      .map((tag) => {
        const slug = tag?.slug;
        if (!slug) {
          return null;
        }
        const key = `${slug}`.toLowerCase();
        if (seen.has(key)) {
          return null;
        }
        seen.add(key);
        const label =
          typeof tag?.label === 'string' && tag.label.trim().length
            ? tag.label.trim()
            : formatTagLabelFromSlug(slug);
        return {
          slug,
          label,
          type: tag?.type ?? null,
          weight: tag?.weight ?? null,
          source: tag?.source ?? null,
        };
      })
      .filter(Boolean);
  }, [data?.seo?.tags, data?.gig?.taxonomies]);
  const seoSummary = useMemo(() => {
    const summary = data?.seo?.summary ?? {};
    const total = typeof summary.total === 'number' ? summary.total : seoTags.length;
    const primaryTypes = Array.isArray(summary.primaryTypes)
      ? summary.primaryTypes.filter((type) => typeof type === 'string' && type.trim().length)
      : Array.from(new Set(seoTags.map((tag) => tag.type).filter(Boolean)));
    return { total, primaryTypes };
  }, [data?.seo?.summary, seoTags]);

  const pricingRangeLabel = data?.pricing?.formattedRange ?? null;
  const hero = data?.gig?.hero ?? {};

  const sellingPointChunks = useMemo(() => {
    if (!sellingPoints.length) return [];
    return sellingPoints.map((point, index) => ({ id: `${index}-${point}`, text: point }));
  }, [sellingPoints]);

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Assign a freelancer profile to load the gig builder experience.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-600">
      <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <RocketLaunchIcon className="h-4 w-4" />
              Gig builder blueprint
            </div>
            <h3 className="text-2xl font-semibold text-slate-900">{data?.gig?.title ?? 'Gig builder'}</h3>
            {hero.subtitle ? <p className="max-w-2xl text-sm text-slate-600">{hero.subtitle}</p> : null}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {hero.badge ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-blue-700">
                  {hero.badge}
                </span>
              ) : null}
              {hero.mediaUrl ? (
                <a
                  href={hero.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <VideoCameraIcon className="h-4 w-4" /> Preview hero media
                </a>
              ) : null}
            </div>
            {data?.gig?.summary ? (
              <p className="max-w-3xl text-sm text-slate-600">{data.gig.summary}</p>
            ) : null}
            {sellingPointChunks.length ? (
              <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {sellingPointChunks.map((point) => (
                  <li key={point.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {seoTags.length ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {seoTags.slice(0, 6).map((tag) => (
                  <span
                    key={tag.slug}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-blue-700"
                  >
                    <span>{tag.label}</span>
                    {tag.type ? (
                      <span className="text-[10px] font-normal uppercase tracking-wide text-blue-500">{tag.type}</span>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-white/80 px-4 py-3 text-xs text-blue-700">
                Tag this gig with SEO taxonomies to amplify marketplace discovery coverage.
              </div>
            )}
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.message || 'Unable to load gig builder data'}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tiered pricing matrix
              </h4>
              <p className="mt-1 text-sm">Packages engineered for different buyer personas and launch velocities.</p>
            </div>
            {pricingRangeLabel ? (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {pricingRangeLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4">
            {packages.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  tier.isBestValue
                    ? 'border-blue-300 bg-blue-50/70 shadow-[0_18px_35px_-24px_rgba(30,64,175,0.65)]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                      {tier.name}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {tier.price?.formatted ?? 'Custom'}
                    </p>
                    {tier.tagline ? <p className="text-xs text-slate-500">{tier.tagline}</p> : null}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    {tier.deliveryDays ? <p>{tier.deliveryDays} day turnaround</p> : null}
                    {tier.revisionCount ? <p>{tier.revisionCount} revisions included</p> : null}
                  </div>
                </div>
                {tier.description ? (
                  <p className="mt-3 text-sm text-slate-600">{tier.description}</p>
                ) : null}
                {tier.features?.length ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {!packages.length ? <p className="text-sm text-slate-500">No packages configured yet.</p> : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">SEO tagging readiness</h4>
            <p className="mt-1 text-sm text-blue-700">
              {seoSummary.total
                ? 'Discovery taxonomies are synced with the Gigvora search index.'
                : 'Add taxonomy tags so the gig surfaces in high-intent marketplace searches.'}
            </p>
            {seoTags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {seoTags.slice(0, 8).map((tag) => (
                  <span
                    key={tag.slug}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    <span>{tag.label}</span>
                    {tag.type ? (
                      <span className="text-[10px] uppercase tracking-wide text-blue-500">{tag.type}</span>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Tagged taxonomies</p>
                <p className="text-lg font-semibold text-blue-900">{seoSummary.total}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Primary focus areas</p>
                <p className="text-sm text-blue-900">
                  {Array.isArray(seoSummary.primaryTypes) && seoSummary.primaryTypes.length
                    ? seoSummary.primaryTypes.join(', ')
                    : 'No focus areas defined'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Add-on marketplace
            </h4>
            <p className="mt-1 text-sm">
              Curated upsells that sync with delivery schedules and checkout flows.
            </p>
            <ul className="mt-4 space-y-3">
              {addons.map((addon) => (
                <li
                  key={addon.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{addon.name}</p>
                      {addon.description ? (
                        <p className="text-sm text-slate-600">{addon.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-sm text-blue-600">
                      <p>{addon.price?.formatted ?? 'Custom quote'}</p>
                      {addon.deliveryDays ? (
                        <p className="text-xs text-slate-500">Adds {addon.deliveryDays} days</p>
                      ) : null}
                      {addon.isPopular ? (
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Popular upsell
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
              {!addons.length ? <p className="text-sm text-slate-500">No add-ons published.</p> : null}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Conversion copy framework
            </h4>
            <div className="mt-4 space-y-4">
              {conversionCopy.hook ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Hook</p>
                  <p className="text-sm text-slate-700">{conversionCopy.hook}</p>
                </div>
              ) : null}
              {Array.isArray(conversionCopy.valuePillars) && conversionCopy.valuePillars.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Value pillars</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {conversionCopy.valuePillars.map((pillar) => (
                      <li key={pillar} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                        <span>{pillar}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {conversionCopy.proof ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Proof</p>
                  <p className="text-sm text-slate-700">{conversionCopy.proof}</p>
                </div>
              ) : null}
              {conversionCopy.guarantee ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Guarantee</p>
                  <p className="text-sm text-slate-700">{conversionCopy.guarantee}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Dynamic call-to-actions
            </h4>
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Audience-specific CTAs powering the freelancer banner creator and promo automation.
          </p>
          <div className="mt-4 space-y-3">
            {callToActions.map((cta) => (
              <div key={cta.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cta.headline}</p>
                    {cta.subheadline ? <p className="text-sm text-slate-600">{cta.subheadline}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-blue-700">
                        {cta.buttonLabel}
                      </span>
                      {cta.audienceSegment ? <span>Segment: {cta.audienceSegment}</span> : null}
                      {cta.stylePreset ? <span>Style: {cta.stylePreset}</span> : null}
                    </div>
                  </div>
                  <div className="text-right text-sm text-blue-600">
                    {cta.expectedLiftFormatted ? <p>{cta.expectedLiftFormatted} CTR</p> : null}
                    {cta.badge ? (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        {cta.badge}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!callToActions.length ? <p className="text-sm text-slate-500">No CTA experiments tracked.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Device previews</h4>
          <p className="mt-1 text-sm">Preview the gig experience across desktop, tablet, and mobile layouts.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {previews.map((preview) => (
              <button
                key={preview.id}
                type="button"
                onClick={() => setActiveDevice(preview.deviceType)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  activeDevice === preview.deviceType
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {DEVICE_LABELS[preview.deviceType] ?? preview.deviceType}
              </button>
            ))}
          </div>
          {activePreview ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">{DEVICE_LABELS[activePreview.deviceType]}</p>
              {activePreview.headline ? <p className="mt-2">{activePreview.headline}</p> : null}
              {activePreview.supportingCopy ? <p className="mt-2 text-xs text-slate-500">{activePreview.supportingCopy}</p> : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                {activePreview.metrics?.formattedConversionRate ? (
                  <span>Conversion: {activePreview.metrics.formattedConversionRate}</span>
                ) : null}
                {activePreview.previewUrl ? (
                  <a
                    href={activePreview.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    View mockup
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No preview layouts configured.</p>
          )}

          <div className="mt-5 space-y-3">
            {mediaAssets.map((asset) => {
              const Icon = MEDIA_ICON_MAP[asset.type] ?? SparklesIcon;
              return (
                <div key={asset.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-slate-700">{asset.caption ?? asset.url}</p>
                      <p className="text-xs text-slate-400">
                        {asset.type}
                        {asset.processingStatus ? ` • ${asset.processingStatus}` : ''}
                      </p>
                    </div>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700"
                  >
                    Open
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <MetricTile
            label="Conversion rate"
            value={performance.conversionRateFormatted ?? '—'}
            hint={performance.baseline?.conversionRate ? `Baseline ${performance.baseline.conversionRate}%` : undefined}
          />
          <MetricTile
            label="Average cart value"
            value={performance.averageOrderValueFormatted ?? '—'}
            hint={performance.baseline?.averageOrderValue ? `Baseline $${performance.baseline.averageOrderValue}` : undefined}
          />
          <MetricTile
            label="Upsell take rate"
            value={performance.upsellTakeRateFormatted ?? '—'}
            hint={performance.baseline?.upsellTakeRate ? `Baseline ${performance.baseline.upsellTakeRate}%` : undefined}
          />
        </div>
        <div className="space-y-4">
          <MetricTile
            label="Completion rate"
            value={performance.completionRateFormatted ?? '—'}
            hint={performance.reviewScore ? `Review score ${performance.reviewScore}/5` : undefined}
          />
          <MetricTile
            label="Bookings (30d)"
            value={performance.bookingsLast30Days != null ? performance.bookingsLast30Days : '—'}
            hint={performance.periodLabel ?? undefined}
          />
          {performance.experimentNotes?.promoBannerLift ? (
            <MetricTile
              label="Promo banner lift"
              value={`+${performance.experimentNotes.promoBannerLift}%`}
              hint={`Variant ${performance.experimentNotes.highlightedVariant ?? 'A'}`}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RequirementList
          title="Client requirements"
          items={requirements}
        />
        <RequirementList title="FAQs" items={faqs} />
      </div>
    </div>
  );
}

GigBuilderDeepDive.propTypes = {
  freelancerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  gigId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
