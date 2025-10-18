import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AdjustmentsHorizontalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function normaliseKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return [];
  }
  return keywords
    .map((item) => {
      if (!item) return null;
      const keyword = `${item.keyword ?? item}`.trim();
      if (!keyword) return null;
      const count = Number(item.count ?? 1);
      return { keyword, count: Number.isFinite(count) ? count : 1 };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword));
}

export default function TopSearchKeywords({ keywords, onSelectionChange }) {
  const list = useMemo(() => normaliseKeywords(keywords), [keywords]);
  const [selected, setSelected] = useState(() => new Set());

  const handleToggle = (item) => {
    const next = new Set(selected);
    if (next.has(item.keyword)) {
      next.delete(item.keyword);
    } else {
      next.add(item.keyword);
    }
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const handleReset = () => {
    if (!selected.size) return;
    const cleared = new Set();
    setSelected(cleared);
    onSelectionChange?.([]);
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-900">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Keywords</h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-accent/60 hover:text-accent"
        >
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {list.length ? (
          list.map((item) => {
            const active = selected.has(item.keyword);
            return (
              <button
                type="button"
                key={item.keyword}
                onClick={() => handleToggle(item)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active
                    ? 'border-accent bg-accent text-white shadow'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-accent/60 hover:text-accent'
                }`}
              >
                <span>#{item.keyword}</span>
                <span className="text-xs text-slate-400">×{item.count}</span>
              </button>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No keywords yet.
          </p>
        )}
      </div>
    </div>
  );
}

TopSearchKeywords.propTypes = {
  keywords: PropTypes.arrayOf(
    PropTypes.shape({
      keyword: PropTypes.string,
      count: PropTypes.number,
    }),
  ),
  onSelectionChange: PropTypes.func,
};

TopSearchKeywords.defaultProps = {
  keywords: [],
  onSelectionChange: null,
};
