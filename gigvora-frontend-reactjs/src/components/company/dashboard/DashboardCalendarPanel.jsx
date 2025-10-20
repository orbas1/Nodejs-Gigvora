import { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import CalendarSummary from '../../company/calendar/CalendarSummary.jsx';
import CalendarUpcomingGrid from '../../company/calendar/CalendarUpcomingGrid.jsx';
import CalendarEventDrawer from '../../company/calendar/CalendarEventDrawer.jsx';
import CalendarEventForm from '../../company/calendar/CalendarEventForm.jsx';
import CalendarEventList from '../../company/calendar/CalendarEventList.jsx';
import CalendarEventDetails from '../../company/calendar/CalendarEventDetails.jsx';
import CalendarAutomationPanel from '../../company/calendar/CalendarAutomationPanel.jsx';
import useCompanyCalendar from '../../../hooks/useCompanyCalendar.js';
import {
  createCompanyCalendarEvent,
  updateCompanyCalendarEvent,
  deleteCompanyCalendarEvent,
} from '../../../services/companyCalendar.js';
import DataStatus from '../../DataStatus.jsx';

const EVENT_SECTIONS = [
  { key: 'project', label: 'Projects' },
  { key: 'interview', label: 'Interviews' },
  { key: 'gig', label: 'Gigs' },
  { key: 'mentorship', label: 'Mentorship' },
  { key: 'volunteering', label: 'Volunteering' },
];

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-600">
      <p>No calendar activity yet. Start by logging an interview panel, project milestone, or mentoring session.</p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Create event
        </button>
      ) : null}
    </div>
  );
}

export default function DashboardCalendarPanel({ workspaceId, workspaceSlug }) {
  const numericWorkspaceId = workspaceId ? Number(workspaceId) : null;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [draftType, setDraftType] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState(null);

  const calendar = useCompanyCalendar({ workspaceId: numericWorkspaceId, enabled: Boolean(numericWorkspaceId) });

  useEffect(() => {
    if (!numericWorkspaceId && calendar.availableWorkspaces?.length) {
      const firstWorkspace = calendar.availableWorkspaces[0];
      if (firstWorkspace?.id) {
        calendar.refresh?.({ force: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericWorkspaceId, calendar.availableWorkspaces]);

  const upcomingByType = calendar.summary?.upcomingByType ?? {};
  const automationState = calendar.summary?.automation ?? null;
  const metadataByType = useMemo(() => {
    const totals = calendar.summary?.totalsByType ?? {};
    return Object.fromEntries(EVENT_SECTIONS.map((section) => [section.key, { total: totals?.[section.key] ?? 0 }]));
  }, [calendar.summary?.totalsByType]);

  const eventsByType = calendar.eventsByType ?? {};

  const handleCreateClick = (eventType) => {
    setDraftType(eventType ?? null);
    setEditingEvent(null);
    setDrawerOpen(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setDraftType(event?.eventType ?? null);
    setDrawerOpen(true);
  };

  const handleSelectEvent = (event) => {
    setViewingEvent(event);
    setDetailOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingEvent(null);
    setDraftType(null);
  };

  const handleSubmit = async ({ payload }) => {
    if (!numericWorkspaceId) {
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const body = {
        ...payload,
        workspaceId: numericWorkspaceId,
        workspaceSlug,
      };
      if (editingEvent?.id) {
        await updateCompanyCalendarEvent(editingEvent.id, body);
      } else {
        await createCompanyCalendarEvent(body);
      }
      setStatus({ type: 'success', message: editingEvent ? 'Event updated.' : 'Event created.' });
      closeDrawer();
      await calendar.refresh?.({ force: true });
    } catch (error) {
      const message = error?.body?.message ?? error?.message ?? 'Unable to save calendar event.';
      setStatus({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!event?.id) {
      return;
    }
    setDeleting(true);
    setStatus(null);
    try {
      await deleteCompanyCalendarEvent(event.id);
      setStatus({ type: 'success', message: 'Event removed.' });
      setDetailOpen(false);
      setViewingEvent(null);
      await calendar.refresh?.({ force: true });
    } catch (error) {
      const message = error?.body?.message ?? error?.message ?? 'Unable to delete event.';
      setStatus({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  };

  const combinedStatus = status ?? (calendar.error ? { type: 'error', message: calendar.error.message } : null);

  return (
    <div className="space-y-6">
      {combinedStatus ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            combinedStatus.type === 'error'
              ? 'bg-rose-50 text-rose-700'
              : combinedStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {combinedStatus.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Calendar &amp; scheduling</h3>
          <p className="text-sm text-slate-600">
            Coordinate interviews, project checkpoints, volunteering, and mentoring in one command center.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => handleCreateClick(section.key)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <PlusIcon className="h-4 w-4" />
              New {section.label.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <DataStatus
        loading={calendar.loading}
        error={calendar.error}
        empty={!calendar.loading && !calendar.data}
        className="rounded-3xl border border-slate-200 bg-white p-6"
      >
        {calendar.summary ? (
          <CalendarSummary summary={calendar.summary} onCreate={() => handleCreateClick(null)} />
        ) : null}

        {calendar.summary?.upcomingByType ? (
          <div className="mt-6">
            <CalendarUpcomingGrid
              upcomingByType={upcomingByType}
              metadataByType={metadataByType}
              onSelect={handleSelectEvent}
              onCreate={handleCreateClick}
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {EVENT_SECTIONS.map((section) => {
            const events = eventsByType?.[section.key] ?? [];
            return (
              <div key={section.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-900">{section.label}</h4>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {events.length} scheduled
                  </span>
                </div>
                {events.length ? (
                  <CalendarEventList
                    events={events.slice(0, 5)}
                    accent="border-slate-200"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSelect={handleSelectEvent}
                  />
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    No {section.label.toLowerCase()} logged. Create one to align stakeholders.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <CalendarAutomationPanel state={automationState} onConfigure={() => handleCreateClick(null)} />
        </div>
      </DataStatus>

      {!calendar.loading && !calendar.summary?.totalEvents ? (
        <EmptyState onCreate={() => handleCreateClick(null)} />
      ) : null}

      <CalendarEventDrawer open={drawerOpen} onClose={closeDrawer} title={editingEvent ? 'Edit event' : 'Create event'}>
        <CalendarEventForm
          event={editingEvent}
          eventType={draftType}
          onSubmit={handleSubmit}
          onCancel={closeDrawer}
          submitting={saving}
          workspaceId={numericWorkspaceId}
        />
      </CalendarEventDrawer>

      <CalendarEventDetails
        event={viewingEvent}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {
          setDetailOpen(false);
          if (viewingEvent) {
            handleEdit(viewingEvent);
          }
        }}
        onDelete={() => viewingEvent && handleDelete(viewingEvent)}
        deleting={deleting}
      />
    </div>
  );
}

DashboardCalendarPanel.defaultProps = {
  workspaceId: null,
  workspaceSlug: null,
};

