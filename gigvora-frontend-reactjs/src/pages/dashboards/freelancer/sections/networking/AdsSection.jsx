import { useEffect, useMemo, useState } from 'react';
import SectionShell from '../../SectionShell.jsx';
import AdsPanel from './AdsPanel.jsx';

function InsightCard({ label, value, hint, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-200 bg-white text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        toneClasses[tone] ?? toneClasses.slate
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) {
    return null;
  }
  const palette = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    paused: 'bg-amber-100 text-amber-700 border-amber-200',
    expired: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const normalised = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${
        palette[normalised] ?? palette.draft
      }`}
    >
      {normalised.replace(/_/g, ' ')}
    </span>
  );
}

function CreativePreview({ campaign }) {
  if (!campaign) {
    return (
      <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Launch a campaign to preview how your creative appears across Gigvora placements.
      </div>
    );
  }

  const creative = campaign.metadata?.creative ?? {};
  const placements = Array.isArray(campaign.metadata?.placements)
    ? campaign.metadata.placements
    : String(campaign.metadata?.placements ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  const isVideo = creative.mediaUrl ? /\.(mp4|webm|ogg)$/i.test(creative.mediaUrl) : false;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-slate-900/60">
        {creative.mediaUrl ? (
          isVideo ? (
            <video
              className="h-full w-full object-cover"
              src={creative.mediaUrl}
              controls
              preload="metadata"
            >
              <track kind="captions" />
            </video>
          ) : (
            <img
              src={creative.mediaUrl}
              alt={creative.headline || campaign.name}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/80">
            <span className="text-sm uppercase tracking-[0.3em]">Creative preview</span>
            <span className="text-lg font-semibold">{campaign.name}</span>
          </div>
        )}
        {creative.cta ? (
          <span className="absolute bottom-4 left-4 inline-flex items-center rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            {creative.cta}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{creative.headline || campaign.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{creative.description || 'Share your positioning, proof, and offer.'}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>
        <dl className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
          <div>
            <dt className="uppercase tracking-wide">Objective</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 capitalize">{campaign.objective?.replace(/_/g, ' ') || 'Awareness'}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Flight</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : '—'} —{' '}
              {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Primary CTA</dt>
            <dd className="mt-1 text-sm font-semibold text-emerald-600">{creative.ctaUrl || 'Add your destination link'}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Placements</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {placements.length ? placements.join(', ') : 'Homepage hero, weekly digest, in-product rail'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function CampaignTable({ campaigns, loading, onEdit, onDelete, busy }) {
  if (!campaigns.length && !loading) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No campaigns yet. Launch your first Gigvora Ad to reach founders, operators, and hiring managers.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Campaign</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Budget</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Spend</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Performance</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {campaigns.map((campaign) => {
            const metrics = campaign.metrics ?? {};
            const ctr = metrics.impressions ? ((metrics.clicks / metrics.impressions) * 100).toFixed(1) : null;
            return (
              <tr key={campaign.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{campaign.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{campaign.objective?.replace(/_/g, ' ') || 'awareness'}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{campaign.budgetFormatted ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{campaign.spendFormatted ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex flex-col gap-1">
                    <span>{(metrics.impressions ?? 0).toLocaleString()} impressions</span>
                    <span>{metrics.clicks ?? 0} clicks · {metrics.conversions ?? 0} conversions</span>
                    <span>{ctr ? `${ctr}% CTR` : 'CTR tracking soon'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(campaign)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(campaign)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdsSection({
  campaigns = [],
  insights = {},
  loading = false,
  busy = false,
  error = null,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}) {
  const [panelState, setPanelState] = useState({ open: false, campaign: null });
  const [pending, setPending] = useState(false);
  const [banner, setBanner] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);

  const latestCampaign = useMemo(() => {
    if (!campaigns.length) {
      return null;
    }
    return campaigns[0];
  }, [campaigns]);

  useEffect(() => {
    setDismissedError(false);
  }, [error]);

  const handleCreate = async (payload) => {
    setPending(true);
    setBanner(null);
    setDismissedError(false);
    try {
      await onCreate?.(payload);
      setBanner({ tone: 'success', message: 'Campaign saved.' });
    } catch (err) {
      const message = err?.message ?? 'Unable to save campaign.';
      setBanner({ tone: 'error', message });
      throw err;
    } finally {
      setPending(false);
    }
  };

  const handleUpdate = async (campaignId, payload) => {
    setPending(true);
    setBanner(null);
    setDismissedError(false);
    try {
      await onUpdate?.(campaignId, payload);
      setBanner({ tone: 'success', message: 'Campaign updated.' });
    } catch (err) {
      const message = err?.message ?? 'Unable to update campaign.';
      setBanner({ tone: 'error', message });
      throw err;
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (campaign) => {
    if (!campaign) {
      return;
    }
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`Delete ${campaign.name}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    setPending(true);
    setBanner(null);
    setDismissedError(false);
    try {
      await onDelete?.(campaign.id);
      setBanner({ tone: 'success', message: 'Campaign deleted.' });
    } catch (err) {
      const message = err?.message ?? 'Unable to delete campaign.';
      setBanner({ tone: 'error', message });
    } finally {
      setPending(false);
    }
  };

  const insightCards = useMemo(
    () => [
      {
        id: 'spend',
        label: 'Total spend',
        value: insights.totalSpendFormatted ?? '—',
        hint: `${insights.activeCampaigns ?? 0} active campaigns`,
        tone: 'emerald',
      },
      {
        id: 'impressions',
        label: 'Impressions',
        value: insights.totalImpressions ? insights.totalImpressions.toLocaleString() : '—',
        hint: `${insights.totalClicks ?? 0} clicks`,
        tone: 'blue',
      },
      {
        id: 'clicks',
        label: 'Engagement',
        value: insights.totalClicks ? `${insights.totalClicks.toLocaleString()} clicks` : '—',
        hint: `${insights.averageCpc ? `$${Number(insights.averageCpc).toFixed(2)} CPC` : 'CPC pending'}`,
        tone: 'violet',
      },
      {
        id: 'conversions',
        label: 'Conversions',
        value: campaigns.reduce((total, campaign) => total + (campaign.metrics?.conversions ?? 0), 0).toLocaleString(),
        hint: 'Attributed bookings',
        tone: 'amber',
      },
    ],
    [campaigns, insights.averageCpc, insights.totalClicks, insights.totalImpressions, insights.totalSpendFormatted, insights.activeCampaigns],
  );

  const renderBanner = () => {
    const errorBanner = error && !dismissedError ? { tone: 'error', message: error } : null;
    const activeBanner = banner ?? errorBanner;
    if (!activeBanner) {
      return null;
    }
    const toneStyles = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      error: 'border-rose-200 bg-rose-50 text-rose-700',
      info: 'border-blue-200 bg-blue-50 text-blue-700',
    };
    return (
      <div className={`flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-sm ${
        toneStyles[activeBanner.tone] ?? toneStyles.info
      }`}>
        <span>{activeBanner.message}</span>
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-wide"
          onClick={() => {
            setBanner(null);
            if (activeBanner === errorBanner) {
              setDismissedError(true);
            }
          }}
        >
          Dismiss
        </button>
      </div>
    );
  };

  return (
    <SectionShell
      id="network-ads"
      title="Gigvora Ads"
      description="Run growth experiments, track performance, and fine-tune creatives targeting high-intent clients."
      actions={[
        onRefresh
          ? (
            <button
              key="refresh"
              type="button"
              onClick={() => onRefresh?.()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              disabled={busy || pending}
            >
              Refresh
            </button>
          )
          : null,
        <button
          key="launch"
          type="button"
          onClick={() => setPanelState({ open: true, campaign: null })}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={busy || pending}
        >
          Launch campaign
        </button>,
      ].filter(Boolean)}
    >
      {renderBanner()}

      <div className="grid gap-6 lg:grid-cols-4">
        {insightCards.map((card) => (
          <InsightCard key={card.id} label={card.label} value={card.value} hint={card.hint} tone={card.tone} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CampaignTable
          campaigns={campaigns}
          loading={loading}
          onEdit={(campaign) => setPanelState({ open: true, campaign })}
          onDelete={handleDelete}
          busy={busy || pending}
        />
        <CreativePreview campaign={latestCampaign} />
      </div>

      <AdsPanel
        open={panelState.open}
        campaign={panelState.campaign}
        onClose={() => setPanelState({ open: false, campaign: null })}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        busy={pending || busy}
      />
    </SectionShell>
  );
}
