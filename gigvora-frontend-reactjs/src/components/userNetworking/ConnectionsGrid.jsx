import { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import { resolveConnectionName, resolveSessionLabel } from './utils.js';
import PeopleSearchBar from './PeopleSearchBar.jsx';

const STORAGE_KEY = 'gigvora.networking.savedSegments';

const BASE_SEGMENTS = [
  {
    id: 'everyone',
    label: 'Everyone',
    filter: () => true,
  },
  {
    id: 'new-this-month',
    label: 'New this month',
    filter: (connection) => {
      if (!connection?.connectedAt) {
        return false;
      }
      const connected = new Date(connection.connectedAt);
      if (Number.isNaN(connected.getTime())) {
        return false;
      }
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      return connected >= thirtyDaysAgo;
    },
  },
  {
    id: 'dormant',
    label: 'Needs attention',
    filter: (connection) => {
      if (!connection?.lastContactedAt) {
        return true;
      }
      const last = new Date(connection.lastContactedAt);
      if (Number.isNaN(last.getTime())) {
        return true;
      }
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
      return last < sixtyDaysAgo;
    },
  },
  {
    id: 'advocates',
    label: 'Champions',
    filter: (connection) => {
      const strength = Number(connection?.engagementScore ?? connection?.strength ?? 0);
      const isReferrer = connection?.isChampion || (connection?.tags ?? []).includes('champion');
      return strength >= 80 || isReferrer;
    },
  },
];

const SORT_OPTIONS = [
  { id: 'recency', label: 'Most recent activity' },
  { id: 'strength', label: 'Relationship strength' },
  { id: 'mutual', label: 'Mutual connections' },
  { id: 'organisation', label: 'Organisation A→Z' },
];

const DENSITY_OPTIONS = [
  { id: 'cozy', label: 'Cozy' },
  { id: 'compact', label: 'Compact' },
];

function InsightCard({ title, value, trend, tone }) {
  return (
    <div
      className={classNames(
        'flex flex-col gap-2 rounded-3xl border bg-white p-4 shadow-sm transition',
        tone === 'positive' && 'border-emerald-200 shadow-emerald-100/60',
        tone === 'warning' && 'border-amber-200 shadow-amber-100/60',
        tone === 'neutral' && 'border-slate-200',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {trend ? <p className="text-xs text-slate-500">{trend}</p> : null}
    </div>
  );
}

InsightCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.string,
  tone: PropTypes.oneOf(['positive', 'warning', 'neutral']),
};

InsightCard.defaultProps = {
  trend: null,
  tone: 'neutral',
};

function ConnectionCard({
  connection,
  density,
  isSelected,
  onToggleSelect,
  onOpenProfile,
  onMessage,
  onInvite,
}) {
  const name = resolveConnectionName(connection);
  const headline = connection?.connectionHeadline ?? connection?.role ?? connection?.title ?? '';
  const company = connection?.connectionCompany ?? connection?.organisation ?? '';
  const mutualConnections = Number(connection?.mutualConnections ?? connection?.mutuals ?? 0);
  const lastContact = connection?.lastContactedAt ? formatRelativeTime(connection.lastContactedAt) : '—';
  const connectedAt = connection?.connectedAt ? formatRelativeTime(connection.connectedAt) : '—';
  const avatar = connection?.avatarUrl ?? connection?.photoUrl ?? null;
  const strength = Number(connection?.engagementScore ?? connection?.strength ?? 0);
  const badges = Array.isArray(connection?.tags) ? connection.tags.slice(0, 4) : [];
  const location = connection?.location ?? connection?.city ?? '';

  const baseClasses =
    density === 'compact'
      ? 'gap-3 p-4 lg:grid-cols-[auto,1fr] lg:gap-4'
      : 'gap-4 p-5 lg:grid-cols-[auto,1fr] lg:gap-6';

  return (
    <article className={classNames('grid rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg', baseClasses)}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <span className="absolute -left-3 -top-3">
            <input
              aria-label={`Select ${name}`}
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(connection)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
          </span>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
            {avatar ? <img src={avatar} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : name.charAt(0)}
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          {connection?.followStatus ? connection.followStatus.replace(/_/g, ' ') : 'contact'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{name}</h3>
              {headline ? <p className="text-sm text-slate-500">{headline}</p> : null}
              {company ? <p className="text-xs text-slate-400">{company}</p> : null}
            </div>
            {strength ? (
              <div className="flex flex-col items-end text-right">
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                  Strength {Math.min(Math.round(strength), 100)}%
                </span>
                {connection?.engagementTrend ? (
                  <span className="text-[11px] text-emerald-500">{connection.engagementTrend}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          {location ? <p className="text-xs text-slate-500">{location}</p> : null}
          {connection?.session ? (
            <p className="text-xs text-slate-500">
              Met via {resolveSessionLabel(connection.session, connection.sessionId)}
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500 md:grid-cols-4">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Last contact</dt>
            <dd>{lastContact}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Connected</dt>
            <dd>{connectedAt}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Mutuals</dt>
            <dd>{mutualConnections}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Engagement</dt>
            <dd>{connection?.engagementLevel ?? connection?.relationshipStage ?? '—'}</dd>
          </div>
        </dl>

        {badges.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full bg-slate-100 px-2 py-1 font-semibold">
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
            onClick={() => onOpenProfile(connection)}
          >
            Open profile
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            onClick={() => onMessage(connection)}
          >
            Message
          </button>
          <button
            type="button"
            className="rounded-full border border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
            onClick={() => onInvite(connection)}
          >
            Introduce
          </button>
        </div>
      </div>
    </article>
  );
}

ConnectionCard.propTypes = {
  connection: PropTypes.object.isRequired,
  density: PropTypes.oneOf(['cozy', 'compact']).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onOpenProfile: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
};

function BulkToolbar({ selectedCount, onClear, onExport, onMessageSelected, onInviteSelected }) {
  if (!selectedCount) {
    return null;
  }

  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm text-white shadow-xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{selectedCount} selected</span>
        <p className="text-xs text-white/80">Bulk actions keep outreach high-velocity while staying personal.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
          onClick={onMessageSelected}
        >
          Message selected
        </button>
        <button
          type="button"
          className="rounded-full border border-white/40 bg-transparent px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          onClick={onInviteSelected}
        >
          Introduce selected
        </button>
        <button
          type="button"
          className="rounded-full border border-white/40 bg-transparent px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          onClick={onExport}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="rounded-full border border-transparent bg-white/20 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/30"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

BulkToolbar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onClear: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onMessageSelected: PropTypes.func.isRequired,
  onInviteSelected: PropTypes.func.isRequired,
};

export default function ConnectionsGrid({
  connections,
  onOpenProfile,
  onMessage,
  onInvite,
  onExport,
  onTrackEvent,
  defaultSegment,
  defaultSort,
  suggestions,
}) {
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
  const [savedSegments, setSavedSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState(defaultSegment ?? 'everyone');
  const [sortOrder, setSortOrder] = useState(defaultSort ?? 'recency');
  const [density, setDensity] = useState('cozy');
  const [visibleCount, setVisibleCount] = useState(18);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedSegments(
            parsed.map((segment) => ({
              ...segment,
              isCustom: true,
            })),
          );
        }
      }
    } catch (error) {
      // Ignore storage errors silently; UX fallbacks handle gracefully.
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            savedSegments.map(({ id, label, definition }) => ({
              id,
              label,
              definition,
            })),
          ),
        );
      }
    } catch (error) {
      // Ignore storage write issues to avoid blocking UI.
    }
  }, [savedSegments]);

  useEffect(() => {
    setVisibleCount(18);
  }, [searchTerm, filters, activeSegment]);

  const baseSegments = useMemo(() => BASE_SEGMENTS, []);

  const segments = useMemo(
    () => [
      ...baseSegments,
      ...savedSegments.map((segment) => ({
        ...segment,
        filter: (connection) => {
          const { query, filters: definitionFilters } = segment.definition ?? {};
          let passesQuery = true;
          if (query) {
            const needle = query.toLowerCase();
            const haystack = [
              resolveConnectionName(connection),
              connection?.connectionCompany,
              connection?.connectionHeadline,
              connection?.location,
              ...(connection?.tags ?? []),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            passesQuery = haystack.includes(needle);
          }

          const passesFilters = (definitionFilters && typeof definitionFilters === 'object')
            ? Object.entries(definitionFilters).every(([key, values]) => {
                if (!values?.length) {
                  return true;
                }
                if (key === 'statuses') {
                  const status = connection?.followStatus ?? connection?.status ?? '';
                  return values.includes(String(status).toLowerCase());
                }
                if (key === 'relationships') {
                  const persona = connection?.persona ?? connection?.relationshipType ?? '';
                  return values.includes(String(persona).toLowerCase());
                }
                const connectionValues = Array.isArray(connection?.[key]) ? connection[key] : [connection?.[key]];
                return values.some((value) => connectionValues?.map((entry) => String(entry).toLowerCase()).includes(String(value).toLowerCase()));
              })
            : true;

          return passesQuery && passesFilters;
        },
      })),
    ],
    [baseSegments, savedSegments],
  );

  const activeSegmentDefinition = useMemo(
    () => segments.find((segment) => segment.id === activeSegment) ?? segments[0],
    [segments, activeSegment],
  );

  const filterOptions = useMemo(() => {
    const organisations = new Map();
    const industries = new Map();
    const locations = new Map();
    const tags = new Map();
    const seniority = new Map();

    connections.forEach((connection) => {
      if (connection?.connectionCompany) {
        organisations.set(connection.connectionCompany, { id: connection.connectionCompany, label: connection.connectionCompany });
      }
      if (Array.isArray(connection?.industries)) {
        connection.industries.forEach((industry) => {
          if (industry) {
            industries.set(industry, { id: industry, label: industry });
          }
        });
      }
      if (connection?.location) {
        locations.set(connection.location, { id: connection.location, label: connection.location });
      }
      if (Array.isArray(connection?.tags)) {
        connection.tags.forEach((tag) => {
          if (tag) {
            tags.set(tag, { id: tag, label: tag });
          }
        });
      }
      if (connection?.seniority) {
        seniority.set(connection.seniority, { id: connection.seniority, label: connection.seniority });
      }
    });

    return {
      organisations: Array.from(organisations.values()).slice(0, 30),
      industries: Array.from(industries.values()).slice(0, 30),
      locations: Array.from(locations.values()).slice(0, 30),
      tags: Array.from(tags.values()).slice(0, 30),
      seniority: Array.from(seniority.values()).slice(0, 30),
    };
  }, [connections]);

  const filteredConnections = useMemo(() => {
    const query = searchTerm?.toLowerCase() ?? '';

    return connections
      .filter((connection) => {
        if (!activeSegmentDefinition?.filter(connection)) {
          return false;
        }
        if (query) {
          const content = [
            resolveConnectionName(connection),
            connection?.connectionCompany,
            connection?.connectionHeadline,
            connection?.email,
            connection?.location,
            ...(connection?.tags ?? []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!content.includes(query)) {
            return false;
          }
        }

        if (filters.statuses?.length) {
          const status = String(connection?.followStatus ?? connection?.status ?? '').toLowerCase();
          if (!filters.statuses.some((value) => status.includes(value))) {
            return false;
          }
        }

        if (filters.relationships?.length) {
          const relationship = String(connection?.persona ?? connection?.relationshipType ?? '').toLowerCase();
          if (!filters.relationships.some((value) => relationship.includes(value))) {
            return false;
          }
        }

        const matchesGroup = (groupKey) => {
          const desiredValues = filters[groupKey];
          if (!desiredValues?.length) {
            return true;
          }
          const field = connection?.[groupKey];
          if (Array.isArray(field)) {
            return field.some((entry) => desiredValues.includes(String(entry)));
          }
          if (field) {
            return desiredValues.includes(String(field));
          }
          return false;
        };

        if (!matchesGroup('organisations')) {
          return false;
        }
        if (!matchesGroup('industries')) {
          return false;
        }
        if (!matchesGroup('locations')) {
          return false;
        }
        if (!matchesGroup('tags')) {
          return false;
        }
        if (!matchesGroup('seniority')) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'recency') {
          const aDate = new Date(a?.lastContactedAt ?? a?.connectedAt ?? 0).getTime();
          const bDate = new Date(b?.lastContactedAt ?? b?.connectedAt ?? 0).getTime();
          return bDate - aDate;
        }
        if (sortOrder === 'strength') {
          const aStrength = Number(a?.engagementScore ?? a?.strength ?? 0);
          const bStrength = Number(b?.engagementScore ?? b?.strength ?? 0);
          return bStrength - aStrength;
        }
        if (sortOrder === 'mutual') {
          const aMutual = Number(a?.mutualConnections ?? a?.mutuals ?? 0);
          const bMutual = Number(b?.mutualConnections ?? b?.mutuals ?? 0);
          return bMutual - aMutual;
        }
        if (sortOrder === 'organisation') {
          return String(a?.connectionCompany ?? '').localeCompare(String(b?.connectionCompany ?? ''));
        }
        return 0;
      });
  }, [connections, searchTerm, activeSegmentDefinition, filters, sortOrder]);

  const visibleConnections = filteredConnections.slice(0, visibleCount);
  const hasMore = visibleCount < filteredConnections.length;

  useEffect(() => {
    if (!hasMore) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((count) => count + 12);
          }
        });
      },
      {
        rootMargin: '200px',
      },
    );
    const sentinel = document.querySelector('[data-connections-grid-sentinel]');
    if (sentinel) {
      observer.observe(sentinel);
    }
    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  const metrics = useMemo(() => {
    const total = connections.length;
    const newThisMonth = connections.filter((connection) => BASE_SEGMENTS[1].filter(connection)).length;
    const dormant = connections.filter((connection) => BASE_SEGMENTS[2].filter(connection)).length;
    const avgStrength = connections.length
      ? Math.round(
          connections.reduce((sum, connection) => sum + Number(connection?.engagementScore ?? connection?.strength ?? 0), 0) /
            connections.length,
        )
      : 0;
    const responseRateNumerator = connections.filter((connection) => {
      const respondedAt = connection?.lastRespondedAt ?? connection?.lastContactedAt;
      if (!respondedAt) {
        return false;
      }
      const responded = new Date(respondedAt);
      if (Number.isNaN(responded.getTime())) {
        return false;
      }
      const now = new Date();
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      return responded >= sevenDaysAgo;
    }).length;
    const responseRate = total ? Math.round((responseRateNumerator / total) * 100) : 0;

    return {
      total,
      newThisMonth,
      dormant,
      avgStrength,
      responseRate,
    };
  }, [connections]);

  const handleTrack = useCallback(
    (eventName, payload) => {
      if (typeof onTrackEvent === 'function') {
        onTrackEvent(eventName, payload);
      }
    },
    [onTrackEvent],
  );

  const handleToggleSelect = useCallback(
    (connection) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(connection.id)) {
          next.delete(connection.id);
        } else {
          next.add(connection.id);
        }
        return next;
      });
    },
    [],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleExport = useCallback(() => {
    if (typeof onExport === 'function') {
      onExport(Array.from(selectedIds), filteredConnections);
      return;
    }
    const rows = filteredConnections.map((connection) => ({
      name: resolveConnectionName(connection),
      email: connection?.connectionEmail ?? '',
      company: connection?.connectionCompany ?? '',
      headline: connection?.connectionHeadline ?? '',
      lastContactedAt: connection?.lastContactedAt ?? '',
      connectedAt: connection?.connectedAt ?? '',
      mutualConnections: connection?.mutualConnections ?? connection?.mutuals ?? '',
    }));

    const header = Object.keys(rows[0] ?? {});
    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? '')).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'connections.csv');
    link.click();
  }, [filteredConnections, onExport, selectedIds]);

  const handleVoiceSearch = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceUnavailable(true);
      setTimeout(() => setVoiceUnavailable(false), 3000);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setSearchTerm(transcript);
        handleTrack('connections.voice_search', { transcript });
      }
    };
  }, [handleTrack]);

  useEffect(() => {
    setIsSyncing(true);
    const timeout = setTimeout(() => setIsSyncing(false), 220);
    return () => clearTimeout(timeout);
  }, [searchTerm, filters, activeSegment, sortOrder]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).reduce((sum, entries) => sum + (entries?.length ?? 0), 0);
  }, [filters]);

  const selectedConnections = useMemo(() => {
    return filteredConnections.filter((connection) => selectedIds.has(connection.id));
  }, [filteredConnections, selectedIds]);

  const handleSegmentChange = useCallback(
    (segment) => {
      setActiveSegment(segment.id);
      handleTrack('connections.segment_changed', { segment: segment.id });
    },
    [handleTrack],
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          title="Total relationships"
          value={metrics.total}
          trend={`${metrics.newThisMonth} added this month`}
          tone="neutral"
        />
        <InsightCard
          title="Engagement strength"
          value={`${metrics.avgStrength}%`}
          trend={metrics.avgStrength > 75 ? 'Great momentum — keep the cadence' : 'Add touchpoints to boost momentum'}
          tone={metrics.avgStrength > 75 ? 'positive' : 'warning'}
        />
        <InsightCard
          title="Response rate"
          value={`${metrics.responseRate}%`}
          trend={metrics.responseRate >= 60 ? 'On par with top networks' : 'Nudge dormant contacts'}
          tone={metrics.responseRate >= 60 ? 'positive' : 'warning'}
        />
        <InsightCard
          title="Dormant"
          value={metrics.dormant}
          trend="Schedule follow-ups to revive"
          tone="warning"
        />
      </div>

      <PeopleSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by name, organisation, tags, or moments"
        segments={segments.map((segment) => ({
          id: segment.id,
          label: segment.label,
          count: filteredConnections.filter((connection) => segment.filter(connection)).length,
          isCustom: Boolean(segment.isCustom),
        }))}
        activeSegmentId={activeSegmentDefinition?.id}
        onSegmentChange={handleSegmentChange}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        suggestions={suggestions}
        onSaveSegment={(segment) => {
          setSavedSegments((current) => {
            if (current.find((entry) => entry.id === segment.id)) {
              return current;
            }
            handleTrack('connections.segment_saved', { id: segment.id });
            return [
              ...current,
              {
                ...segment,
                isCustom: true,
              },
            ];
          });
        }}
        onRemoveSegment={(segment) => {
          setSavedSegments((current) => current.filter((entry) => entry.id !== segment.id));
          if (activeSegment === segment.id) {
            setActiveSegment('everyone');
          }
          handleTrack('connections.segment_removed', { id: segment.id });
        }}
        metrics={{ totalMatches: filteredConnections.length, activeFilters: activeFiltersCount }}
        isBusy={isSyncing}
        onVoiceSearch={handleVoiceSearch}
      />

      {voiceUnavailable ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          Voice search isn’t supported in this browser. Use the keyboard shortcuts instead.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="uppercase tracking-wide">Sort</span>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={classNames(
                'rounded-full px-3 py-1 transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                sortOrder === option.id
                  ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-200'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
              )}
              onClick={() => setSortOrder(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span className="uppercase tracking-wide">Density</span>
          {DENSITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={classNames(
                'rounded-full px-3 py-1 transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                density === option.id
                  ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-200'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
              )}
              onClick={() => setDensity(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <BulkToolbar
        selectedCount={selectedIds.size}
        onClear={handleClearSelection}
        onExport={handleExport}
        onMessageSelected={() => {
          handleTrack('connections.bulk_message', { ids: Array.from(selectedIds) });
          selectedConnections.forEach((connection) => onMessage(connection));
        }}
        onInviteSelected={() => {
          handleTrack('connections.bulk_invite', { ids: Array.from(selectedIds) });
          selectedConnections.forEach((connection) => onInvite(connection));
        }}
      />

      <div className={classNames('grid gap-4', density === 'compact' ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2')}
      >
        {visibleConnections.length ? (
          visibleConnections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              density={density}
              isSelected={selectedIds.has(connection.id)}
              onToggleSelect={handleToggleSelect}
              onOpenProfile={(record) => {
                handleTrack('connections.open_profile', { id: record.id });
                onOpenProfile(record);
              }}
              onMessage={(record) => {
                handleTrack('connections.message', { id: record.id });
                onMessage(record);
              }}
              onInvite={(record) => {
                handleTrack('connections.introduce', { id: record.id });
                onInvite(record);
              }}
            />
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
            No connections match your filters yet. Refresh filters or explore new people to grow your network.
          </div>
        )}
      </div>

      <div data-connections-grid-sentinel />

      {hasMore ? (
        <div className="flex justify-center">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
            Loading more relationships…
          </span>
        </div>
      ) : null}
    </section>
  );
}

ConnectionsGrid.propTypes = {
  connections: PropTypes.arrayOf(PropTypes.object),
  onOpenProfile: PropTypes.func,
  onMessage: PropTypes.func,
  onInvite: PropTypes.func,
  onExport: PropTypes.func,
  onTrackEvent: PropTypes.func,
  defaultSegment: PropTypes.string,
  defaultSort: PropTypes.string,
  suggestions: PropTypes.arrayOf(PropTypes.string),
};

ConnectionsGrid.defaultProps = {
  connections: [],
  onOpenProfile: () => {},
  onMessage: () => {},
  onInvite: () => {},
  onExport: null,
  onTrackEvent: null,
  defaultSegment: 'everyone',
  defaultSort: 'recency',
  suggestions: [],
};
