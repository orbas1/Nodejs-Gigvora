import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useEventManagementController from './useEventManagementController.js';
import EventSummaryBar from './EventSummaryBar.jsx';
import EventLibrary from './EventLibrary.jsx';
import EventWorkspace from './EventWorkspace.jsx';
import EventWizard from './EventWizard.jsx';
import EventTemplateGallery from './EventTemplateGallery.jsx';

function Notice({ tone = 'info', message, onDismiss }) {
  if (!message) return null;
  const palette = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    error: 'bg-rose-50 text-rose-800 border-rose-100',
    info: 'bg-sky-50 text-sky-800 border-sky-100',
  };
  const Icon = tone === 'error' ? ExclamationTriangleIcon : CheckCircleIcon;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-sm ${palette[tone] ?? palette.info}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="rounded-full p-1 text-current hover:bg-white/40">
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function ConfirmDialog({ open, title, message, actionLabel = 'Delete', busy, onConfirm, onClose }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                <p className="mt-2 text-sm text-slate-600">{message}</p>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={busy}
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {busy ? 'Working…' : actionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function EventManagementSection({ data, userId, onRefresh }) {
  const controller = useEventManagementController({ data, userId, onRefresh });
  const {
    overview,
    events,
    settings,
    templates,
    canManage,
    selectedEvent,
    selectEvent,
    wizardState,
    openCreateWizard,
    openEditWizard,
    closeWizard,
    saveEvent,
    requestDeleteEvent,
    confirmState,
    confirmAction,
    closeConfirm,
    busy,
    feedback,
    error,
    closeFeedback,
    closeError,
    mutateEvent,
    taskApi,
    guestApi,
    budgetApi,
    agendaApi,
    assetApi,
    checklistApi,
  } = controller;

  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const hasEvents = useMemo(() => events?.length > 0, [events]);
  const defaultWizardValues = useMemo(
    () => ({
      format: settings?.defaultFormat ?? 'in_person',
      visibility: settings?.defaultVisibility ?? 'invite_only',
      timezone: settings?.defaultTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: 'planned',
    }),
    [settings?.defaultFormat, settings?.defaultTimezone, settings?.defaultVisibility],
  );
  const eventMap = useMemo(() => {
    const map = new Map();
    (events ?? []).forEach((item) => {
      if (item?.id != null) {
        map.set(item.id, item);
      }
    });
    return map;
  }, [events]);

  useEffect(() => {
    if (workspaceOpen && !selectedEvent) {
      setWorkspaceOpen(false);
    }
  }, [selectedEvent, workspaceOpen]);

  const handleOpenWorkspace = (eventId) => {
    selectEvent(eventId);
    setWorkspaceOpen(true);
  };

  const handleEditEvent = (eventId) => {
    selectEvent(eventId);
    const target = eventMap.get(eventId);
    if (target) {
      openEditWizard(target);
    } else {
      openEditWizard();
    }
  };

  const handleDeleteEvent = (eventId) => {
    selectEvent(eventId);
    requestDeleteEvent();
  };

  const handleCreateEvent = () => {
    openCreateWizard();
  };

  const handleUseTemplate = (template) => {
    if (!template) return;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() + 7);
    start.setMinutes(0, 0, 0);
    const durationMinutes = Number(template.durationHours ?? 120);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const highlights = Array.isArray(template.highlights) ? template.highlights : [];
    const agenda = highlights.map((highlight, index) => {
      const slotStart = new Date(start.getTime() + index * 1800000);
      return {
        title: highlight,
        description: null,
        startAt: slotStart.toISOString(),
        endAt: new Date(slotStart.getTime() + 1800000).toISOString(),
        ownerName: null,
        ownerEmail: null,
        location: null,
        orderIndex: index,
      };
    });
    openCreateWizard({
      title: template.name,
      description: highlights.join('\n'),
      format: template.format ?? defaultWizardValues.format,
      visibility: defaultWizardValues.visibility,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      agenda,
      metadata: {
        templateId: template.id,
        techStack: template.techStack ?? [],
      },
    });
  };

  return (
    <section id="event-management" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Event workspace</h2>
        <p className="text-sm text-slate-500">Plan, publish, and run every moment from one place.</p>
      </header>
      <EventSummaryBar overview={overview} onCreate={canManage ? handleCreateEvent : undefined} canManage={canManage} />
      <EventTemplateGallery templates={templates} onUseTemplate={canManage ? handleUseTemplate : undefined} canManage={canManage} />
      {feedback ? <Notice tone={feedback.tone ?? 'success'} message={feedback.message} onDismiss={closeFeedback} /> : null}
      {error ? <Notice tone="error" message={error} onDismiss={closeError} /> : null}
      <EventLibrary
        events={events}
        selectedEventId={selectedEvent?.id ?? null}
        onSelect={selectEvent}
        onOpenWorkspace={handleOpenWorkspace}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onCreate={handleCreateEvent}
        canManage={canManage}
      />
      <EventWorkspace
        open={workspaceOpen && Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setWorkspaceOpen(false)}
        onEdit={openEditWizard}
        onDelete={requestDeleteEvent}
        mutateEvent={mutateEvent}
        taskApi={taskApi}
        guestApi={guestApi}
        budgetApi={budgetApi}
        agendaApi={agendaApi}
        assetApi={assetApi}
        checklistApi={checklistApi}
        canManage={canManage}
        workspaceSettings={settings}
      />
      <EventWizard
        open={wizardState.open}
        mode={wizardState.mode}
        initialValues={wizardState.initialValues}
        onClose={closeWizard}
        onSubmit={saveEvent}
        busy={busy}
        defaults={defaultWizardValues}
      />
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        actionLabel={confirmState.actionLabel}
        busy={busy}
        onConfirm={confirmAction}
        onClose={closeConfirm}
      />
      {!hasEvents && !canManage ? (
        <p className="text-sm text-slate-400">Events visible here once shared with you.</p>
      ) : null}
    </section>
  );
}

