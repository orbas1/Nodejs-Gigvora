import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value) {
  if (!value) {
    return 'TBD';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'TBD';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_OPTIONS = ['scheduled', 'awaiting_feedback', 'needs_scheduling', 'offer_sent', 'completed'];

function LaneModal({ open, lane, onClose, onSubmit, onDelete, busy }) {
  const isNew = !lane?.id;
  const [draft, setDraft] = useState({ name: '', color: '#38bdf8', slaMinutes: 480 });

  useEffect(() => {
    if (lane) {
      setDraft({ name: lane.name ?? '', color: lane.color ?? '#38bdf8', slaMinutes: lane.slaMinutes ?? 480 });
    } else {
      setDraft({ name: '', color: '#38bdf8', slaMinutes: 480 });
    }
  }, [lane, open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-4xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {isNew ? 'New lane' : 'Edit lane'}
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Color</span>
                    <input
                      type="color"
                      value={draft.color}
                      onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))}
                      className="h-11 w-24 rounded-xl border border-slate-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA minutes</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.slaMinutes}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, slaMinutes: Number(event.target.value) || 0 }))
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  {!isNew ? (
                    <button
                      type="button"
                      onClick={() => onDelete?.(lane)}
                      disabled={busy}
                      className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                    >
                      Delete lane
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onSubmit?.({
                        ...draft,
                        slaMinutes: Number(draft.slaMinutes) || 0,
                      })
                    }
                    disabled={busy || !draft.name}
                    className={classNames(
                      'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                      busy || !draft.name ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700',
                    )}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function CardModal({ open, card, lanes, onClose, onSubmit, onDelete, busy }) {
  const isNew = !card?.id;
  const [draft, setDraft] = useState({
    laneId: lanes[0]?.id,
    candidateName: '',
    jobTitle: '',
    status: 'scheduled',
    stage: '',
    ownerName: '',
    scheduledAt: '',
  });

  useEffect(() => {
    if (card) {
      setDraft({
        laneId: card.laneId ?? lanes[0]?.id,
        candidateName: card.candidateName ?? '',
        jobTitle: card.jobTitle ?? '',
        status: card.status ?? 'scheduled',
        stage: card.stage ?? '',
        ownerName: card.ownerName ?? '',
        scheduledAt: card.scheduledAt ? new Date(card.scheduledAt).toISOString().slice(0, 16) : '',
      });
    } else {
      setDraft({
        laneId: lanes[0]?.id,
        candidateName: '',
        jobTitle: '',
        status: 'scheduled',
        stage: '',
        ownerName: '',
        scheduledAt: '',
      });
    }
  }, [card, lanes, open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-4xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {isNew ? 'New candidate' : draft.candidateName}
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lane</span>
                    <select
                      value={draft.laneId}
                      onChange={(event) => setDraft((prev) => ({ ...prev, laneId: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {lanes.map((lane) => (
                        <option key={lane.id} value={lane.id}>
                          {lane.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</span>
                    <input
                      type="text"
                      value={draft.candidateName}
                      onChange={(event) => setDraft((prev) => ({ ...prev, candidateName: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
                    <input
                      type="text"
                      value={draft.jobTitle}
                      onChange={(event) => setDraft((prev) => ({ ...prev, jobTitle: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</span>
                    <input
                      type="text"
                      value={draft.stage}
                      onChange={(event) => setDraft((prev) => ({ ...prev, stage: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
                    <input
                      type="text"
                      value={draft.ownerName}
                      onChange={(event) => setDraft((prev) => ({ ...prev, ownerName: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</span>
                    <input
                      type="datetime-local"
                      value={draft.scheduledAt}
                      onChange={(event) => setDraft((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  {!isNew ? (
                    <button
                      type="button"
                      onClick={() => onDelete?.(card)}
                      disabled={busy}
                      className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                    >
                      Remove card
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onSubmit?.({
                        ...draft,
                        scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : null,
                      })
                    }
                    disabled={busy || !draft.candidateName}
                    className={classNames(
                      'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                      busy || !draft.candidateName
                        ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700',
                    )}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function WorkflowPanel({
  workflow,
  onCreateLane,
  onUpdateLane,
  onDeleteLane,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  busy = false,
  showHeader = true,
  className = '',
}) {
  const lanes = workflow?.lanes ?? [];
  const [laneModal, setLaneModal] = useState({ open: false, lane: null });
  const [cardModal, setCardModal] = useState({ open: false, laneId: null, card: null });

  const boardLanes = useMemo(() => {
    return lanes.map((lane) => ({
      ...lane,
      cards: (lane.cards ?? []).map((card) => ({ ...card, laneId: lane.id })),
    }));
  }, [lanes]);

  const openLaneModal = (lane = null) => setLaneModal({ open: true, lane });
  const openCardModal = (laneId, card = null) => setCardModal({ open: true, laneId, card });

  return (
    <div className={classNames('space-y-6', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Flow</h2>
          <button
            type="button"
            onClick={() => openLaneModal(null)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => openLaneModal(null)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="flex min-w-full gap-6">
          {boardLanes.map((lane) => (
            <div key={lane.id} className="w-80 shrink-0 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{lane.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {Math.round((lane.slaMinutes ?? 0) / 60)}h SLA
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openLaneModal(lane)}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {lane.cards.map((card) => (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => openCardModal(lane.id, card)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-sm text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <p className="font-semibold text-slate-800">{card.candidateName}</p>
                    <p>{card.jobTitle}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{card.status.replace(/_/g, ' ')}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(card.scheduledAt)}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => openCardModal(lane.id, null)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <PlusIcon className="h-4 w-4" /> Add card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LaneModal
        open={laneModal.open}
        lane={laneModal.lane}
        onClose={() => setLaneModal({ open: false, lane: null })}
        onSubmit={async (payload) => {
          if (laneModal.lane) {
            await onUpdateLane(laneModal.lane.id, payload);
          } else {
            await onCreateLane(payload);
          }
          setLaneModal({ open: false, lane: null });
        }}
        onDelete={async (lane) => {
          await onDeleteLane(lane.id);
          setLaneModal({ open: false, lane: null });
        }}
        busy={busy}
      />

      <CardModal
        open={cardModal.open}
        card={cardModal.card ? { ...cardModal.card, laneId: cardModal.laneId } : { laneId: cardModal.laneId }}
        lanes={boardLanes}
        onClose={() => setCardModal({ open: false, laneId: null, card: null })}
        onSubmit={async (payload) => {
          if (cardModal.card) {
            await onUpdateCard(payload.laneId, cardModal.card.id, payload);
          } else {
            await onCreateCard(payload.laneId, payload);
          }
          setCardModal({ open: false, laneId: null, card: null });
        }}
        onDelete={async (card) => {
          await onDeleteCard(card.laneId, card.id);
          setCardModal({ open: false, laneId: null, card: null });
        }}
        busy={busy}
      />
    </div>
  );
}
