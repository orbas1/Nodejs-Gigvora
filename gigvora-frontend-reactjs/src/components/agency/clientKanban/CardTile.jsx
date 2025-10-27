import PropTypes from 'prop-types';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HEALTH_TONES,
  PRIORITY_TONES,
  RISK_TONES,
  classNames,
  formatCurrency,
  formatDate,
  formatRelative,
  buildCollaboratorAvatar,
} from './utils.js';

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

function resolveDueMeta(dueDate) {
  if (!dueDate) {
    return null;
  }
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const diffDays = Math.round((normalized.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) {
    return {
      tone: 'border-rose-200 bg-rose-100/80 text-rose-600',
      label: `Overdue ${formatRelative(normalized)}`,
    };
  }
  if (diffDays <= 3) {
    return {
      tone: 'border-amber-200 bg-amber-100/80 text-amber-700',
      label: `Due ${formatRelative(normalized)}`,
    };
  }
  return {
    tone: 'border-slate-200 bg-slate-100/80 text-slate-600',
    label: `Due ${formatDate(normalized)}`,
  };
}

function resolveChecklistProgress(card) {
  const summary = card?.checklistSummary;
  if (summary && Number.isFinite(summary.total) && summary.total > 0) {
    const completed = Math.max(0, Number(summary.completed ?? 0));
    const total = Math.max(0, Number(summary.total));
    return {
      completed,
      total,
      percent: Math.min(100, Math.round((completed / total) * 100)),
    };
  }
  if (Array.isArray(card?.checklist) && card.checklist.length > 0) {
    const total = card.checklist.length;
    const completed = card.checklist.filter((item) => item.completed).length;
    return {
      completed,
      total,
      percent: Math.min(100, Math.round((completed / total) * 100)),
    };
  }
  return null;
}

function resolveActivityLabel(card) {
  const timestamp = card?.lastActivityAt ?? card?.updatedAt ?? card?.createdAt ?? null;
  if (!timestamp) {
    return null;
  }
  return formatRelative(timestamp);
}

export default function CardTile({
  card,
  onOpen,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  highlighted,
}) {
  const collaborators = Array.isArray(card?.collaborators) ? card.collaborators : [];
  const collaboratorAvatars = collaborators.length
    ? collaborators.map((collaborator, index) => buildCollaboratorAvatar(collaborator, `${card.id}-${index}`))
    : [];

  if (!collaboratorAvatars.length && (card?.ownerName || card?.ownerEmail)) {
    collaboratorAvatars.push(
      buildCollaboratorAvatar(
        {
          id: card.ownerId ?? `${card.id}-owner`,
          name: card.ownerName ?? card.ownerEmail,
          email: card.ownerEmail,
          role: card.ownerRole ?? 'Owner',
        },
        `${card.id}-owner`,
      ),
    );
  }

  const dueMeta = resolveDueMeta(card?.dueDate);
  const checklistProgress = resolveChecklistProgress(card);
  const lastActivityLabel = resolveActivityLabel(card);

  return (
    <article
      draggable
      onDragStart={(event) => onDragStart?.(event, card)}
      onDragEnd={() => onDragEnd?.(card)}
      className={classNames(
        'group flex cursor-grab flex-col gap-3 rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent',
        highlighted ? 'border-accent ring-2 ring-accent/20' : 'border-slate-200',
      )}
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
        {card.ownerName || card.ownerEmail ? (
          <div className="flex items-center gap-2 text-slate-600">
            <UserIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <dt className="sr-only">Owner</dt>
            <dd className="truncate font-medium text-slate-600">
              {card.ownerName ?? card.ownerEmail}
              {card.ownerRole ? <span className="ml-1 text-xs text-slate-400">· {card.ownerRole}</span> : null}
            </dd>
          </div>
        ) : null}
        {dueMeta ? (
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <dt className="sr-only">Due</dt>
            <dd>
              <span
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                  dueMeta.tone,
                )}
              >
                <ClockIcon className="h-3.5 w-3.5" />
                {dueMeta.label}
              </span>
            </dd>
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

      {checklistProgress ? (
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Progress</span>
            <span>
              {checklistProgress.completed}/{checklistProgress.total}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${checklistProgress.percent}%` }} />
          </div>
        </div>
      ) : null}

      {collaboratorAvatars.length ? (
        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wide text-slate-400">Crew</span>
            <div className="flex -space-x-2">
              {collaboratorAvatars.slice(0, 4).map((avatar) =>
                avatar.imageUrl ? (
                  <img
                    key={avatar.key}
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    title={avatar.name}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <span
                    key={avatar.key}
                    title={avatar.role ? `${avatar.name} · ${avatar.role}` : avatar.name}
                    className={classNames(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold uppercase',
                      avatar.tone,
                    )}
                  >
                    {avatar.initials}
                  </span>
                ),
              )}
              {collaboratorAvatars.length > 4 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-600">
                  +{collaboratorAvatars.length - 4}
                </span>
              ) : null}
            </div>
          </div>
          <span>{collaboratorAvatars.length} collaborators</span>
        </div>
      ) : null}

      {lastActivityLabel ? (
        <footer className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Updated {lastActivityLabel}</span>
          {card.projectName ? <span className="font-medium text-slate-500">{card.projectName}</span> : null}
        </footer>
      ) : null}
    </article>
  );
}

CardTile.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string.isRequired,
    client: PropTypes.object,
    clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    priority: PropTypes.string,
    riskLevel: PropTypes.string,
    healthStatus: PropTypes.string,
    valueAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    valueCurrency: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    tags: PropTypes.arrayOf(PropTypes.string),
    checklist: PropTypes.arrayOf(PropTypes.object),
    checklistSummary: PropTypes.shape({ total: PropTypes.number, completed: PropTypes.number }),
    collaborators: PropTypes.arrayOf(PropTypes.object),
    ownerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ownerName: PropTypes.string,
    ownerEmail: PropTypes.string,
    ownerRole: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    lastActivityAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    projectName: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  highlighted: PropTypes.bool,
};

CardTile.defaultProps = {
  onOpen: undefined,
  onEdit: undefined,
  onDelete: undefined,
  onDragStart: undefined,
  onDragEnd: undefined,
  highlighted: false,
};
