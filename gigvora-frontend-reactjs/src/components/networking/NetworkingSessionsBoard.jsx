import { useMemo } from 'react';

function formatNumber(value, { fallback = '—' } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric.toLocaleString();
}

function formatCurrency(cents, currency = 'USD') {
  if (cents == null) return '—';
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatPercent(value, { fallback = '—', maximumFractionDigits = 1 } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return `${numeric.toFixed(maximumFractionDigits)}%`;
}

function normaliseCount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function SessionRow({ session, isSelected, onSelect }) {
  const startDate = session.startTime ? new Date(session.startTime) : null;
  const endDate = session.endTime ? new Date(session.endTime) : null;
  const timeline = [];
  if (startDate) {
    timeline.push(`Starts ${startDate.toLocaleString()}`);
  }
  if (endDate) {
    timeline.push(`Ends ${endDate.toLocaleString()}`);
  }

  const registered = normaliseCount(session.metrics?.registered);
  const checkedIn = normaliseCount(session.metrics?.checkedIn);
  const waitlisted = normaliseCount(session.metrics?.waitlisted);
  const joinLimit = Number.isFinite(Number(session.joinLimit)) ? Number(session.joinLimit) : null;
  const averageSatisfaction = Number.isFinite(Number(session.metrics?.averageSatisfaction))
    ? Number(session.metrics.averageSatisfaction)
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(session)}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        isSelected ? 'border-blue-400 bg-blue-50/80 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-blue-200'
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{session.title}</p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              session.status === 'in_progress'
                ? 'bg-green-100 text-green-700'
                : session.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-700'
                  : session.status === 'draft'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
            }`}
          >
            {session.status?.replace(/_/g, ' ') ?? 'unknown'}
          </span>
        </div>
        <p className="text-xs text-slate-500">{session.description || 'Speed networking session'}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-600 md:grid-cols-4">
          <div>
            <p className="font-medium text-slate-900">{formatNumber(registered + checkedIn)}</p>
            <p>Registered attendees</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">{joinLimit != null ? formatNumber(joinLimit) : '—'}</p>
            <p>Join limit</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">{formatNumber(waitlisted)}</p>
            <p>Waitlist</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">{formatPercent(averageSatisfaction)}</p>
            <p>Satisfaction</p>
          </div>
        </div>
        {timeline.length ? (
          <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">{timeline.join(' • ')}</p>
        ) : null}
      </div>
    </button>
  );
}

export default function NetworkingSessionsBoard({
  networking,
  selectedSessionId,
  onSelectSession,
  onCreateSession,
}) {
  const sessions = networking?.sessions ?? {};
  const scheduling = networking?.scheduling ?? {};
  const monetization = networking?.monetization ?? {};
  const penalties = networking?.penalties ?? {};
  const attendeeExperience = networking?.attendeeExperience ?? {};
  const digitalBusinessCards = networking?.digitalBusinessCards ?? {};
  const video = networking?.video ?? {};

  const sessionList = useMemo(() => sessions.list ?? [], [sessions.list]);

  const summaryCards = [
    { label: 'Active sessions', value: formatNumber(sessions.active) },
    { label: 'Upcoming', value: formatNumber(sessions.upcoming) },
    { label: 'Completed', value: formatNumber(sessions.completed) },
    { label: 'Average join limit', value: formatNumber(sessions.averageJoinLimit) },
    {
      label: 'Rotation duration',
      value: sessions.rotationDurationSeconds ? `${formatNumber(sessions.rotationDurationSeconds)} sec` : '—',
    },
    {
      label: 'Revenue',
      value: formatCurrency(sessions.revenueCents, 'USD'),
    },
  ];

  const schedulingCards = [
    { label: 'Pre-registrations', value: formatNumber(scheduling.preRegistrations) },
    { label: 'Waitlist', value: formatNumber(scheduling.waitlist) },
    { label: 'Reminders sent', value: formatNumber(scheduling.remindersSent) },
    { label: 'Search interest', value: formatNumber(scheduling.searches) },
  ];

  const monetizationCards = [
    { label: 'Paid sessions', value: formatNumber(monetization.paid) },
    { label: 'Free sessions', value: formatNumber(monetization.free) },
    { label: 'Average price', value: formatCurrency(monetization.averagePriceCents) },
    { label: 'Sponsor slots', value: formatNumber(scheduling.sponsorSlots) },
  ];

  const penaltyCards = [
    { label: 'No-show rate', value: formatPercent(penalties.noShowRate) },
    { label: 'Active penalties', value: formatNumber(penalties.activePenalties) },
    { label: 'Restricted attendees', value: formatNumber(penalties.restrictedParticipants) },
    { label: 'Cooldown', value: penalties.cooldownDays ? `${penalties.cooldownDays} days` : '—' },
  ];

  const experienceCards = [
    { label: 'Profiles shared', value: formatNumber(attendeeExperience.profilesShared) },
    { label: 'Connections saved', value: formatNumber(attendeeExperience.connectionsSaved) },
    { label: 'Messages / session', value: formatNumber(attendeeExperience.averageMessagesPerSession) },
    { label: 'Follow-ups scheduled', value: formatNumber(attendeeExperience.followUpsScheduled) },
  ];

  const cardStats = [
    { label: 'Digital cards', value: formatNumber(digitalBusinessCards.created) },
    { label: 'Updated this week', value: formatNumber(digitalBusinessCards.updatedThisWeek) },
    { label: 'Shared in session', value: formatNumber(digitalBusinessCards.sharedInSession) },
    { label: 'Template variations', value: formatNumber(digitalBusinessCards.templates) },
  ];

  const videoCards = [
    { label: 'Quality score', value: formatPercent(video.averageQualityScore, { maximumFractionDigits: 2 }) },
    { label: 'Browser load share', value: formatPercent(video.browserLoadShare, { maximumFractionDigits: 0 }) },
    { label: 'Host announcements', value: formatNumber(video.hostAnnouncements) },
    { label: 'Failover rate', value: formatPercent(video.failoverRate, { maximumFractionDigits: 2 }) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Networking sessions</h2>
          <p className="text-sm text-slate-600">
            Launch and manage browser-based speed networking with rotation timers, business cards, and penalty controls.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onCreateSession?.()}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            Create session
          </button>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Session summary</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational signals</h3>
          {[schedulingCards, monetizationCards, penaltyCards].map((group, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                {group.map((card) => (
                  <div key={card.label}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Attendee experience</h3>
          {[experienceCards, cardStats, videoCards].map((group, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                {group.map((card) => (
                  <div key={card.label}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Session library</h3>
          <p className="text-xs text-slate-500">Select a session to open runtime controls and attendee analytics.</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessionList.length ? (
            sessionList.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                isSelected={selectedSessionId === session.id}
                onSelect={(value) => onSelectSession?.(value)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
              <p>No networking sessions yet. Use “Create session” to launch your first speed networking program.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
