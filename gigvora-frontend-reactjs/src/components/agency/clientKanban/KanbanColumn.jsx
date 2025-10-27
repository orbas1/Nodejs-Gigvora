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
  highlightClientId,
  focusClientName,
  focusMode,
}) {
  const accentStyle = column.color ? { boxShadow: `inset 0 4px 0 ${column.color}` } : undefined;
  const wipLimit =
    column.wipLimit !== undefined && column.wipLimit !== null && column.wipLimit !== ''
      ? Number(column.wipLimit)
      : null;
  const totalCards = column.originalCardCount ?? column.cards?.length ?? 0;
  const visibleCards = column.cards?.length ?? 0;
  const focusActive = focusMode && highlightClientId != null;
  const cardCountLabel = focusActive && totalCards !== visibleCards ? `${visibleCards}/${totalCards}` : visibleCards;
  const wipExceeded = Number.isFinite(wipLimit) && totalCards > wipLimit;
  const limitClass = classNames('text-[11px] font-medium', wipExceeded ? 'text-rose-600' : 'text-slate-500');
  const emptyMessage = focusActive && totalCards > 0 && focusClientName
    ? `No work for ${focusClientName} in this stage.`
    : 'No cards yet';
  const highlightValue = highlightClientId != null ? String(highlightClientId) : null;
  const capacityPercent = Number.isFinite(wipLimit) && wipLimit > 0 ? Math.min(100, Math.round((totalCards / wipLimit) * 100)) : null;

  return (
    <section
      role="region"
      aria-label={`${column.name} column`}
      data-testid={`kanban-column-${column.id}`}
      className={classNames(
        'flex h-full w-80 flex-col rounded-4xl border border-slate-200 bg-slate-50/70',
        focusActive ? 'ring-2 ring-accent/10' : '',
      )}
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
              {cardCountLabel}
            </span>
          </span>
          {Number.isFinite(wipLimit) ? (
            <span className={limitClass}>
              Limit {wipLimit}
              {wipExceeded ? ' · Over capacity' : ''}
            </span>
          ) : null}
          {focusActive && visibleCards !== totalCards ? (
            <span className="text-[11px] font-medium text-accent">
              Showing {visibleCards} of {totalCards} for {focusClientName}
            </span>
          ) : null}
          {column.lastActivityLabel ? (
            <span className="text-[11px] text-slate-400">Active {column.lastActivityLabel}</span>
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

      {Number.isFinite(wipLimit) ? (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-500">Capacity</span>
            <span className={wipExceeded ? 'text-rose-600' : 'text-slate-600'}>
              {capacityPercent != null ? `${capacityPercent}%` : '—'}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-200">
            <div
              className={classNames('h-full rounded-full transition-all', wipExceeded ? 'bg-rose-500' : 'bg-accent')}
              style={{ width: `${capacityPercent != null ? capacityPercent : 0}%` }}
            />
          </div>
        </div>
      ) : null}

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
              highlighted={
                highlightValue &&
                (card.clientId != null
                  ? String(card.clientId) === highlightValue
                  : card.client?.id != null && String(card.client.id) === highlightValue)
              }
            />
          ))
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white/60 text-center text-xs text-slate-400">
            <p className="px-6">{emptyMessage}</p>
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
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string,
    wipLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cards: PropTypes.arrayOf(PropTypes.object),
    originalCardCount: PropTypes.number,
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
  highlightClientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  focusClientName: PropTypes.string,
  focusMode: PropTypes.bool,
};
