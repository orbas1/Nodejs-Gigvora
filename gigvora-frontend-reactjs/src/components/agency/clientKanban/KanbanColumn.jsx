import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import CardTile from './CardTile.jsx';
import { classNames } from './utils.js';

export default function KanbanColumn({
  column,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
  onOpenCard,
  onEditCard,
  onDeleteCard,
  onDragStart,
  onDragEnd,
  onCardDrop,
}) {
  const accentStyle = column.color ? { boxShadow: `inset 0 4px 0 ${column.color}` } : undefined;
  const wipLimit =
    column.wipLimit !== undefined && column.wipLimit !== null && column.wipLimit !== ''
      ? Number(column.wipLimit)
      : null;

  return (
    <section
      role="region"
      aria-label={`${column.name} column`}
      data-testid={`kanban-column-${column.id}`}
      className="flex h-full w-80 flex-col rounded-4xl border border-slate-200 bg-slate-50/70"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => onCardDrop?.(event, column)}
    >
      <header className="flex items-center justify-between gap-2 rounded-4xl px-4 py-3" style={accentStyle}>
        <div className="flex flex-col">
          <span className={classNames('inline-flex items-center gap-2 text-sm font-semibold text-slate-900')}>
            {column.name}
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {column.cards?.length ?? 0}
            </span>
          </span>
          {Number.isFinite(wipLimit) ? (
            <span className="text-[11px] font-medium text-slate-500">Limit {wipLimit}</span>
          ) : null}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onAddCard?.(column)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-accent hover:text-accent"
            aria-label="Add card"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEditColumn?.(column)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-accent hover:text-accent"
            aria-label="Edit column"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteColumn?.(column)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
            aria-label="Remove column"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {column.cards?.length ? (
          column.cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              onOpen={onOpenCard}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white/60 text-center text-xs text-slate-400">
            <p>No cards yet</p>
            <button
              type="button"
              onClick={() => onAddCard?.(column)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              <PlusIcon className="h-4 w-4" />
              New
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

KanbanColumn.propTypes = {
  column: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string,
    wipLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cards: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  onAddCard: PropTypes.func,
  onEditColumn: PropTypes.func,
  onDeleteColumn: PropTypes.func,
  onOpenCard: PropTypes.func,
  onEditCard: PropTypes.func,
  onDeleteCard: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onCardDrop: PropTypes.func,
};
