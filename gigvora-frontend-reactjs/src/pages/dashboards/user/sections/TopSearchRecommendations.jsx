import PropTypes from 'prop-types';
import { LightBulbIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';

function InsightCard({ icon: Icon, title, items, emptyLabel }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-slate-900">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accentSoft text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {items.length ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id ?? item.label}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <span className="font-semibold text-slate-900">{item.label}</span>
              <span className="text-xs text-slate-500">{item.total}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-500">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}

InsightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
  emptyLabel: PropTypes.string,
};

InsightCard.defaultProps = {
  items: [],
  emptyLabel: 'No data.',
};

export default function TopSearchRecommendations({ recommendations }) {
  const categoryHighlights = recommendations?.categoryHighlights ?? [];
  const locationHighlights = recommendations?.locationHighlights ?? [];
  const gigHighlights = recommendations?.gigHighlights ?? [];

  return (
    <div className="space-y-4">
      <InsightCard
        title="Categories"
        icon={LightBulbIcon}
        items={categoryHighlights.map((item) => ({
          id: item.id,
          label: item.label,
          total: item.totalRoles ?? 0,
        }))}
      />
      <InsightCard
        title="Locations"
        icon={MapPinIcon}
        items={locationHighlights.map((item) => ({
          id: item.location,
          label: item.location,
          total: item.totalRoles ?? 0,
        }))}
      />
      <InsightCard
        title="Gigs"
        icon={SparklesIcon}
        items={gigHighlights.map((item) => ({
          id: item.id,
          label: item.label,
          total: item.totalListings ?? 0,
        }))}
      />
    </div>
  );
}

TopSearchRecommendations.propTypes = {
  recommendations: PropTypes.shape({
    categoryHighlights: PropTypes.arrayOf(PropTypes.object),
    locationHighlights: PropTypes.arrayOf(PropTypes.object),
    gigHighlights: PropTypes.arrayOf(PropTypes.object),
  }),
};

TopSearchRecommendations.defaultProps = {
  recommendations: null,
};
