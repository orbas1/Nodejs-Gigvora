import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useHuddleLauncher from '../../hooks/useHuddleLauncher.js';
import usePresence from '../../hooks/usePresence.js';
import { formatRelativeTime, formatDateLabel } from '../../utils/date.js';
import classNames from '../../utils/classNames.js';

const DURATION_OPTIONS = [15, 30, 45, 60];
const DEFAULT_TEMPLATE = {
  title: 'Product sync',
  agenda:
    '1. Quick wins and shout-outs\n2. Priority blockers\n3. Customer insights\n4. Next sprint focus\n5. Follow-up owners',
};

function ParticipantPill({ participant, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(participant)}
      className={classNames(
        'flex items-center gap-3 rounded-2xl border px-3 py-2 shadow-sm transition',
        selected
          ? 'border-accent/40 bg-accent/10 text-accent shadow-accent/20'
          : 'border-slate-200 bg-white text-slate-600 hover:border-accent/20 hover:text-slate-800',
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
        {participant.initials || participant.name?.[0] || participant.email?.[0] || '•'}
      </span>
      <span className="flex flex-col items-start">
        <span className="text-sm font-semibold text-slate-900">{participant.name || participant.email}</span>
        {participant.role ? <span className="text-xs text-slate-500">{participant.role}</span> : null}
      </span>
      <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-slate-400">
        {participant.presence?.label || 'Available'}
      </span>
    </button>
  );
}

ParticipantPill.propTypes = {
  participant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
    initials: PropTypes.string,
    role: PropTypes.string,
    presence: PropTypes.shape({ label: PropTypes.string }),
  }).isRequired,
  selected: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};

ParticipantPill.defaultProps = {
  selected: false,
};

function TemplateSelector({ templates, onSelect }) {
  if (!templates.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {templates.map((template) => (
        <button
          key={template.id || template.title}
          type="button"
          onClick={() => onSelect(template)}
          className="group flex min-w-[220px] flex-1 flex-col gap-2 rounded-3xl border border-slate-200 bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{template.category || 'Template'}</span>
          <span className="text-base font-semibold text-slate-900">{template.title}</span>
          <span className="line-clamp-3 text-sm text-slate-600">{template.description || template.agenda}</span>
          <span className="text-xs font-semibold text-accent">Use agenda</span>
        </button>
      ))}
    </div>
  );
}

TemplateSelector.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      description: PropTypes.string,
      category: PropTypes.string,
      agenda: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func.isRequired,
};

TemplateSelector.defaultProps = {
  templates: [],
};

