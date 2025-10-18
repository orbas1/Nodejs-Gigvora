import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  AcademicCapIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import CalendarSummary from '../../components/company/calendar/CalendarSummary.jsx';
import CalendarUpcomingGrid from '../../components/company/calendar/CalendarUpcomingGrid.jsx';
import CalendarEventDrawer from '../../components/company/calendar/CalendarEventDrawer.jsx';
import CalendarEventForm from '../../components/company/calendar/CalendarEventForm.jsx';
import CalendarEventList from '../../components/company/calendar/CalendarEventList.jsx';
import CalendarAutomationPanel from '../../components/company/calendar/CalendarAutomationPanel.jsx';
import CalendarEventDetails from '../../components/company/calendar/CalendarEventDetails.jsx';
import useCompanyCalendar from '../../hooks/useCompanyCalendar.js';
import {
  createCompanyCalendarEvent,
  updateCompanyCalendarEvent,
  deleteCompanyCalendarEvent,
} from '../../services/companyCalendar.js';

const EVENT_TYPE_METADATA = {
  project: {
    label: 'Projects',
    panelId: 'projects',
    accent: 'border-sky-100 bg-sky-50/70',
    icon: BriefcaseIcon,
  },
  interview: {
    label: 'Interviews',
    panelId: 'interviews',
    accent: 'border-indigo-100 bg-indigo-50/70',
    icon: ChatBubbleLeftRightIcon,
  },
  gig: {
    label: 'Gigs',
    panelId: 'gigs',
    accent: 'border-emerald-100 bg-emerald-50/70',
    icon: SparklesIcon,
  },
  mentorship: {
    label: 'Mentors',
    panelId: 'mentors',
    accent: 'border-violet-100 bg-violet-50/70',
    icon: AcademicCapIcon,
  },
  volunteering: {
    label: 'Volunteer',
    panelId: 'volunteer',
    accent: 'border-amber-100 bg-amber-50/70',
    icon: HeartIcon,
  },
};

const PANEL_DEFINITIONS = [
  { id: 'overview', label: 'Overview', sectionId: 'calendar-overview' },
  ...Object.entries(EVENT_TYPE_METADATA).map(([eventType, meta]) => ({
    id: meta.panelId,
    label: meta.label,
    sectionId: `calendar-${eventType}`,
    eventType,
  })),
  { id: 'automation', label: 'Automate', sectionId: 'calendar-automation' },
];

const PANEL_LOOKUP = new Map(PANEL_DEFINITIONS.map((panel) => [panel.id, panel]));

const MENU_SECTIONS = [
  {
    label: 'Calendar',
    items: PANEL_DEFINITIONS.map((panel) => ({
      id: panel.id,
      name: panel.label,
      sectionId: panel.sectionId,
    })),
  },
];

function normalizeFilterState(filters) {
  return {
    from: filters?.from ?? null,
    to: filters?.to ?? null,
    types: Array.isArray(filters?.types) ? filters.types.filter(Boolean) : [],
    search: filters?.search ?? '',
  };
}

function areFiltersEqual(a, b) {
  const current = normalizeFilterState(a ?? {});
  const next = normalizeFilterState(b ?? {});
  const sortTypes = (types) => [...types].sort();
  const currentTypes = sortTypes(current.types);
  const nextTypes = sortTypes(next.types);

  return (
    (current.from ?? null) === (next.from ?? null) &&
    (current.to ?? null) === (next.to ?? null) &&
    (current.search ?? '') === (next.search ?? '') &&
    currentTypes.length === nextTypes.length &&
    currentTypes.every((value, index) => value === nextTypes[index])
  );
}

function normaliseWorkspaceId(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : null;
}

