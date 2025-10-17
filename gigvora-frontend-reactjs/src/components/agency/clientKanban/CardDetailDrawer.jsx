import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { HEALTH_TONES, PRIORITY_TONES, RISK_TONES, classNames, formatCurrency, formatDate, formatRelative } from './utils.js';

function StatBadge({ tone, label }) {
  return (
    <span className={classNames('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold', tone)}>
      {label}
    </span>
  );
}

StatBadge.propTypes = {
  tone: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
};

function ChecklistItem({ item, onToggle, onDelete, onEdit }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={Boolean(item.completed)}
        onChange={(event) => onToggle?.(item, event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
      />
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{item.title}</p>
        {item.dueDate ? <p className="text-xs text-slate-500">Due {formatDate(item.dueDate)}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onEdit?.(item)}
        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent hover:text-accent"
        aria-label="Edit checklist item"
      >
        <PencilSquareIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete?.(item)}
        className="rounded-full border border-rose-200 p-2 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
        aria-label="Remove checklist item"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

ChecklistItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    completed: PropTypes.bool,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }).isRequired,
  onToggle: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
};

export default function CardDetailDrawer({
  card,
  open,
  onClose,
  onEdit,
  onDelete,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
  onUpdateChecklist,
  onSaveNotes,
}) {
  const [noteDraft, setNoteDraft] = useState(card?.notes ?? '');
  const [newChecklist, setNewChecklist] = useState('');
  useEffect(() => {
    if (open) {
      setNoteDraft(card?.notes ?? '');
    }
  }, [open, card?.notes, card?.id]);
  const sortedChecklist = useMemo(() => {
    if (!Array.isArray(card?.checklist)) {
      return [];
    }
    return [...card.checklist].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [card?.checklist]);

  const handleAddChecklist = async () => {
    if (!newChecklist.trim()) {
      return;
    }
    await onAddChecklist?.({ title: newChecklist });
    setNewChecklist('');
  };

  const handleSaveNotes = async () => {
    await onSaveNotes?.(noteDraft);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="h-full w-full max-w-3xl space-y-6 overflow-y-auto bg-white p-8 shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <Dialog.Title className="text-2xl font-semibold text-slate-900">{card?.title}</Dialog.Title>
                    <p className="text-sm text-slate-500">{card?.client?.name ?? 'Unassigned client'}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatBadge tone={PRIORITY_TONES[card?.priority] ?? PRIORITY_TONES.medium} label={card?.priority ?? 'medium'} />
                      <StatBadge tone={RISK_TONES[card?.riskLevel] ?? RISK_TONES.low} label={card?.riskLevel ?? 'low'} />
                      <StatBadge tone={HEALTH_TONES[card?.healthStatus] ?? HEALTH_TONES.healthy} label={card?.healthStatus ?? 'healthy'} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <section className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-6 md:grid-cols-2">
                  <dl className="space-y-3 text-sm text-slate-600">
                    <div>
                      <dt className="font-semibold text-slate-500">Value</dt>
                      <dd className="text-lg font-semibold text-slate-900">
                        {formatCurrency(card?.valueAmount, card?.valueCurrency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Owner</dt>
                      <dd>{card?.ownerName ?? '—'}</dd>
                      <dd className="text-xs text-slate-400">{card?.ownerEmail ?? ''}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Client contact</dt>
                      <dd>{card?.contactName ?? '—'}</dd>
                      <dd className="text-xs text-slate-400">{card?.contactEmail ?? ''}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Project</dt>
                      <dd>{card?.projectName ?? '—'}</dd>
                    </div>
                  </dl>

                  <dl className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
                      <div>
                        <dt className="font-semibold text-slate-500">Dates</dt>
                        <dd>
                          {card?.startDate ? formatDate(card.startDate) : '—'} →{' '}
                          {card?.dueDate ? formatDate(card.dueDate) : '—'}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-slate-400" />
                      <div>
                        <dt className="font-semibold text-slate-500">Next touch</dt>
                        <dd>{card?.nextInteractionAt ? formatRelative(card.nextInteractionAt) : '—'}</dd>
                      </div>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Tags</dt>
                      <dd>{card?.tags?.length ? card.tags.join(', ') : '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Summary</dt>
                      <dd className="text-slate-700">{card?.summary ?? '—'}</dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-4">
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Checklist</h3>
                    <span className="text-xs text-slate-500">
                      {card?.checklistSummary?.completed ?? 0} / {card?.checklistSummary?.total ?? 0}
                    </span>
                  </header>
                  <div className="space-y-3">
                    {sortedChecklist.length ? (
                      <ul className="space-y-2">
                        {sortedChecklist.map((item) => (
                          <ChecklistItem
                            key={item.id}
                            item={item}
                            onToggle={(candidate, checked) => onToggleChecklist?.(candidate, checked)}
                            onDelete={(candidate) => onDeleteChecklist?.(candidate)}
                            onEdit={(candidate) => onUpdateChecklist?.(candidate)}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No tasks yet.</p>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={newChecklist}
                        onChange={(event) => setNewChecklist(event.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Add task"
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklist}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <header className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-slate-400" />
                    Notes
                  </header>
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={5}
                    className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Add context or outcomes"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
                    >
                      Save notes
                    </button>
                  </div>
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

CardDetailDrawer.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    client: PropTypes.object,
    priority: PropTypes.string,
    riskLevel: PropTypes.string,
    healthStatus: PropTypes.string,
    valueAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    valueCurrency: PropTypes.string,
    ownerName: PropTypes.string,
    ownerEmail: PropTypes.string,
    contactName: PropTypes.string,
    contactEmail: PropTypes.string,
    projectName: PropTypes.string,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    nextInteractionAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    summary: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    checklist: PropTypes.arrayOf(PropTypes.object),
    checklistSummary: PropTypes.shape({ total: PropTypes.number, completed: PropTypes.number }),
    notes: PropTypes.string,
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAddChecklist: PropTypes.func,
  onToggleChecklist: PropTypes.func,
  onDeleteChecklist: PropTypes.func,
  onUpdateChecklist: PropTypes.func,
  onSaveNotes: PropTypes.func,
};

CardDetailDrawer.defaultProps = {
  card: null,
};
