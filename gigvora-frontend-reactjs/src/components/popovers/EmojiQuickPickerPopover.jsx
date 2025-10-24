import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { QUICK_EMOJIS } from '../../constants/feedMeta.js';

export default function EmojiQuickPickerPopover({
  open,
  onSelect,
  onClose,
  labelledBy,
  emojis = QUICK_EMOJIS,
  className = '',
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
      className={`absolute z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ${className}`.trim()}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Quick emoji</p>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect?.(emoji);
              onClose?.();
            }}
            className="flex items-center justify-center rounded-full bg-slate-50 p-2 text-xl transition hover:bg-accentSoft"
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="sr-only">Insert emoji {emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

EmojiQuickPickerPopover.propTypes = {
  open: PropTypes.bool,
  onSelect: PropTypes.func,
  onClose: PropTypes.func,
  labelledBy: PropTypes.string,
  emojis: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

EmojiQuickPickerPopover.defaultProps = {
  open: false,
  onSelect: undefined,
  onClose: undefined,
  labelledBy: undefined,
  emojis: QUICK_EMOJIS,
  className: '',
};
