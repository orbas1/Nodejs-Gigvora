import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

function AnalyticsCard({ label, value, helper, delta }) {
  const deltaLabel = delta === null || delta === undefined ? '—' : `${delta > 0 ? '+' : ''}${delta}%`;
  const deltaTone = delta === null || delta === undefined ? 'text-slate-500' : delta >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>
      <div className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${deltaTone}`}>
        <ArrowTrendingUpIcon className="h-4 w-4" />
        <span>{deltaLabel}</span>
      </div>
    </div>
  );
}

AnalyticsCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.string,
  delta: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

AnalyticsCard.defaultProps = {
  helper: '',
  delta: null,
};

function RecommendationCard({ title, body, targetSection, onNavigate }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 p-6 text-white shadow-md">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 h-5 w-5 text-emerald-300" />
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">AI recommendation</h4>
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="text-sm text-emerald-100">{body}</p>
          <button
            type="button"
            onClick={() => onNavigate?.(targetSection)}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Jump to workspace
            <ChartBarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

RecommendationCard.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  targetSection: PropTypes.string,
  onNavigate: PropTypes.func,
};

RecommendationCard.defaultProps = {
  targetSection: undefined,
  onNavigate: undefined,
};

export default function MentorCommandCenterInsights({
  analyticsCards,
  aiRecommendations,
  loading,
  onRefresh,
  onNavigate,
  narrative,
}) {
  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Insights</p>
          <h2 className="text-xl font-semibold text-slate-900">Mentor command centre intelligence</h2>
          {narrative ? <p className="text-sm text-slate-600">{narrative}</p> : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh analytics
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {(analyticsCards ?? []).map((card) => (
          <AnalyticsCard key={card.id} label={card.label} value={card.value} helper={card.helper} delta={card.delta} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(aiRecommendations ?? []).map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            title={recommendation.title}
            body={recommendation.body}
            targetSection={recommendation.targetSection}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

MentorCommandCenterInsights.propTypes = {
  analyticsCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      helper: PropTypes.string,
      delta: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
  aiRecommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      body: PropTypes.string.isRequired,
      targetSection: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onNavigate: PropTypes.func,
  narrative: PropTypes.string,
};

MentorCommandCenterInsights.defaultProps = {
  analyticsCards: [],
  aiRecommendations: [],
  loading: false,
  onRefresh: undefined,
  onNavigate: undefined,
  narrative: undefined,
};
