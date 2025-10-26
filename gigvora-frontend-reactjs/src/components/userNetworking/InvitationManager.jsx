import { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import PeopleSearchBar from './PeopleSearchBar.jsx';
import { resolveConnectionName } from './utils.js';

const TABS = [
  { id: 'received', label: 'Received' },
  { id: 'sent', label: 'Sent' },
  { id: 'suggested', label: 'Suggestions' },
];

function determineTab(invitation) {
  const raw = invitation?.direction ?? invitation?.type ?? invitation?.category ?? 'received';
  const lower = String(raw).toLowerCase();
  if (lower.includes('sent') || lower.includes('outgoing')) {
    return 'sent';
  }
  if (lower.includes('suggestion') || lower.includes('recommended') || lower.includes('opportunity')) {
    return 'suggested';
  }
  return 'received';
}

function StatsStrip({ metrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response rate</p>
        <p className="text-2xl font-semibold text-slate-900">{metrics.responseRate}%</p>
        <p className="text-xs text-slate-500">{metrics.responseNarrative}</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Median reply time</p>
        <p className="text-2xl font-semibold text-slate-900">{metrics.medianResponse}</p>
        <p className="text-xs text-slate-500">{metrics.medianNarrative}</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting action</p>
        <p className="text-2xl font-semibold text-slate-900">{metrics.pending}</p>
        <p className="text-xs text-slate-500">{metrics.pendingNarrative}</p>
      </div>
    </div>
  );
}

StatsStrip.propTypes = {
  metrics: PropTypes.shape({
    responseRate: PropTypes.number,
    responseNarrative: PropTypes.string,
    medianResponse: PropTypes.string,
    medianNarrative: PropTypes.string,
    pending: PropTypes.number,
    pendingNarrative: PropTypes.string,
  }).isRequired,
};

function TabPills({ activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={classNames(
            'rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg focus:ring-indigo-200'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

TabPills.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

function InvitationCard({
  invitation,
  isSelected,
  onToggleSelect,
  onAccept,
  onDecline,
  onMessage,
  onResend,
  note,
  onNoteChange,
}) {
  const persona = invitation?.persona ?? invitation?.relationship ?? invitation?.role ?? 'Member';
  const lastActivity = invitation?.updatedAt ?? invitation?.createdAt;
  const createdAt = invitation?.createdAt ? formatRelativeTime(invitation.createdAt) : '—';
  const mutualConnections = Number(invitation?.mutualConnections ?? invitation?.mutuals ?? 0);
  const summary = invitation?.summary ?? invitation?.note ?? invitation?.intro ?? '';
  const name = resolveConnectionName(invitation);
  const avatar = invitation?.avatarUrl ?? invitation?.photoUrl;

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="checkbox"
              aria-label={`Select ${name}`}
              checked={isSelected}
              onChange={() => onToggleSelect(invitation)}
              className="absolute -left-4 top-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg text-slate-500">
              {avatar ? <img src={avatar} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : name.charAt(0)}
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">{persona}</p>
            <p className="text-xs text-slate-400">{mutualConnections} mutual connection{mutualConnections === 1 ? '' : 's'}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {invitation?.status ?? 'Pending'}
        </span>
      </div>

      {summary ? <p className="text-sm leading-relaxed text-slate-600">{summary}</p> : null}

      <dl className="grid grid-cols-2 gap-4 text-xs text-slate-500">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-400">Invited</dt>
          <dd>{createdAt}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-400">Updated</dt>
          <dd>{lastActivity ? formatRelativeTime(lastActivity) : '—'}</dd>
        </div>
      </dl>

      <div className="grid gap-3 rounded-2xl bg-slate-50 p-3">
        <label htmlFor={`note-${invitation.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Add context
        </label>
        <textarea
          id={`note-${invitation.id}`}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Share context before sending a message"
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        <p className="text-[11px] text-slate-500">Notes stay with this invitation so the team communicates consistently.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
          onClick={() => onAccept(invitation)}
        >
          Accept
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          onClick={() => onDecline(invitation)}
        >
          Decline
        </button>
        <button
          type="button"
          className="rounded-full border border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
          onClick={() => onMessage(invitation)}
        >
          Message
        </button>
        <button
          type="button"
          className="rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
          onClick={() => onResend(invitation)}
        >
          Remind
        </button>
      </div>
    </article>
  );
}

InvitationCard.propTypes = {
  invitation: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  note: PropTypes.string,
  onNoteChange: PropTypes.func.isRequired,
};

InvitationCard.defaultProps = {
  note: '',
};

function BulkActionBar({
  selectedCount,
  onClear,
  onAccept,
  onDecline,
  onMessage,
  onRemind,
}) {
  if (!selectedCount) {
    return null;
  }

  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm text-white shadow-xl">
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{selectedCount} selected</span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm" onClick={onAccept}>
          Accept
        </button>
        <button type="button" className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white" onClick={onDecline}>
          Decline
        </button>
        <button type="button" className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white" onClick={onMessage}>
          Message
        </button>
        <button type="button" className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white" onClick={onRemind}>
          Remind
        </button>
        <button type="button" className="rounded-full border border-transparent bg-white/20 px-3 py-2 text-[11px] font-semibold text-white" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}

BulkActionBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onClear: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onRemind: PropTypes.func.isRequired,
};

export default function InvitationManager({
  invitations,
  onAccept,
  onDecline,
  onMessage,
  onRemind,
  onTrackEvent,
}) {
  const [activeTab, setActiveTab] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    statuses: [],
    relationships: [],
    organisations: [],
    industries: [],
    locations: [],
    tags: [],
    seniority: [],
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [notes, setNotes] = useState({});

  const derivedInvitations = useMemo(() => {
    return invitations.map((invitation) => ({
      ...invitation,
      tab: determineTab(invitation),
    }));
  }, [invitations]);

  const filterOptions = useMemo(() => {
    const organisations = new Map();
    const tags = new Map();
    const locations = new Map();
    derivedInvitations.forEach((invitation) => {
      if (invitation?.organisation) {
        organisations.set(invitation.organisation, { id: invitation.organisation, label: invitation.organisation });
      }
      if (Array.isArray(invitation?.tags)) {
        invitation.tags.forEach((tag) => {
          if (tag) {
            tags.set(tag, { id: tag, label: tag });
          }
        });
      }
      if (invitation?.location) {
        locations.set(invitation.location, { id: invitation.location, label: invitation.location });
      }
    });
    return {
      organisations: Array.from(organisations.values()),
      industries: [],
      locations: Array.from(locations.values()),
      tags: Array.from(tags.values()),
      seniority: [],
    };
  }, [derivedInvitations]);

  const filteredInvitations = useMemo(() => {
    const query = searchTerm?.toLowerCase() ?? '';
    return derivedInvitations.filter((invitation) => {
      if (activeTab !== invitation.tab) {
        return false;
      }
      if (query) {
        const haystack = [
          resolveConnectionName(invitation),
          invitation?.persona,
          invitation?.organisation,
          invitation?.summary,
          ...(invitation?.tags ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.statuses?.length) {
        const status = String(invitation?.status ?? '').toLowerCase();
        if (!filters.statuses.some((value) => status.includes(value))) {
          return false;
        }
      }
      if (filters.relationships?.length) {
        const persona = String(invitation?.persona ?? invitation?.relationship ?? '').toLowerCase();
        if (!filters.relationships.some((value) => persona.includes(value))) {
          return false;
        }
      }
      if (filters.organisations?.length && invitation?.organisation) {
        if (!filters.organisations.includes(invitation.organisation)) {
          return false;
        }
      }
      if (filters.locations?.length && invitation?.location) {
        if (!filters.locations.includes(invitation.location)) {
          return false;
        }
      }
      if (filters.tags?.length && Array.isArray(invitation?.tags)) {
        if (!invitation.tags.some((tag) => filters.tags.includes(tag))) {
          return false;
        }
      }
      return true;
    });
  }, [derivedInvitations, activeTab, searchTerm, filters]);

  const metrics = useMemo(() => {
    const relevant = derivedInvitations.filter((invitation) => invitation.tab === 'received');
    const responded = relevant.filter((invitation) => ['accepted', 'declined'].includes(String(invitation?.status).toLowerCase()));
    const responseRate = relevant.length ? Math.round((responded.length / relevant.length) * 100) : 0;
    const pending = relevant.filter((invitation) => String(invitation?.status ?? '').toLowerCase() === 'pending').length;
    const responseNarrative = responseRate >= 60 ? 'Response pace matches high-performing teams' : 'Accelerate responses to meet SLAs';

    const responseTimes = relevant
      .map((invitation) => {
        if (!invitation?.respondedAt || !invitation?.createdAt) {
          return null;
        }
        const respondedAt = new Date(invitation.respondedAt);
        const createdAt = new Date(invitation.createdAt);
        if (Number.isNaN(respondedAt.getTime()) || Number.isNaN(createdAt.getTime())) {
          return null;
        }
        return respondedAt.getTime() - createdAt.getTime();
      })
      .filter((value) => Number.isFinite(value));

    const median = () => {
      if (!responseTimes.length) {
        return '—';
      }
      const sorted = [...responseTimes].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const ms = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      const hours = Math.round(ms / (1000 * 60 * 60));
      if (hours < 24) {
        return `${hours}h`;
      }
      const days = Math.round(hours / 24);
      return `${days}d`;
    };

    return {
      responseRate,
      responseNarrative,
      medianResponse: median(),
      medianNarrative: responseTimes.length ? 'Median time to reply' : 'Respond promptly to keep conversion high',
      pending,
      pendingNarrative: pending ? 'Prioritise follow-up on pending invitations' : 'All caught up — great pace',
    };
  }, [derivedInvitations]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).reduce((sum, entries) => sum + (entries?.length ?? 0), 0);
  }, [filters]);

  const handleToggleSelect = useCallback((invitation) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(invitation.id)) {
        next.delete(invitation.id);
      } else {
        next.add(invitation.id);
      }
      return next;
    });
  }, []);

  const selectedInvitations = useMemo(() => {
    return derivedInvitations.filter((invitation) => selectedIds.has(invitation.id));
  }, [derivedInvitations, selectedIds]);

  const handleBulk = useCallback(
    (action) => {
      if (!selectedInvitations.length) {
        return;
      }
      selectedInvitations.forEach((invitation) => {
        action({ ...invitation, note: notes[invitation.id] });
      });
      if (typeof onTrackEvent === 'function') {
        onTrackEvent('invitations.bulk_action', {
          count: selectedInvitations.length,
        });
      }
      setSelectedIds(new Set());
    },
    [notes, onTrackEvent, selectedInvitations],
  );

  const segments = useMemo(
    () => [
      {
        id: 'all-invitations',
        label: 'All invitations',
        filter: () => true,
      },
      {
        id: 'high-priority',
        label: 'Executive prospects',
        filter: (invitation) => (invitation?.priority ?? '').toLowerCase() === 'high' || (invitation?.persona ?? '').toLowerCase().includes('executive'),
      },
      {
        id: 'warm-introductions',
        label: 'Warm introductions',
        filter: (invitation) => (invitation?.introType ?? '').toLowerCase().includes('warm') || invitation?.mutualConnections >= 3,
      },
    ],
    [],
  );

  const filteredForSearchBar = useMemo(() => {
    return derivedInvitations.filter((invitation) => segments[0].filter(invitation));
  }, [derivedInvitations, segments]);

  return (
    <section className="space-y-6">
      <StatsStrip metrics={metrics} />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabPills activeTab={activeTab} onTabChange={setActiveTab} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {filteredInvitations.length} results
          </span>
        </div>

        <div className="mt-4">
          <PeopleSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search invitations by name, intent, or organisation"
            segments={segments.map((segment) => ({
              ...segment,
              count: filteredForSearchBar.filter((invitation) => segment.filter(invitation)).length,
            }))}
            activeSegmentId="all-invitations"
            onSegmentChange={() => {}}
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
            suggestions={derivedInvitations.map((invitation) => resolveConnectionName(invitation))}
            onSaveSegment={() => {}}
            onRemoveSegment={() => {}}
            metrics={{ totalMatches: filteredInvitations.length, activeFilters: activeFiltersCount }}
            isBusy={false}
            onVoiceSearch={null}
          />
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onAccept={() => handleBulk(onAccept)}
        onDecline={() => handleBulk(onDecline)}
        onMessage={() => handleBulk(onMessage)}
        onRemind={() => handleBulk(onRemind)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredInvitations.length ? (
          filteredInvitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              isSelected={selectedIds.has(invitation.id)}
              note={notes[invitation.id] ?? ''}
              onToggleSelect={handleToggleSelect}
              onAccept={(record) => {
                onAccept(record);
                if (typeof onTrackEvent === 'function') {
                  onTrackEvent('invitations.accepted', { id: record.id });
                }
              }}
              onDecline={(record) => {
                onDecline(record);
                if (typeof onTrackEvent === 'function') {
                  onTrackEvent('invitations.declined', { id: record.id });
                }
              }}
              onMessage={(record) => {
                const note = notes[record.id];
                onMessage({ ...record, note });
                if (typeof onTrackEvent === 'function') {
                  onTrackEvent('invitations.messaged', { id: record.id, hasNote: Boolean(note) });
                }
              }}
              onResend={(record) => {
                onRemind(record);
                if (typeof onTrackEvent === 'function') {
                  onTrackEvent('invitations.reminded', { id: record.id });
                }
              }}
              onNoteChange={(value) => {
                setNotes((current) => ({
                  ...current,
                  [invitation.id]: value,
                }));
              }}
            />
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Everything’s quiet here. Explore suggestions or send a few new invitations.
          </div>
        )}
      </div>
    </section>
  );
}

InvitationManager.propTypes = {
  invitations: PropTypes.arrayOf(PropTypes.object),
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
  onMessage: PropTypes.func,
  onRemind: PropTypes.func,
  onTrackEvent: PropTypes.func,
};

InvitationManager.defaultProps = {
  invitations: [],
  onAccept: () => {},
  onDecline: () => {},
  onMessage: () => {},
  onRemind: () => {},
  onTrackEvent: null,
};