export default function CompanyCalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const [workspaceId, setWorkspaceId] = useState(normaliseWorkspaceId(workspaceIdParam));
  const numericWorkspaceId = workspaceId ? Number(workspaceId) : null;
  const [filters, setFilters] = useState({ from: null, to: null, types: [], search: '' });
  const [filtersInitialised, setFiltersInitialised] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [draftEventType, setDraftEventType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activePanelId, setActivePanelId] = useState('overview');
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);

  const calendar = useCompanyCalendar({ workspaceId: numericWorkspaceId, filters, enabled: Boolean(numericWorkspaceId) });

  useEffect(() => {
    if (!workspaceId && calendar.availableWorkspaces?.length) {
      const nextWorkspaceId = String(calendar.availableWorkspaces[0].id);
      setWorkspaceId(nextWorkspaceId);
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', nextWorkspaceId);
        return next;
      });
    }
  }, [workspaceId, calendar.availableWorkspaces, setSearchParams]);

  useEffect(() => {
    if (workspaceIdParam && workspaceIdParam !== workspaceId) {
      setWorkspaceId(normaliseWorkspaceId(workspaceIdParam));
    }
  }, [workspaceIdParam, workspaceId]);

  useEffect(() => {
    setFilters({ from: null, to: null, types: [], search: '' });
    setFiltersInitialised(false);
  }, [workspaceId]);

  const serverFilters = calendar.data?.filters;

  useEffect(() => {
    if (filtersInitialised) {
      return;
    }

    if (serverFilters) {
      const nextFilters = normalizeFilterState(serverFilters);
      setFilters((previous) => {
        if (areFiltersEqual(previous, nextFilters)) {
          return previous;
        }
        return nextFilters;
      });
      const firstType = nextFilters.types?.[0];
      if (firstType && EVENT_TYPE_METADATA[firstType]) {
        const nextPanelId = EVENT_TYPE_METADATA[firstType].panelId;
        setActivePanelId(nextPanelId);
        setActiveMenuItem(nextPanelId);
      }
      setFiltersInitialised(true);
      return;
    }

    if (!calendar.loading && (calendar.error || !calendar.data)) {
      setFiltersInitialised(true);
    }
  }, [serverFilters, filtersInitialised, calendar.loading, calendar.error, calendar.data]);

  useEffect(() => {
    if (!filtersInitialised) {
      return;
    }
    const types = filters.types ?? [];
    if (!types.length && activePanelId !== 'overview') {
      setActivePanelId('overview');
      setActiveMenuItem('overview');
      return;
    }
    const firstType = types[0];
    if (firstType && EVENT_TYPE_METADATA[firstType]) {
      const panelId = EVENT_TYPE_METADATA[firstType].panelId;
      if (panelId !== activePanelId) {
        setActivePanelId(panelId);
        setActiveMenuItem(panelId);
      }
    }
  }, [filters, filtersInitialised, activePanelId]);

  const eventTypeOptions = useMemo(
    () =>
      Object.entries(EVENT_TYPE_METADATA).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    [],
  );

  const activePanel = PANEL_LOOKUP.get(activePanelId) ?? PANEL_DEFINITIONS[0];
  const workspaceOptions = calendar.availableWorkspaces ?? [];

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    setWorkspaceId(nextWorkspaceId || null);
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextWorkspaceId) {
        next.set('workspaceId', nextWorkspaceId);
      } else {
        next.delete('workspaceId');
      }
      return next;
    });
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSearchChange = (event) => {
    setFilters((prev) => ({ ...prev, search: event.target.value }));
  };

  const applyPanelFilters = (panel) => {
    if (panel?.eventType) {
      setFilters((prev) => {
        const current = prev.types ?? [];
        if (current.length === 1 && current[0] === panel.eventType) {
          return prev;
        }
        return { ...prev, types: [panel.eventType] };
      });
    } else {
      setFilters((prev) => {
        if (!prev.types?.length) {
          return prev;
        }
        return { ...prev, types: [] };
      });
    }
  };

  const handlePanelSelect = (panelId) => {
    const panel = PANEL_LOOKUP.get(panelId) ?? PANEL_DEFINITIONS[0];
    setActivePanelId(panel.id);
    setActiveMenuItem(panel.id);
    applyPanelFilters(panel);
  };

  const handleCreate = (eventType) => {
    const fallbackType =
      eventType ??
      draftEventType ??
      activePanel.eventType ??
      eventTypeOptions[0]?.value ??
      'project';
    setDraftEventType(fallbackType);
    setEditingEvent(null);
    setDrawerOpen(true);
  };

  const handleEdit = (event) => {
    setDraftEventType(null);
    setEditingEvent(event);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (saving) {
      return;
    }
    setDrawerOpen(false);
    setEditingEvent(null);
    setDraftEventType(null);
  };

  const handleSubmitEvent = async (payload) => {
    if (!numericWorkspaceId) {
      throw new Error('Select a workspace to save events.');
    }
    setSaving(true);
    try {
      if (editingEvent) {
        await updateCompanyCalendarEvent(editingEvent.id, payload);
      } else {
        await createCompanyCalendarEvent({ workspaceId: numericWorkspaceId, ...payload });
      }
      await calendar.refresh?.({ force: true });
      setDrawerOpen(false);
      setEditingEvent(null);
      setDraftEventType(null);
    } catch (error) {
      console.error('Unable to save calendar event', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!event?.id) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Remove this event?')) {
      return;
    }
    try {
      await deleteCompanyCalendarEvent(event.id);
      if (viewingEvent?.id === event.id) {
        setDetailOpen(false);
        setViewingEvent(null);
      }
      await calendar.refresh?.({ force: true });
    } catch (error) {
      console.error('Unable to delete calendar event', error);
    }
  };

  const handlePreview = (event) => {
    setViewingEvent(event);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setViewingEvent(null);
  };

  const automationState = useMemo(
    () => ({
      digest: {
        enabled: true,
        frequency: 'week',
      },
      slack: {
        enabled: true,
        channel: '#hiring-updates',
      },
    }),
    [],
  );

  const activeEvents = activePanel.eventType ? calendar.eventsByType?.[activePanel.eventType] ?? [] : [];

  const defaultEventType = draftEventType ?? activePanel.eventType ?? eventTypeOptions[0]?.value;
  const ActiveTypeIcon = activePanel.eventType ? EVENT_TYPE_METADATA[activePanel.eventType]?.icon : null;
  const activeAccent = activePanel.eventType ? EVENT_TYPE_METADATA[activePanel.eventType]?.accent : null;

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Calendar"
      subtitle="All key dates in one place"
      menuSections={MENU_SECTIONS}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={(itemId) => handlePanelSelect(itemId)}
    >
      <div className="space-y-8">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700" htmlFor="workspace-select">
              Workspace
              <select
                id="workspace-select"
                value={workspaceId ?? ''}
                onChange={handleWorkspaceChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Choose…</option>
                {workspaceOptions.map((workspaceOption) => (
                  <option key={workspaceOption.id} value={workspaceOption.id}>
                    {workspaceOption.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              From
              <input
                type="date"
                name="from"
                value={filters.from ? filters.from.slice(0, 10) : ''}
                onChange={handleDateChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              To
              <input
                type="date"
                name="to"
                value={filters.to ? filters.to.slice(0, 10) : ''}
                onChange={handleDateChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Search
              <input
                type="search"
                value={filters.search ?? ''}
                onChange={handleSearchChange}
                placeholder="Find events"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <DataStatus
            loading={calendar.loading}
            fromCache={calendar.fromCache}
            lastUpdated={calendar.lastUpdated}
            onRefresh={() => calendar.refresh?.({ force: true })}
            error={calendar.error}
            statusLabel="Sync"
          />
        </section>

        <section className="flex flex-wrap gap-2">
          {PANEL_DEFINITIONS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => handlePanelSelect(panel.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activePanelId === panel.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {panel.label}
            </button>
          ))}
        </section>

        {activePanel.id === 'overview' ? (
          <div className="space-y-8">
            <CalendarSummary summary={calendar.summary} onCreate={() => handleCreate()} />
            <CalendarUpcomingGrid
              upcomingByType={calendar.summary?.upcomingByType}
              metadataByType={EVENT_TYPE_METADATA}
              onSelect={handlePreview}
              onCreate={(type) => handleCreate(type)}
            />
          </div>
        ) : null}

        {activePanel.eventType ? (
          <section id={`calendar-${activePanel.eventType}`} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="rounded-full bg-slate-100 p-2 text-slate-600">
                  {ActiveTypeIcon ? <ActiveTypeIcon className="h-5 w-5" /> : null}
                </span>
                <h2 className="text-xl font-semibold text-slate-900">{activePanel.label}</h2>
              </div>
              <button
                type="button"
                onClick={() => handleCreate(activePanel.eventType)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                New
              </button>
            </div>
            <CalendarEventList
              events={activeEvents}
              accent={activeAccent}
              onEdit={handleEdit}
              onDelete={handleDeleteEvent}
              onSelect={handlePreview}
            />
          </section>
        ) : null}

        {activePanel.id === 'automation' ? (
          <CalendarAutomationPanel
            state={automationState}
            onConfigure={(key) => {
              if (key === 'digest' || key === 'slack') {
                handleCreate();
              }
            }}
          />
        ) : null}
      </div>

      <CalendarEventDrawer
        open={detailOpen}
        onClose={closeDetail}
        title={viewingEvent?.title ?? 'Event'}
      >
        <CalendarEventDetails event={viewingEvent} onEdit={(event) => { closeDetail(); handleEdit(event); }} onDelete={handleDeleteEvent} />
      </CalendarEventDrawer>

      <CalendarEventDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={editingEvent ? 'Edit event' : 'New event'}
      >
        <CalendarEventForm
          initialValues={editingEvent ?? { eventType: defaultEventType }}
          eventTypeOptions={eventTypeOptions}
          onSubmit={handleSubmitEvent}
          onCancel={handleCloseDrawer}
          busy={saving}
        />
      </CalendarEventDrawer>
    </DashboardLayout>
  );
}
