import PropTypes from 'prop-types';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  TagIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { HEALTH_TONES, PRIORITY_TONES, RISK_TONES, classNames, formatCurrency, formatDate } from './utils.js';

function Badge({ tone, label }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize',
        tone,
      )}
    >
      {label}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default function CardTile({ card, onOpen, onEdit, onDelete, onDragStart, onDragEnd }) {
  return (
    <article
      draggable
      onDragStart={(event) => onDragStart?.(event, card)}
      onDragEnd={() => onDragEnd?.(card)}
      className="group flex cursor-grab flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={() => onOpen?.(card)}
            className="text-left text-sm font-semibold text-slate-900 transition hover:text-accent"
          >
            {card.title}
          </button>
          <p className="text-xs text-slate-500">{card.client?.name ?? 'Unassigned client'}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(card)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent hover:text-accent group-hover:flex"
            aria-label="Edit engagement"
          >
            <UserCircleIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(card)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:text-rose-600 group-hover:flex"
            aria-label="Remove engagement"
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge tone={PRIORITY_TONES[card.priority] ?? PRIORITY_TONES.medium} label={card.priority ?? 'medium'} />
        <Badge tone={RISK_TONES[card.riskLevel] ?? RISK_TONES.low} label={card.riskLevel ?? 'low'} />
        <Badge tone={HEALTH_TONES[card.healthStatus] ?? HEALTH_TONES.healthy} label={card.healthStatus ?? 'healthy'} />
      </div>

      <dl className="grid gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <dt className="sr-only">Value</dt>
          <dd className="font-semibold text-slate-700">{formatCurrency(card.valueAmount, card.valueCurrency)}</dd>
        </div>
        {card.dueDate ? (
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <dt className="sr-only">Due</dt>
            <dd className="text-slate-600">Due {formatDate(card.dueDate)}</dd>
          </div>
        ) : null}
        {card.tags?.length ? (
          <div className="flex items-center gap-2 text-slate-600">
            <TagIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <dt className="sr-only">Tags</dt>
            <dd className="truncate">{card.tags.join(', ')}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

CardTile.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    client: PropTypes.object,
    clientId: PropTypes.number,
    priority: PropTypes.string,
    riskLevel: PropTypes.string,
    healthStatus: PropTypes.string,
    valueAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    valueCurrency: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onOpen: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
};
