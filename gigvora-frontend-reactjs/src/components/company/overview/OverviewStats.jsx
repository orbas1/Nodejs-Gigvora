export default function OverviewStats({ cards, onSelect }) {
  if (!cards?.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onSelect?.(card)}
          className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-lg transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
          </div>
          {card.subLabel ? (
            <p className="mt-3 text-xs font-medium text-slate-500">{card.subLabel}</p>
          ) : null}
        </button>
      ))}
    </div>
  );
}
