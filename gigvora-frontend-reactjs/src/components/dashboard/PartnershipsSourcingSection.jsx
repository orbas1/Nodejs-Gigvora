import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function formatNumber(value, { fallback = '—', suffix = '' } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value}${suffix}`;
  }
  return `${numeric.toLocaleString()}${suffix}`;
}

function formatPercent(value, { fallback = '—' } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return `${numeric.toFixed(1)}%`;
}

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(numeric);
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}

EmptyState.propTypes = {
  message: PropTypes.node.isRequired,
};

function StatGrid({ items }) {
  if (!items?.length) {
    return null;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{item.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
          {item.helper ? <p className="mt-1 text-xs text-slate-500">{item.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}

StatGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      helper: PropTypes.string,
    }),
  ),
};

StatGrid.defaultProps = {
  items: undefined,
};

function LeaderboardTable({ items }) {
  if (!items?.length) {
    return <EmptyState message="No headhunter performance recorded in this window." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Partner</th>
            <th className="px-4 py-3">Placements</th>
            <th className="px-4 py-3">Response rate</th>
            <th className="px-4 py-3">Avg submit time</th>
            <th className="px-4 py-3">Quality</th>
            <th className="px-4 py-3">Active briefs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.map((item) => (
            <tr key={`${item.headhunterWorkspaceId ?? item.name}-${item.lastSubmissionAt ?? item.name}`}>
              <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.placements)}</td>
              <td className="px-4 py-3 text-slate-600">{formatPercent(item.responseRate)}</td>
              <td className="px-4 py-3 text-slate-600">
                {item.averageTimeToSubmitHours != null ? `${Number(item.averageTimeToSubmitHours).toFixed(1)} hrs` : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {item.qualityScore != null ? `${Number(item.qualityScore).toFixed(1)}/5` : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.activeBriefs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

LeaderboardTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      headhunterWorkspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      placements: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      responseRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      averageTimeToSubmitHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      qualityScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      activeBriefs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      lastSubmissionAt: PropTypes.string,
    }),
  ),
};

LeaderboardTable.defaultProps = {
  items: undefined,
};

function BriefPipelineTable({ items }) {
  if (!items?.length) {
    return <EmptyState message="Share a headhunter brief to activate the pipeline." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Brief</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Openings</th>
            <th className="px-4 py-3">Submissions</th>
            <th className="px-4 py-3">Placements</th>
            <th className="px-4 py-3">Next milestone</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.map((item) => (
            <tr key={item.id ?? item.title}>
              <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
              <td className="px-4 py-3 text-slate-600">{item.status?.replace(/_/g, ' ') ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.openings)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.submissions)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.placements)}</td>
              <td className="px-4 py-3 text-slate-600">
                {item.dueAt ? formatAbsolute(item.dueAt) : item.headhunters?.length ? `${item.headhunters.length} partners engaged` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

BriefPipelineTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      status: PropTypes.string,
      openings: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      submissions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      placements: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dueAt: PropTypes.string,
      headhunters: PropTypes.array,
    }),
  ),
};

BriefPipelineTable.defaultProps = {
  items: undefined,
};

function TalentPoolBreakdownTable({ items }) {
  if (!items?.length) {
    return <EmptyState message="Activate talent pools to monitor silver medalists and alumni." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Pool type</th>
            <th className="px-4 py-3">Pools</th>
            <th className="px-4 py-3">Candidates</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3">Hires</th>
            <th className="px-4 py-3">Avg time in pool</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.map((item) => (
            <tr key={item.type}>
              <td className="px-4 py-3 font-medium text-slate-900">{item.type.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.pools)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.candidates)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.active)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(item.hires)}</td>
              <td className="px-4 py-3 text-slate-600">
                {item.averageTimeInPoolDays != null ? `${Number(item.averageTimeInPoolDays).toFixed(1)} days` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TalentPoolBreakdownTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      pools: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      candidates: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      active: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      hires: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      averageTimeInPoolDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
};

TalentPoolBreakdownTable.defaultProps = {
  items: undefined,
};

function UpcomingList({ items, emptyMessage }) {
  if (!items?.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.poolName}-${item.candidateName ?? index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">{item.poolName}</p>
          {item.candidateName ? <p className="text-sm text-slate-600">{item.candidateName}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {item.nextActionAt ? <span>{formatAbsolute(item.nextActionAt)}</span> : null}
            {item.status ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{item.status.replace(/_/g, ' ')}</span> : null}
            {item.ownerName ? <span>Owner: {item.ownerName}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

UpcomingList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      poolName: PropTypes.string,
      candidateName: PropTypes.string,
      nextActionAt: PropTypes.string,
      status: PropTypes.string,
      ownerName: PropTypes.string,
    }),
  ),
  emptyMessage: PropTypes.node.isRequired,
};

UpcomingList.defaultProps = {
  items: undefined,
};

function RecentEngagementsList({ items }) {
  if (!items?.length) {
    return <EmptyState message="No recent talent pool engagements logged." />;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.poolName}-${item.occurredAt ?? index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-slate-900">{item.poolName}</p>
            {item.occurredAt ? <span className="text-xs text-slate-500">{formatRelativeTime(item.occurredAt)}</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{item.summary ?? 'Interaction logged.'}</p>
          {item.performedBy ? <p className="mt-2 text-xs text-slate-500">By {item.performedBy}</p> : null}
        </li>
      ))}
    </ul>
  );
}

RecentEngagementsList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      poolName: PropTypes.string,
      occurredAt: PropTypes.string,
      summary: PropTypes.string,
      status: PropTypes.string,
      ownerName: PropTypes.string,
    }),
  ),
};

RecentEngagementsList.defaultProps = {
  items: undefined,
};

function BillingTable({ billing }) {
  const upcoming = billing?.upcomingInvoices ?? [];
  if (!upcoming.length) {
    return <EmptyState message="No outstanding invoices from partner agencies." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {upcoming.map((invoice, index) => (
            <tr key={`${invoice.invoiceNumber ?? 'invoice'}-${index}`}>
              <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoiceNumber ?? 'Invoice'}</td>
              <td className="px-4 py-3 text-slate-600">
                {invoice.amount != null ? formatCurrency(invoice.amount, invoice.currency) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">{invoice.status}</td>
              <td className="px-4 py-3 text-slate-600">{invoice.dueAt ? formatAbsolute(invoice.dueAt) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenewalTable({ items }) {
  if (!items?.length) {
    return <EmptyState message="No upcoming renewals across agency partners." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Agency</th>
            <th className="px-4 py-3">Renewal</th>
            <th className="px-4 py-3">Health</th>
            <th className="px-4 py-3">Satisfaction</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.map((item, index) => (
            <tr key={`${item.agencyName}-${index}`}>
              <td className="px-4 py-3 font-medium text-slate-900">{item.agencyName}</td>
              <td className="px-4 py-3 text-slate-600">{item.renewalDate ? formatAbsolute(item.renewalDate) : '—'}</td>
              <td className="px-4 py-3 text-slate-600">{item.healthScore != null ? `${Number(item.healthScore).toFixed(1)}` : '—'}</td>
              <td className="px-4 py-3 text-slate-600">{item.satisfactionScore != null ? `${Number(item.satisfactionScore).toFixed(1)}` : '—'}</td>
              <td className="px-4 py-3 text-slate-600">{item.status?.replace(/_/g, ' ') ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PartnershipsSourcingSection({ data }) {
  const headhunterProgram = data?.headhunterProgram ?? {};
  const talentPools = data?.talentPools ?? {};
  const agency = data?.agencyCollaboration ?? {};

  const headhunterStats = [
    {
      label: 'Invites acceptance',
      value: formatPercent(headhunterProgram.invites?.acceptanceRate),
      helper: `${formatNumber(headhunterProgram.invites?.accepted)} accepted of ${formatNumber(headhunterProgram.invites?.total)}`,
    },
    {
      label: 'Active briefs',
      value: formatNumber(headhunterProgram.briefs?.active),
      helper: `${formatNumber(headhunterProgram.briefs?.total)} total briefs`,
    },
    {
      label: 'Fill rate',
      value: formatPercent(headhunterProgram.assignments?.fillRate),
      helper: `${formatNumber(headhunterProgram.assignments?.placements)} placements`,
    },
    {
      label: 'Outstanding commissions',
      value: formatCurrency(headhunterProgram.commissions?.outstandingAmount, headhunterProgram.commissions?.currency),
      helper: `${formatNumber(headhunterProgram.commissions?.outstandingCount)} payouts pending`,
    },
  ];

  const talentStats = [
    {
      label: 'Talent pools',
      value: formatNumber(talentPools.totals?.pools),
      helper: `${formatNumber(talentPools.totals?.activePools)} active • ${formatNumber(talentPools.totals?.pausedPools)} paused`,
    },
    {
      label: 'Active candidates',
      value: formatNumber(talentPools.totals?.activeCandidates),
      helper: `${formatNumber(talentPools.totals?.totalCandidates)} total in pools`,
    },
    {
      label: 'Hires from pools',
      value: formatNumber(talentPools.totals?.hiresFromPools),
      helper: `${formatPercent(talentPools.pipeline?.conversionRate)} conversion`,
    },
    {
      label: 'Engagements this window',
      value: formatNumber(talentPools.totals?.engagementsInWindow),
      helper: talentPools.totals?.lastEngagedAt
        ? `Last activity ${formatRelativeTime(talentPools.totals.lastEngagedAt)}`
        : 'Log outreach to activate insights',
    },
  ];

  const agencyStats = [
    {
      label: 'Active collaborations',
      value: formatNumber(agency.summary?.active),
      helper: `${formatNumber(agency.summary?.total)} total partners`,
    },
    {
      label: 'Average health',
      value: agency.summary?.averageHealthScore != null ? `${Number(agency.summary.averageHealthScore).toFixed(1)}/5` : '—',
      helper: agency.summary?.averageSatisfactionScore != null
        ? `Satisfaction ${Number(agency.summary.averageSatisfactionScore).toFixed(1)}/5`
        : 'Capture partner feedback to benchmark satisfaction.',
    },
    {
      label: 'Outstanding billing',
      value: formatCurrency(agency.billing?.outstandingAmount, agency.billing?.currency),
      helper: `${formatNumber(agency.billing?.outstandingCount)} invoices open`,
    },
    {
      label: 'Due within 21 days',
      value: formatCurrency(agency.billing?.dueSoon?.amount, agency.billing?.currency),
      helper: `${formatNumber(agency.billing?.dueSoon?.count)} invoices`,
    },
  ];

  return (
    <section id="partnerships-sourcing" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Partnerships &amp; sourcing</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Operational view of external recruiting partners, talent communities, and agency delivery performance.
          </p>
        </div>
      </div>

      <div id="partnerships-headhunter-program" className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Headhunter program</h3>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Briefs &amp; commissions
          </span>
        </div>
        <StatGrid items={headhunterStats} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active briefs</h4>
            <BriefPipelineTable items={headhunterProgram.briefs?.pipeline} />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Partner leaderboard</h4>
            <LeaderboardTable items={headhunterProgram.performance?.leaderboard} />
          </div>
        </div>
      </div>

      <div id="partnerships-talent-pools" className="mt-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Talent pools</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Silver medalists &amp; alumni
          </span>
        </div>
        <StatGrid items={talentStats} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pool composition</h4>
            <TalentPoolBreakdownTable items={talentPools.byType} />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming actions</h4>
            <UpcomingList
              items={talentPools.upcomingActions}
              emptyMessage="No upcoming follow-ups scheduled across talent pools."
            />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent engagements</h4>
          <RecentEngagementsList items={talentPools.recentEngagements} />
        </div>
      </div>

      <div id="partnerships-agency-collaboration" className="mt-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Agency collaboration</h3>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            SLAs &amp; billing
          </span>
        </div>
        <StatGrid items={agencyStats} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Renewal radar</h4>
            <RenewalTable items={agency.renewals} />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming invoices</h4>
            <BillingTable billing={agency.billing} />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">SLA highlights</h4>
            {agency.sla?.partners?.length ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Collaboration</th>
                      <th className="px-4 py-3">On-time</th>
                      <th className="px-4 py-3">Response</th>
                      <th className="px-4 py-3">Breaches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {agency.sla.partners.map((partner, index) => (
                      <tr key={`${partner.collaborationId ?? index}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">Partner #{partner.collaborationId ?? index + 1}</td>
                        <td className="px-4 py-3 text-slate-600">{formatPercent(partner.onTimeDeliveryRate)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {partner.responseTimeHours != null ? `${Number(partner.responseTimeHours).toFixed(1)} hrs` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatNumber(partner.breachCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Awaiting SLA snapshots from partner agencies." />
            )}
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rate card updates</h4>
            {agency.rateCards?.newest?.length ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Effective</th>
                      <th className="px-4 py-3">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {agency.rateCards.newest.map((card) => (
                      <tr key={card.title}>
                        <td className="px-4 py-3 font-medium text-slate-900">{card.title}</td>
                        <td className="px-4 py-3 text-slate-600">{card.status}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {card.effectiveFrom ? `${formatAbsolute(card.effectiveFrom)}` : 'Draft'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatNumber(card.itemCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No shared rate cards from agency partners." />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

PartnershipsSourcingSection.propTypes = {
  data: PropTypes.shape({
    headhunterProgram: PropTypes.object,
    talentPools: PropTypes.object,
    agencyCollaboration: PropTypes.object,
  }),
};

PartnershipsSourcingSection.defaultProps = {
  data: undefined,
};
