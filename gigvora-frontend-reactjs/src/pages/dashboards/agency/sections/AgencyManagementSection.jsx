import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  PlayIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../../../../components/DataStatus.jsx';
import AgencyProfileWorkspace from '../../../../components/dashboard/agency/AgencyProfileWorkspace.jsx';

function formatNumber(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (numeric >= 1000) {
    return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
  }
  return `${numeric}`;
}

function SummaryCard({ title, value, helper, icon: Icon }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
};

SummaryCard.defaultProps = {
  helper: undefined,
};

export default function AgencyManagementSection({
  overview,
  workspace,
  loading,
  error,
  onRefresh,
}) {
  const metrics = overview?.metrics ?? {};
  const profile = overview?.agencyProfile ?? {};

  const summaryCards = useMemo(
    () => [
      {
        key: 'clients',
        title: 'Active clients',
        value: formatNumber(metrics.activeClients),
        helper: metrics.clientGrowth != null ? `${metrics.clientGrowth}% growth vs last 30 days` : undefined,
        icon: BuildingOffice2Icon,
      },
      {
        key: 'projects',
        title: 'Live projects',
        value: formatNumber(metrics.liveProjects),
        helper: metrics.projectDeliveryRate != null ? `${metrics.projectDeliveryRate}% on-time delivery` : undefined,
        icon: BriefcaseIcon,
      },
      {
        key: 'team',
        title: 'Team size',
        value: formatNumber(metrics.totalTeamMembers ?? profile.teamSize),
        helper:
          metrics.utilisationPercent != null ? `${metrics.utilisationPercent}% utilisation` : 'Across all pods and seats',
        icon: UsersIcon,
      },
      {
        key: 'pipeline',
        title: 'Pipeline velocity',
        value:
          metrics.pipelineVelocityDays != null
            ? `${metrics.pipelineVelocityDays} days`
            : metrics.winRatePercent != null
            ? `${metrics.winRatePercent}% win rate`
            : '—',
        helper: 'Average time to convert marketing-qualified leads.',
        icon: ArrowPathIcon,
      },
    ],
    [metrics, profile.teamSize],
  );

  const contactDetails = useMemo(() => {
    const owner = overview?.owner ?? overview?.workspaceOwner ?? workspace?.owner ?? null;
    return [
      {
        label: 'Primary contact',
        value: owner ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() || owner.email : 'Unassigned',
        helper: owner?.email ? owner.email : null,
      },
      {
        label: 'Timezone',
        value: profile.timezone || workspace?.timezone || 'Not set',
        helper: profile.location || workspace?.location || undefined,
      },
      {
        label: 'Website',
        value: profile.website || 'Not provided',
        helper: overview?.links?.portfolio ?? overview?.links?.website ?? undefined,
        icon: GlobeAltIcon,
      },
      {
        label: 'Showreel',
        value: profile.introVideoUrl ? 'Intro video linked' : 'Add your agency reel',
        helper: profile.introVideoUrl || undefined,
        icon: PlayIcon,
      },
    ];
  }, [overview?.owner, overview?.workspaceOwner, overview?.links, profile, workspace]);

  return (
    <section id="agency-management" className="space-y-8 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Agency</p>
          <h2 className="text-3xl font-semibold text-slate-900">Agency management</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Govern your workspace profile, surface brand collateral, and orchestrate client-facing readiness from a single
            control surface.
          </p>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          statusLabel="Agency overview"
        />
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.key} title={card.title} value={card.value} helper={card.helper} icon={card.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-4xl border border-slate-100 bg-slate-50/70 p-6 shadow-inner">
          <AgencyProfileWorkspace />
        </div>
        <aside className="flex flex-col gap-4 rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Operational dossier</h3>
          <p className="text-sm text-slate-500">
            Keep mission-critical contact and branding artefacts available to client partners and internal launch pods.
          </p>
          <dl className="space-y-4">
            {contactDetails.map((detail) => {
              const Icon = detail.icon;
              return (
                <div key={detail.label} className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                  {Icon ? (
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{detail.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{detail.value}</dd>
                    {detail.helper ? <p className="mt-1 text-xs text-slate-500">{detail.helper}</p> : null}
                  </div>
                </div>
              );
            })}
          </dl>
        </aside>
      </div>
    </section>
  );
}

AgencyManagementSection.propTypes = {
  overview: PropTypes.object,
  workspace: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object, PropTypes.string]),
  onRefresh: PropTypes.func,
};

AgencyManagementSection.defaultProps = {
  overview: null,
  workspace: null,
  loading: false,
  error: null,
  onRefresh: undefined,
};
