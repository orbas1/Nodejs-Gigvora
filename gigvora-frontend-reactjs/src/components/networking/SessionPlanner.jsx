import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import NetworkingSessionDesigner from './NetworkingSessionDesigner.jsx';
import { toDesignerDefaults } from '../../utils/networkingSessions.js';

function formatNumber(value, { fallback = '—' } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric.toLocaleString();
}

function formatPercent(value, { fallback = '—', digits = 1 } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return `${numeric.toFixed(digits)}%`;
}

function formatDecimal(value, { fallback = '—', digits = 1 } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return date.toLocaleString();
}

function designerPayload(values, { companyId }) {
  const payload = { ...values };
  if (payload.price != null) {
    payload.priceCents = Math.max(0, Math.round(Number(payload.price) * 100));
  }
  delete payload.price;
  if (companyId != null) {
    payload.companyId = companyId;
  }
  return payload;
}

function SessionCard({ session, isActive, onSelect }) {
  const registered = Number(session?.metrics?.registered ?? 0);
  const checkedIn = Number(session?.metrics?.checkedIn ?? 0);
  const waitlisted = Number(session?.metrics?.waitlisted ?? 0);
  const satisfaction = session?.metrics?.averageSatisfaction;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(session)}
      className={`w-full rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
        isActive
          ? 'border-blue-400 bg-blue-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{session.title}</p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              session.status === 'in_progress'
                ? 'bg-emerald-100 text-emerald-700'
                : session.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-700'
                  : session.status === 'draft'
                    ? 'bg-amber-100 text-amber-700'
                    : session.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
            }`}
          >
            {session.status?.replace(/_/g, ' ') || 'unknown'}
          </span>
        </div>
        <p className="text-xs text-slate-500">{formatDateTime(session.startTime)}</p>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatNumber(registered + checkedIn)}</p>
            <p className="mt-0.5">Attending</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatNumber(waitlisted)}</p>
            <p className="mt-0.5">Waitlist</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatNumber(session.joinLimit)}</p>
            <p className="mt-0.5">Seats</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatPercent(satisfaction)}</p>
            <p className="mt-0.5">Satisfaction</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailMetric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
      <div className="rounded-xl bg-white p-2 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function SessionDetail({ session, onEdit }) {
  if (!session) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-600">
        Select a session to open details.
      </div>
    );
  }

  const metrics = session.metrics ?? {};

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{session.title}</h3>
          <button
            type="button"
            onClick={() => onEdit?.(session)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
        </div>
        {session.description ? (
          <p className="text-sm text-slate-600">{session.description}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DetailMetric icon={CalendarIcon} label="Start" value={formatDateTime(session.startTime)} />
        <DetailMetric icon={ClockIcon} label="Length" value={`${formatNumber(session.sessionLengthMinutes)} min`} />
        <DetailMetric icon={UserGroupIcon} label="Join limit" value={formatNumber(session.joinLimit)} />
        <DetailMetric
          icon={ChatBubbleBottomCenterTextIcon}
          label="Messages"
          value={formatNumber(metrics.messagesSent)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DetailMetric icon={UserGroupIcon} label="Registered" value={formatNumber(metrics.registered)} />
        <DetailMetric icon={UserGroupIcon} label="Checked in" value={formatNumber(metrics.checkedIn)} />
        <DetailMetric icon={UserGroupIcon} label="Completed" value={formatNumber(metrics.completed)} />
        <DetailMetric icon={UserGroupIcon} label="No-shows" value={formatNumber(metrics.noShows)} />
      </div>
    </div>
  );
}

export default function SessionPlanner({
  sessions = [],
  summary,
  onCreate,
  onUpdate,
  onRefresh,
  refreshing,
  companyId,
}) {
  const [selectedId, setSelectedId] = useState(() => sessions[0]?.id ?? null);
  const [designerState, setDesignerState] = useState({ open: false, mode: 'create', defaults: {} });
  const [submissionError, setSubmissionError] = useState(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null,
    [selectedId, sessions],
  );

  useEffect(() => {
    if (!sessions.length) {
      setSelectedId(null);
      return;
    }
    if (!sessions.some((session) => session.id === selectedId)) {
      setSelectedId(sessions[0]?.id ?? null);
    }
  }, [sessions, selectedId]);

  const cards = useMemo(
    () => [
      { label: 'Live', value: formatNumber(summary?.live) },
      { label: 'Upcoming', value: formatNumber(summary?.upcoming) },
      { label: 'Completed', value: formatNumber(summary?.done) },
      { label: 'Avg seats', value: formatNumber(summary?.averageJoinLimit) },
      { label: 'Rotation', value: summary?.averageRotation ? `${formatNumber(summary.averageRotation)} sec` : '—' },
      { label: 'Satisfaction', value: formatPercent(summary?.averageSatisfaction) },
      { label: 'No-show', value: formatPercent(summary?.noShowRate) },
      { label: 'Messages', value: formatNumber(summary?.averageMessages) },
      { label: 'Follow-ups', value: formatNumber(summary?.totalFollowUps) },
      { label: 'Avg follow-ups / session', value: formatDecimal(summary?.averageFollowUpsPerSession) },
      {
        label: 'Avg follow-ups / attendee',
        value: formatDecimal(summary?.averageFollowUpsPerAttendee, { digits: 2 }),
      },
      { label: 'Connections saved', value: formatNumber(summary?.connectionsCaptured) },
      {
        label: 'Avg connections / session',
        value: formatDecimal(summary?.averageConnectionsPerSession),
      },
    ],
    [
      summary?.averageConnectionsPerSession,
      summary?.averageFollowUpsPerAttendee,
      summary?.averageFollowUpsPerSession,
      summary?.averageJoinLimit,
      summary?.averageMessages,
      summary?.averageRotation,
      summary?.averageSatisfaction,
      summary?.connectionsCaptured,
      summary?.done,
      summary?.live,
      summary?.noShowRate,
      summary?.totalFollowUps,
      summary?.upcoming,
    ],
  );

  const openCreate = () => {
    setSubmissionError(null);
    setDesignerState({ open: true, mode: 'create', defaults: {} });
  };

  const openEdit = (session) => {
    setSubmissionError(null);
    setDesignerState({
      open: true,
      mode: 'edit',
      defaults: toDesignerDefaults(session),
      sessionId: session?.id,
    });
  };

  const closeDesigner = () => {
    setDesignerState((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async (values) => {
    try {
      setSubmissionError(null);
      if (designerState.mode === 'edit' && designerState.sessionId) {
        await onUpdate?.(designerState.sessionId, designerPayload(values, { companyId }));
      } else {
        await onCreate?.(designerPayload(values, { companyId }));
      }
      closeDesigner();
      await onRefresh?.({ force: true });
    } catch (error) {
      setSubmissionError(error.message || 'Unable to save session.');
      throw error;
    }
  };

  return (
    <section id="plan" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Plan</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRefresh?.({ force: true })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            disabled={refreshing}
          >
            <ClockIcon className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            New session
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={session.id === selectedSession?.id}
              onSelect={(next) => {
                setSelectedId(next?.id ?? null);
              }}
            />
          ))}
          {!sessions.length ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
              No sessions yet.
            </div>
          ) : null}
        </div>
        <SessionDetail session={selectedSession} onEdit={openEdit} />
      </div>

      <Transition show={designerState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeDesigner}>
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
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform rounded-3xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="sr-only">Networking session designer</Dialog.Title>
                  {submissionError ? (
                    <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                      {submissionError}
                    </p>
                  ) : null}
                  <NetworkingSessionDesigner
                    onSubmit={handleSubmit}
                    onCancel={closeDesigner}
                    defaultValues={designerState.defaults}
                    mode={designerState.mode}
                    submitLabel={designerState.mode === 'edit' ? 'Save changes' : 'Create session'}
                    helperText="Configure timings, limits, and access in a clean flow."
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}
