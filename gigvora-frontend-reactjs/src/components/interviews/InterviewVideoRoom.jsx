import { useMemo } from 'react';
import { formatRelativeTime } from '../../utils/date.js';

function formatStatus(status) {
  if (!status) return 'Pending';
  return status
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBandwidth(value) {
  if (!Number.isFinite(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)} Mbps`;
}

function getLaneWorkload(lane) {
  const cards = Array.isArray(lane?.cards) ? lane.cards : [];
  const total = cards.length;
  const awaitingFeedback = cards.filter((card) => card.status === 'awaiting_feedback').length;
  return { total, awaitingFeedback };
}

function ParticipantRow({ participant }) {
  return (
    <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
      <div>
        <p className="text-sm font-semibold text-slate-900">{participant.name}</p>
        <p className="text-xs text-slate-500">
          {participant.role}
          {participant.participantType === 'candidate' ? ' • Candidate' : null}
          {participant.isModerator ? ' • Moderator' : null}
        </p>
      </div>
      <div className="text-right text-xs">
        <p className="font-semibold text-slate-500">{formatStatus(participant.status)}</p>
        <p className="text-slate-400">{participant.videoDevice}</p>
      </div>
    </li>
  );
}

function ChecklistItem({ item, onToggle }) {
  const isCompleted = item.status === 'completed';
  const isInProgress = item.status === 'in_progress';
  return (
    <li className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
          <p className="text-xs text-slate-500">{item.description}</p>
          <p className="mt-2 text-xs text-slate-400">
            Owner: {item.ownerName ?? 'Unassigned'}
            {item.completedAt ? ` • Completed ${formatRelativeTime(item.completedAt)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(item, isCompleted ? 'pending' : 'completed')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            isCompleted
              ? 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : isInProgress
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isCompleted ? 'Completed' : isInProgress ? 'In progress' : 'Mark complete'}
        </button>
      </div>
    </li>
  );
}

function StageColumn({ lane }) {
  const { total, awaitingFeedback } = useMemo(() => getLaneWorkload(lane), [lane]);
  const cards = Array.isArray(lane?.cards) ? lane.cards : [];
  return (
    <div className="flex min-w-[16rem] flex-col rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{lane.name}</p>
          <p className="text-sm font-semibold text-slate-900">
            {total} {total === 1 ? 'candidate' : 'candidates'}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          SLA {(lane.slaMinutes ?? 0) / 60} hrs
        </span>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Awaiting feedback: <strong className="text-slate-700">{awaitingFeedback}</strong>
      </div>
      <ul className="mt-4 space-y-3">
        {cards.length ? (
          cards.map((card) => (
            <li key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <p className="text-sm font-semibold text-slate-900">{card.candidateName}</p>
              <p className="text-xs text-slate-500">{card.jobTitle}</p>
              <p className="mt-2 text-xs text-slate-400">
                {card.stage} • {formatStatus(card.status)}
              </p>
              {card.scheduledAt ? (
                <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(card.scheduledAt)}</p>
              ) : null}
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
            No candidates in lane
          </li>
        )}
      </ul>
    </div>
  );
}

export default function InterviewVideoRoom({ room, workflow, loading, error, onRefresh, onChecklistToggle }) {
  const participants = Array.isArray(room?.participants) ? room.participants : [];
  const checklist = Array.isArray(room?.checklist) ? room.checklist : [];
  const lanes = Array.isArray(workflow?.lanes) ? workflow.lanes : [];

  return (
    <section className="space-y-6 rounded-4xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-lg">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Native video room</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{room?.stage ?? 'Interview'}</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Full HD interview rooms with auto-recordings, collaborative checklists, and multi-member participation.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 font-semibold text-emerald-700">
            {formatStatus(room?.status)}
          </span>
          {room?.scheduledAt ? (
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Starts {formatRelativeTime(room.scheduledAt)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-1 font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            Refresh data ↻
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.message || 'Unable to load the latest interview controls.'}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-5">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-full rounded bg-slate-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Video bridge</p>
                <p className="text-sm font-semibold text-slate-900">{room?.videoBridgeUrl ?? 'Provisioning'}</p>
              </div>
              <div className="text-xs text-slate-500">
                <p>HD enabled: {room?.hdEnabled ? 'Yes' : 'No'}</p>
                <p>Recording: {room?.recordingEnabled ? 'On' : 'Off'}</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
              <div>
                <dt className="uppercase tracking-wide text-slate-400">Network</dt>
                <dd className="text-sm font-semibold text-slate-900">{formatStatus(room?.qualitySignals?.networkStability)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-400">Bandwidth</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {formatBandwidth(room?.qualitySignals?.bandwidthMbps)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-400">Recordings queued</dt>
                <dd className="text-sm font-semibold text-slate-900">{room?.qualitySignals?.recordingsQueued ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Participants</h4>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{participants.length} joined</span>
            </div>
            <ul className="mt-4 space-y-3">
              {participants.length ? (
                participants.map((participant) => (
                  <ParticipantRow key={participant.id} participant={participant} />
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                  Participants will appear once invitations are sent.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Interview checklist</h4>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{checklist.length} items</span>
            </div>
            <ul className="mt-4 space-y-3">
              {checklist.length ? (
                checklist.map((item) => (
                  <ChecklistItem key={item.id} item={item} onToggle={onChecklistToggle} />
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
                  Add a checklist to standardise signal gathering.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quality guardrails</h4>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Enterprise ready</span>
            </div>
            <dl className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-wide text-slate-400">Auto recording</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {room?.qualitySignals?.autoRecordingEnabled ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-400">Live transcription</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {room?.qualitySignals?.transcriptionEnabled ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-400">Redundancy</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {room?.qualitySignals?.backupsReady ? 'Backup bridge ready' : 'Single region'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Interview stage Kanban
          </h4>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
            {lanes.length} lanes orchestrated
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {lanes.length ? (
            lanes
              .slice()
              .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
              .map((lane) => <StageColumn key={lane.id} lane={lane} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-sm text-slate-500">
              Configure your lanes to orchestrate interviews from screen to offer.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
