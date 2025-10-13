function formatClock(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ParticipantList({ title, participants, emptyState }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-900">{title}</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{participants.length}</span>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {participants.length ? (
          participants.slice(0, 5).map((participant) => (
            <li key={participant.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="font-medium text-slate-900">{participant.participantName}</p>
              <p className="text-xs text-slate-500">{participant.participantEmail}</p>
            </li>
          ))
        ) : (
          <li className="text-xs text-slate-500">{emptyState}</li>
        )}
      </ul>
    </div>
  );
}

export default function NetworkingDuringSessionConsole({ runtime, loading, onRefresh }) {
  const activeRotation = runtime?.runtime?.activeRotation ?? null;
  const nextRotation = runtime?.runtime?.nextRotation ?? null;
  const checkedIn = runtime?.runtime?.checkedIn ?? [];
  const waitlist = runtime?.runtime?.waitlist ?? [];
  const completed = runtime?.runtime?.completed ?? [];
  const noShows = runtime?.runtime?.noShows ?? [];
  const session = runtime?.session ?? null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Runtime console</h2>
          <p className="text-sm text-slate-600">
            Track who is in the room, nudge waitlisted attendees, and monitor rotation timing without leaving the dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh state'}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Active rotation</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {activeRotation ? `Rotation ${activeRotation.rotationNumber}` : 'Waiting to start'}
          </p>
          <p className="text-sm text-slate-600">
            {activeRotation
              ? `Runs ${formatClock(activeRotation.startTime)} - ${formatClock(activeRotation.endTime)} · ${activeRotation.durationSeconds} sec`
              : session?.status === 'in_progress'
                ? 'Rotation data not yet available.'
                : 'Session not yet live.'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next rotation</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {nextRotation ? `Rotation ${nextRotation.rotationNumber}` : 'Scheduled finale'}
          </p>
          <p className="text-sm text-slate-600">
            {nextRotation ? `Starts ${formatClock(nextRotation.startTime)}` : 'All rotations are complete.'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <ParticipantList title="Checked in" participants={checkedIn} emptyState="No attendees checked in yet." />
        <ParticipantList title="Waitlist" participants={waitlist} emptyState="Waitlist is currently clear." />
        <ParticipantList title="Completed" participants={completed} emptyState="No attendees have finished yet." />
        <ParticipantList title="No-shows" participants={noShows} emptyState="No no-shows recorded." />
      </div>
    </section>
  );
}
