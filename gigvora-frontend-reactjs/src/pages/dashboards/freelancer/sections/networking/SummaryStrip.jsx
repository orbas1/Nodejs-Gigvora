import PropTypes from 'prop-types';

function formatValue(value) {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat().format(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{formatValue(value)}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function SummaryStrip({ cards }) {
  if (!Array.isArray(cards) || !cards.length) {
    return null;
  }

  const normalizedCards = cards
    .filter((card) => card && card.label)
    .map((card) => ({
      ...card,
      hint: card.hint ?? null,
    }));

  if (!normalizedCards.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {normalizedCards.map((card, index) => (
        <SummaryCard key={card.label ?? index} {...card} />
      ))}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node, PropTypes.instanceOf(Date)]),
  hint: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

SummaryCard.defaultProps = {
  value: '—',
  hint: null,
};

SummaryStrip.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node, PropTypes.instanceOf(Date)]),
      hint: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    }),
  ),
};

SummaryStrip.defaultProps = {
  cards: [],
};
