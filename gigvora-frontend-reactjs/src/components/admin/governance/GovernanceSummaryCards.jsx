import PropTypes from 'prop-types';
import {
  BoltIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const TONE_CLASSES = {
  sky: 'from-sky-500/10 to-sky-500/0 text-sky-900 border-sky-200',
  emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-900 border-emerald-200',
  amber: 'from-amber-500/10 to-amber-500/0 text-amber-900 border-amber-200',
  violet: 'from-violet-500/10 to-violet-500/0 text-violet-900 border-violet-200',
};

function SummaryCard({ icon: Icon, title, value, description, tone }) {
  return (
    <div
      className={`flex items-center justify-between rounded-3xl border bg-gradient-to-br px-6 py-5 shadow-sm ${
        TONE_CLASSES[tone] ?? TONE_CLASSES.sky
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner shadow-slate-100">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  description: PropTypes.string,
  tone: PropTypes.oneOf(['sky', 'emerald', 'amber', 'violet']).isRequired,
};

SummaryCard.defaultProps = {
  description: '',
};

export default function GovernanceSummaryCards({ contentSummary, policyTotals, versionTotals, upcomingCount, lookbackDays }) {
  const cards = [
    {
      id: 'queue-total',
      title: 'Items awaiting moderation',
      value: contentSummary?.total ?? 0,
      description: 'Across all governance queues',
      icon: SparklesIcon,
      tone: 'violet',
    },
    {
      id: 'queue-urgent',
      title: 'Urgent investigations',
      value: contentSummary?.urgent ?? 0,
      description: 'Flagged as urgent priority',
      icon: BoltIcon,
      tone: 'amber',
    },
    {
      id: 'policies-active',
      title: 'Active policies',
      value: policyTotals?.activeDocuments ?? 0,
      description: 'Live across regions',
      icon: ShieldCheckIcon,
      tone: 'emerald',
    },
    {
      id: 'policies-review',
      title: 'Policies in review',
      value: versionTotals?.inReview ?? 0,
      description: 'Awaiting legal approvals',
      icon: ClipboardDocumentCheckIcon,
      tone: 'sky',
    },
    {
      id: 'upcoming-effective',
      title: 'Upcoming effective',
      value: upcomingCount ?? 0,
      description: `Within the next ${lookbackDays} days`,
      icon: CalendarDaysIcon,
      tone: 'sky',
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-5 md:grid-cols-3">
      {cards.map((card) => (
        <SummaryCard key={card.id} {...card} />
      ))}
    </div>
  );
}

GovernanceSummaryCards.propTypes = {
  contentSummary: PropTypes.shape({
    total: PropTypes.number,
    awaitingReview: PropTypes.number,
    highSeverity: PropTypes.number,
    urgent: PropTypes.number,
  }),
  policyTotals: PropTypes.shape({
    totalDocuments: PropTypes.number,
    activeDocuments: PropTypes.number,
    draftDocuments: PropTypes.number,
    archivedDocuments: PropTypes.number,
  }),
  versionTotals: PropTypes.shape({
    drafts: PropTypes.number,
    inReview: PropTypes.number,
    approved: PropTypes.number,
    published: PropTypes.number,
    archived: PropTypes.number,
  }),
  upcomingCount: PropTypes.number,
  lookbackDays: PropTypes.number,
};

GovernanceSummaryCards.defaultProps = {
  contentSummary: undefined,
  policyTotals: undefined,
  versionTotals: undefined,
  upcomingCount: 0,
  lookbackDays: 30,
};
