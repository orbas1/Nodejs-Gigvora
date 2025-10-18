import { BriefcaseIcon, UsersIcon, ClockIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const CARD_CONFIG = [
  {
    key: 'posts',
    label: 'Posts open',
    icon: BriefcaseIcon,
    getValue: (summary) => summary?.posts?.open ?? 0,
    helper: (summary) => `${summary?.posts?.total ?? 0} total`,
  },
  {
    key: 'applications',
    label: 'Applications',
    icon: UsersIcon,
    getValue: (summary) => summary?.applications?.newInPeriod ?? 0,
    helper: (summary) => `${summary?.applications?.total ?? 0} in funnel`,
  },
  {
    key: 'interviews',
    label: 'Interviews',
    icon: ClockIcon,
    getValue: (summary) => summary?.interviews?.upcoming ?? 0,
    helper: (summary) => `${summary?.interviews?.completed ?? 0} completed`,
  },
  {
    key: 'contracts',
    label: 'Contracts',
    icon: ClipboardDocumentListIcon,
    getValue: (summary) => summary?.contracts?.active ?? 0,
    helper: (summary) => `${summary?.contracts?.total ?? 0} on file`,
  },
  {
    key: 'spend',
    label: 'Spend',
    icon: CurrencyDollarIcon,
    getValue: (summary, totals) => {
      const amount = totals?.spend ?? summary?.spend?.total ?? 0;
      if (!amount) {
        return '$0';
      }
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(amount));
    },
    helper: (summary) => {
      const byCurrency = summary?.spend?.byCurrency ?? {};
      const entries = Object.entries(byCurrency);
      if (!entries.length) {
        return 'No expenses recorded';
      }
      return entries
        .map(([currency, value]) =>
          `${currency.toUpperCase()} ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        )
        .join(' · ');
    },
  },
];

export default function VolunteeringSummaryCards({ summary, totals }) {
  const cards = CARD_CONFIG.map((config) => {
    const value = config.getValue(summary, totals);
    return {
      key: config.key,
      label: config.label,
      helper: typeof config.helper === 'function' ? config.helper(summary, totals) : config.helper,
      value,
      icon: config.icon,
    };
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Volunteer snapshot</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Live
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
                </div>
                <span className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
