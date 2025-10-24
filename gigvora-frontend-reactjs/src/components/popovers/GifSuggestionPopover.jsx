import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { GIF_LIBRARY } from '../../constants/feedMeta.js';

export default function GifSuggestionPopover({
  open,
  onSelect,
  onClose,
  labelledBy,
  gifs = GIF_LIBRARY,
  className = '',
  title = 'Trending GIFs',
  description = 'Curated for enterprise-safe celebrations, launches, and collaboration moments.',
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelledBy}
      className={`absolute z-30 mt-2 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-xl ${className}`.trim()}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 transition hover:text-accent"
        >
          Close
        </button>
      </div>
      {description ? <p className="mt-2 text-[0.65rem] text-slate-500">{description}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {gifs.map((gif) => (
          <button
            key={gif.id ?? gif.url}
            type="button"
            onClick={() => {
              onSelect?.(gif);
              onClose?.();
            }}
            className="overflow-hidden rounded-2xl border border-slate-200 text-left transition hover:border-accent"
          >
            <img src={gif.url} alt={gif.label} className="h-32 w-full object-cover" loading="lazy" />
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-slate-800">{gif.label}</p>
              {gif.tone ? (
                <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">{gif.tone}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

GifSuggestionPopover.propTypes = {
  open: PropTypes.bool,
  onSelect: PropTypes.func,
  onClose: PropTypes.func,
  labelledBy: PropTypes.string,
  gifs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      url: PropTypes.string,
      tone: PropTypes.string,
    }),
  ),
  className: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
};

GifSuggestionPopover.defaultProps = {
  open: false,
  onSelect: undefined,
  onClose: undefined,
  labelledBy: undefined,
  gifs: GIF_LIBRARY,
  className: '',
  title: 'Trending GIFs',
  description: 'Curated for enterprise-safe celebrations, launches, and collaboration moments.',
};
