import PropTypes from 'prop-types';

function formatCurrency(amount, currency) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));
  } catch (error) {
    return `${currency ?? 'USD'} ${Number(amount ?? 0).toFixed(2)}`;
  }
}

function formatRate(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(2)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return 'Scheduled by policy';
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatRecurrence(recurrence) {
  if (!recurrence) {
    return 'Continuous earnings on every conversion';
  }
  if (recurrence.type === 'one_time') {
    return 'Single commission per referred customer';
  }
  if (recurrence.type === 'finite') {
    if (recurrence.limit != null) {
      return `Commission applies to the first ${recurrence.limit} transactions per referral`;
    }
    return 'Finite recurrence configured';
  }
  return 'Ongoing earnings on every eligible transaction';
}

function Chip({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

Chip.propTypes = {
  label: PropTypes.string.isRequired,
};

function SummaryCard({ title, value, caption, emphasis }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-slate-900/10 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-200/80">{title}</p>
        <p className={`mt-2 text-2xl font-semibold ${emphasis ? 'text-white' : 'text-slate-100'}`}>{value}</p>
      </div>
      {caption ? <p className="mt-4 text-xs text-slate-200/70">{caption}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  caption: PropTypes.string,
  emphasis: PropTypes.bool,
};

SummaryCard.defaultProps = {
  caption: undefined,
  emphasis: false,
};

export default function AffiliateProgramSection({ data }) {
  const overview = data?.overview ?? {};
  const payoutSchedule = data?.payoutSchedule ?? {};
  const tiers = Array.isArray(data?.tiers) ? data.tiers : [];
  const links = Array.isArray(data?.links) ? data.links : [];
  const referrals = Array.isArray(data?.referrals) ? data.referrals : [];
  const insights = data?.insights ?? {};
  const security = data?.security ?? {};
  const settings = data?.settings ?? {};
  const currency = overview.currency ?? settings.currency ?? 'USD';

  const summaryCards = [
    {
      title: 'Lifetime earnings',
      value: formatCurrency(overview.lifetimeEarnings ?? 0, currency),
      caption: 'Commission captured from verified referrals.',
      emphasis: true,
    },
    {
      title: 'Pending payouts',
      value: formatCurrency(overview.pendingPayouts ?? 0, currency),
      caption: `Threshold ${formatCurrency(payoutSchedule.minimumThreshold ?? 0, currency)} • Next ${formatDateTime(
        payoutSchedule.nextPayoutAt,
      )}`,
    },
    {
      title: 'Conversion rate',
      value: `${Number(overview.conversionRate ?? 0).toFixed(1)}%`,
      caption: `${overview.lifetimeConversions ?? 0} conversions • ${overview.lifetimeClicks ?? 0} clicks`,
    },
    {
      title: 'Policy',
      value: settings.enabled ? 'Program active' : 'Program paused',
      caption: formatRecurrence(payoutSchedule.recurrence),
    },
  ];

  const topPerformer = insights.topPerformer;
  const diversification = insights.diversificationScore ?? 'focused';

  return (
    <div className="space-y-6" id="affiliate-program">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-4 lg:p-8">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Chip label="Affiliate ecosystem" />
              <Chip label={`Referral window ${settings.referralWindowDays ?? overview.referralWindowDays ?? 90} days`} />
              {security.twoFactorRequired ? <Chip label="2FA enforced" /> : null}
              {security.kycRequired ? <Chip label="KYC required" /> : null}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white md:text-3xl">Grow with partner-led revenue</h3>
            <p className="mt-3 max-w-2xl text-sm text-slate-200/80">
              Share bespoke referral links, monitor multi-tier commissions, and orchestrate payouts with enterprise grade
              guardrails. Every invite honours your security posture across web and mobile.
            </p>
            {topPerformer ? (
              <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-200/70">Top performer</p>
                  <p className="mt-1 font-semibold">{topPerformer.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-200/70">Commission</p>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(topPerformer.commission ?? 0, currency)} • {topPerformer.conversions ?? 0} conversions
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            {summaryCards.map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Commission tiers</h4>
              <p className="text-sm text-slate-600">Automatic tiering by transaction value with clear guardrails.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Diversification {diversification}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {tiers.length ? (
              tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tier.name}</p>
                    <p className="text-xs text-slate-500">
                      {tier.minValue != null ? formatCurrency(tier.minValue, currency) : 'All values'}
                      {tier.maxValue != null ? ` – ${formatCurrency(tier.maxValue, currency)}` : ' +' }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Commission rate</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatRate(tier.rate)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-500">
                Define tiers in the admin console to unlock tier-based commission modelling.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Payout operations</h4>
          <p className="mt-1 text-sm text-slate-600">
            Enterprise payout cadence with compliance-ready triggers and oversight.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Next release</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(payoutSchedule.nextPayoutAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Minimum threshold</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {formatCurrency(payoutSchedule.minimumThreshold ?? 0, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Auto approvals</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {payoutSchedule.autoApprove ? 'Enabled for verified partners' : 'Manual finance review required'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Recurrence</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{formatRecurrence(payoutSchedule.recurrence)}</dd>
            </div>
          </dl>
          {security.requiredDocuments?.length ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Compliance requirements</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {security.requiredDocuments.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Live referral performance</h4>
            <p className="text-sm text-slate-600">
              Monitor each affiliate link for click-through, conversion quality, and last touch attribution.
            </p>
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {links.length} active links • {referrals.length} tracked referrals
          </span>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-12 gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span className="col-span-3">Link</span>
            <span className="col-span-2 text-right">Commission</span>
            <span className="col-span-2 text-right">Revenue</span>
            <span className="col-span-2 text-right">Conversions</span>
            <span className="col-span-3">Recent referral</span>
          </div>
          <div className="divide-y divide-slate-200">
            {links.length ? (
              links.map((link) => (
                <div key={link.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm text-slate-700 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-3">
                    <p className="font-semibold text-slate-900">{link.label}</p>
                    <p className="text-xs text-slate-500">{link.code}</p>
                  </div>
                  <div className="flex justify-between sm:col-span-2 sm:block sm:text-right">
                    <span className="sm:hidden text-xs uppercase tracking-wide text-slate-500">Commission</span>
                    <span className="font-semibold">{formatCurrency(link.estimatedCommission ?? 0, link.currency)}</span>
                  </div>
                  <div className="flex justify-between sm:col-span-2 sm:block sm:text-right">
                    <span className="sm:hidden text-xs uppercase tracking-wide text-slate-500">Revenue</span>
                    <span className="font-semibold">{formatCurrency(link.totalRevenue ?? 0, link.currency)}</span>
                  </div>
                  <div className="flex justify-between sm:col-span-2 sm:block sm:text-right">
                    <span className="sm:hidden text-xs uppercase tracking-wide text-slate-500">Conversions</span>
                    <span className="font-semibold">{link.totalConversions ?? 0}</span>
                  </div>
                  <div className="sm:col-span-3">
                    {link.topReferral ? (
                      <div>
                        <p className="font-semibold text-slate-900">{link.topReferral.name}</p>
                        <p className="text-xs text-slate-500">{link.topReferral.source} • {formatCurrency(link.topReferral.amount, link.currency)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No referral recorded yet.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-sm text-slate-500">Create your first affiliate link to populate performance data.</p>
            )}
          </div>
        </div>

        {referrals.length ? (
          <div className="mt-6 space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Latest referral activity</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {referrals.slice(0, 6).map((referral) => (
                <div key={referral.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{referral.name}</p>
                  <p className="text-xs text-slate-500">{referral.status}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(referral.occurredAt)}</p>
                  <p className="mt-2 font-semibold text-slate-900">{formatCurrency(referral.amount ?? 0, referral.currency ?? currency)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

AffiliateProgramSection.propTypes = {
  data: PropTypes.shape({
    overview: PropTypes.object,
    payoutSchedule: PropTypes.object,
    tiers: PropTypes.array,
    links: PropTypes.array,
    referrals: PropTypes.array,
    insights: PropTypes.object,
    security: PropTypes.object,
    settings: PropTypes.object,
  }),
};

AffiliateProgramSection.defaultProps = {
  data: null,
};