export default function HuddleRoomLauncher({
  hostId,
  workspaceId,
  projectId,
  defaultAgenda,
  onLaunch,
}) {
  const { context, recommendedParticipants, launchNow, schedule } = useHuddleLauncher({ workspaceId, projectId, enabled: true });
  const hostPresence = usePresence(hostId, { enabled: Boolean(hostId), pollInterval: 60_000 });

  const [agenda, setAgenda] = useState(defaultAgenda || DEFAULT_TEMPLATE.agenda);
  const [duration, setDuration] = useState(30);
  const [startAt, setStartAt] = useState('');
  const [recordMeeting, setRecordMeeting] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!defaultAgenda && context.data?.templates?.length) {
      setAgenda(context.data.templates[0].agenda || DEFAULT_TEMPLATE.agenda);
    }
  }, [context.data?.templates, defaultAgenda]);

  const focusRooms = context.data?.focusRooms ?? [];
  const followUpRoomId = focusRooms[0]?.id ?? null;

  const statusLabel = hostPresence.summary?.label ?? 'Available';
  const statusDetail = hostPresence.summary?.focusUntil
    ? `Focus until ${formatDateLabel(hostPresence.summary.focusUntil, { includeTime: true })}`
    : hostPresence.summary?.nextEvent
    ? `Next: ${formatRelativeTime(hostPresence.summary.nextEvent.startsAt)}`
    : hostPresence.summary?.lastSeenAt
    ? `Last active ${formatRelativeTime(hostPresence.summary.lastSeenAt)}`
    : 'Realtime status syncing';

  const toggleParticipant = (participant) => {
    setSelectedParticipants((previous) => {
      const exists = previous.some((item) => item.id === participant.id);
      if (exists) {
        return previous.filter((item) => item.id !== participant.id);
      }
      return [...previous, participant];
    });
  };

  const handleTemplateSelect = (template) => {
    setAgenda(template.agenda || template.description || template.title || agenda);
  };

  const attendeeIds = useMemo(() => selectedParticipants.map((participant) => participant.id).filter(Boolean), [selectedParticipants]);

  const instantLaunchDisabled = loading || !agenda.trim();

  const handleLaunch = async ({ instant } = {}) => {
    try {
      setLoading(true);
      setError(null);
      if (instant) {
        const response = await launchNow({ agenda, attendeeIds, notes, recordMeeting, durationMinutes: duration });
        onLaunch?.(response);
      } else {
        const response = await schedule({
          agenda,
          attendeeIds,
          notes,
          recordMeeting,
          followUpRoomId,
          startsAt: startAt || undefined,
          durationMinutes: duration,
        });
        onLaunch?.(response);
      }
    } catch (launchError) {
      console.error('Failed to launch huddle', launchError);
      setError(launchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (context.error || hostPresence.error) {
      setError(context.error || hostPresence.error);
    }
  }, [context.error, hostPresence.error]);

  const templates = context.data?.templates?.length ? context.data.templates : [DEFAULT_TEMPLATE];

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-2xl shadow-slate-200/70">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-accent to-violet-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_rgba(0,0,0,0))]" aria-hidden="true" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Instant huddle launcher</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight">Spin up premium collaboration rooms in seconds</h2>
            <p className="max-w-xl text-sm text-white/80">
              Curate the agenda, invite the right partners, and broadcast the meeting across linked workspaces—all without leaving the messaging hub.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 text-sm text-white/90 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Host status</span>
            <span className="text-lg font-semibold">{statusLabel}</span>
            <span className="text-xs text-white/80">{statusDetail}</span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Agenda blueprint</h3>
                <p className="text-xs text-slate-500">Drop in curated prompts to help teams stay focused.</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-accent/10 hover:text-accent"
                onClick={() => setAgenda(DEFAULT_TEMPLATE.agenda)}
              >
                Reset to default
              </button>
            </div>
            <textarea
              className="mt-4 h-44 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              placeholder="Map the key talking points and capture decision checkpoints…"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Suggested agendas</h3>
            <TemplateSelector templates={templates} onSelect={handleTemplateSelect} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes and context</h3>
            <textarea
              className="mt-4 h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Share supporting links, meeting goals, or follow-up expectations so everyone arrives prepared."
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recommended collaborators</h3>
            <p className="mt-1 text-xs text-slate-500">Signal boost key partners and mentors that can unblock outcomes.</p>
            <div className="mt-4 flex flex-col gap-3">
              {recommendedParticipants.length ? (
                recommendedParticipants.map((participant) => (
                  <ParticipantPill
                    key={participant.id || participant.email}
                    participant={participant}
                    selected={selectedParticipants.some((item) => item.id === participant.id)}
                    onToggle={toggleParticipant}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  We’ll recommend collaborators once engagement data rolls in. In the meantime you can paste attendee emails above.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Schedule</h3>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start time
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDuration(option)}
                      className={classNames(
                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                        duration === option
                          ? 'bg-accent text-white shadow-lg shadow-accent/40'
                          : 'bg-slate-100 text-slate-600 hover:bg-accent/10 hover:text-accent',
                      )}
                    >
                      {option} min
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 shadow-inner">
                <input
                  type="checkbox"
                  checked={recordMeeting}
                  onChange={(event) => setRecordMeeting(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                />
                Record this huddle for teammates who cannot join live
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold uppercase tracking-wide text-slate-500">Follow-up room</p>
                {followUpRoomId ? (
                  <p className="mt-1">Notes and recordings will drop into {focusRooms[0]?.name || 'the shared workspace'}.</p>
                ) : (
                  <p className="mt-1">Connect a focus room to auto-publish recaps, tasks, and recordings.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Launch controls</h3>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleLaunch({ instant: true })}
                disabled={instantLaunchDisabled}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-accent to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition hover:shadow-emerald-300/80 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Launch live huddle
              </button>
              <button
                type="button"
                onClick={() => handleLaunch({ instant: false })}
                disabled={loading || !startAt}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Schedule & send invites
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Analytics, recordings, and collaborative notes are stored alongside the project so teams can review momentum at any time.
            </p>
          </div>
        </aside>
      </section>

      {loading || context.loading || hostPresence.loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" aria-hidden="true" /> Preparing your huddle…
          </div>
        </div>
      ) : null}

      {(context.error || hostPresence.error || error) && !loading ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 shadow-inner">
          We couldn’t load all collaboration signals. You can still craft the agenda and try syncing again shortly.
        </div>
      ) : null}
    </div>
  );
}

HuddleRoomLauncher.propTypes = {
  hostId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultAgenda: PropTypes.string,
  onLaunch: PropTypes.func,
};

HuddleRoomLauncher.defaultProps = {
  workspaceId: undefined,
  projectId: undefined,
  defaultAgenda: undefined,
  onLaunch: undefined,
};
