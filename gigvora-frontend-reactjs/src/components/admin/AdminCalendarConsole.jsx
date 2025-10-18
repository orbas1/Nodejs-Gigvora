import { useMemo, useState } from 'react';
import useAdminCalendarConsole from '../../hooks/useAdminCalendarConsole.js';
import CalendarConsoleLayout from './calendar/CalendarConsoleLayout.jsx';
import CalendarOverviewPanel from './calendar/CalendarOverviewPanel.jsx';
import CalendarAccountsPanel from './calendar/CalendarAccountsPanel.jsx';
import CalendarAvailabilityPanel from './calendar/CalendarAvailabilityPanel.jsx';
import CalendarTemplatesPanel from './calendar/CalendarTemplatesPanel.jsx';
import CalendarEventsPanel from './calendar/CalendarEventsPanel.jsx';
import CalendarDrawer from './calendar/CalendarDrawer.jsx';
import CalendarAccountForm from './calendar/CalendarAccountForm.jsx';
import CalendarAvailabilityForm from './calendar/CalendarAvailabilityForm.jsx';
import CalendarTemplateForm from './calendar/CalendarTemplateForm.jsx';
import CalendarEventForm from './calendar/CalendarEventForm.jsx';
import CalendarEventPreview from './calendar/CalendarEventPreview.jsx';

const PANELS = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'slots', label: 'Slots' },
  { id: 'types', label: 'Types' },
  { id: 'events', label: 'Events' },
];

const INITIAL_DRAWER = Object.freeze({ type: null, mode: 'create', data: null });

export default function AdminCalendarConsole({ variant = 'dashboard' }) {
  const [panel, setPanel] = useState('overview');
  const [drawer, setDrawer] = useState(INITIAL_DRAWER);
  const {
    loading,
    busy,
    error,
    setError,
    message,
    setMessage,
    metrics,
    accounts,
    templates,
    events,
    availabilityByAccount,
    refresh,
    actions,
  } = useAdminCalendarConsole();

  const availabilityLookup = useMemo(() => availabilityByAccount ?? {}, [availabilityByAccount]);

  const openDrawer = (nextState) => {
    setDrawer({ ...INITIAL_DRAWER, ...nextState, open: true });
  };

  const closeDrawer = () => {
    setDrawer(INITIAL_DRAWER);
  };

  const handleCreateAccount = () => openDrawer({ type: 'account', mode: 'create' });
  const handleEditAccount = (account) => openDrawer({ type: 'account', mode: 'edit', data: account });
  const handleManageSlots = (account) => {
    const availability = availabilityLookup[account.id] || availabilityLookup[String(account.id)] || {};
    openDrawer({ type: 'slots', mode: 'edit', data: { account, availability } });
    setPanel('slots');
  };

  const handleQuickSlots = () => {
    if (accounts.length === 1) {
      handleManageSlots(accounts[0]);
      return;
    }
    setPanel('slots');
  };

  const handleCreateTemplate = () => openDrawer({ type: 'template', mode: 'create' });
  const handleEditTemplate = (template) => openDrawer({ type: 'template', mode: 'edit', data: template });

  const handleCreateEvent = () => openDrawer({ type: 'event', mode: 'create' });
  const handleEditEvent = (eventRecord) => openDrawer({ type: 'event', mode: 'edit', data: eventRecord });
  const handlePreviewEvent = (eventRecord) => openDrawer({ type: 'eventPreview', mode: 'view', data: eventRecord });

  const executeWithFeedback = async (operation, successMessage) => {
    try {
      await operation();
      if (successMessage) {
        setMessage(successMessage);
      }
      closeDrawer();
    } catch (err) {
      setError(err?.message ?? 'Action failed.');
    }
  };

  const handleSaveAccount = (payload) => {
    const accountId = drawer.mode === 'edit' ? drawer.data?.id : undefined;
    return executeWithFeedback(
      async () => {
        await actions.saveAccount(accountId, payload);
      },
      accountId ? 'Account updated.' : 'Account connected.',
    );
  };

  const handleRemoveAccount = async (account) => {
    if (!account?.id) return;
    const confirmed = window.confirm('Remove this calendar account?');
    if (!confirmed) return;
    try {
      await actions.removeAccount(account.id);
      setMessage('Account removed.');
    } catch (err) {
      setError(err?.message ?? 'Unable to remove account.');
    }
  };

  const handleSaveAvailability = (payload) => {
    const accountId = drawer.data?.account?.id;
    if (!accountId) {
      return;
    }
    return executeWithFeedback(
      async () => {
        await actions.saveAvailability(accountId, payload);
      },
      'Slots updated.',
    );
  };

  const handleSaveTemplate = (payload) => {
    const templateId = drawer.mode === 'edit' ? drawer.data?.id : undefined;
    return executeWithFeedback(
      async () => {
        await actions.saveTemplate(templateId, payload);
      },
      templateId ? 'Type updated.' : 'Type created.',
    );
  };

  const handleRemoveTemplate = async (template) => {
    if (!template?.id) return;
    const confirmed = window.confirm('Remove this template?');
    if (!confirmed) return;
    try {
      await actions.removeTemplate(template.id);
      setMessage('Type removed.');
    } catch (err) {
      setError(err?.message ?? 'Unable to remove type.');
    }
  };

  const handleSaveEvent = (payload) => {
    const eventId = drawer.mode === 'edit' ? drawer.data?.id : undefined;
    return executeWithFeedback(
      async () => {
        await actions.saveEvent(eventId, payload);
      },
      eventId ? 'Event updated.' : 'Event scheduled.',
    );
  };

  const handleRemoveEvent = async (eventRecord) => {
    if (!eventRecord?.id) return;
    const confirmed = window.confirm('Cancel this event?');
    if (!confirmed) return;
    try {
      await actions.removeEvent(eventRecord.id);
      setMessage('Event removed.');
    } catch (err) {
      setError(err?.message ?? 'Unable to remove event.');
    }
  };

  const panelContent = useMemo(() => {
    switch (panel) {
      case 'accounts':
        return (
          <CalendarAccountsPanel
            accounts={accounts}
            onCreate={handleCreateAccount}
            onEdit={handleEditAccount}
            onDelete={handleRemoveAccount}
            onManageSlots={handleManageSlots}
          />
        );
      case 'slots':
        return (
          <CalendarAvailabilityPanel
            accounts={accounts}
            availabilityByAccount={availabilityLookup}
            onEdit={handleManageSlots}
          />
        );
      case 'types':
        return (
          <CalendarTemplatesPanel
            templates={templates}
            onCreate={handleCreateTemplate}
            onEdit={handleEditTemplate}
            onDelete={handleRemoveTemplate}
          />
        );
      case 'events':
        return (
          <CalendarEventsPanel
            events={events}
            onCreate={handleCreateEvent}
            onEdit={handleEditEvent}
            onDelete={handleRemoveEvent}
            onPreview={handlePreviewEvent}
          />
        );
      default:
        return (
          <CalendarOverviewPanel
            metrics={{
              accounts: metrics.accounts,
              slots: (() => {
                const windowsTotal = Object.values(availabilityLookup).reduce(
                  (acc, record) => acc + (record?.windows?.length ?? 0),
                  0,
                );
                return { total: windowsTotal, open: windowsTotal };
              })(),
              events: metrics.events,
            }}
            events={events}
            onSelectEvent={handlePreviewEvent}
            onNavigate={(target) => setPanel(target)}
            onCreateEvent={handleCreateEvent}
            onOpenSlots={handleQuickSlots}
            onCreateTemplate={handleCreateTemplate}
          />
        );
    }
  }, [
    panel,
    accounts,
    events,
    templates,
    metrics.accounts,
    metrics.events,
    availabilityLookup,
  ]);

  let drawerTitle = '';
  let drawerDescription = '';
  let drawerWidth = 'lg';
  let drawerContent = null;

  if (drawer.type === 'account') {
    drawerTitle = drawer.mode === 'edit' ? 'Edit account' : 'New account';
    drawerWidth = 'md';
    drawerContent = (
      <CalendarAccountForm
        initialValue={drawer.mode === 'edit' ? drawer.data : null}
        onSubmit={handleSaveAccount}
        onCancel={closeDrawer}
        submitting={busy}
      />
    );
  } else if (drawer.type === 'slots') {
    drawerTitle = 'Manage slots';
    drawerWidth = 'xl';
    drawerContent = (
      <CalendarAvailabilityForm
        account={drawer.data?.account}
        initialValue={drawer.data?.availability}
        onSubmit={handleSaveAvailability}
        onCancel={closeDrawer}
        submitting={busy}
      />
    );
  } else if (drawer.type === 'template') {
    drawerTitle = drawer.mode === 'edit' ? 'Edit type' : 'New type';
    drawerWidth = 'lg';
    drawerContent = (
      <CalendarTemplateForm
        initialValue={drawer.mode === 'edit' ? drawer.data : null}
        onSubmit={handleSaveTemplate}
        onCancel={closeDrawer}
        submitting={busy}
      />
    );
  } else if (drawer.type === 'event') {
    drawerTitle = drawer.mode === 'edit' ? 'Edit event' : 'New event';
    drawerWidth = 'xl';
    drawerContent = (
      <CalendarEventForm
        initialValue={drawer.mode === 'edit' ? drawer.data : null}
        accounts={accounts}
        templates={templates}
        onSubmit={handleSaveEvent}
        onCancel={closeDrawer}
        submitting={busy}
      />
    );
  } else if (drawer.type === 'eventPreview') {
    drawerTitle = 'Event';
    drawerDescription = 'Expanded view';
    drawerWidth = 'xl';
    drawerContent = <CalendarEventPreview event={drawer.data} />;
  }

  const showDrawer = drawer.type != null;

  return (
    <CalendarConsoleLayout
      panelConfig={PANELS}
      activePanel={panel}
      onPanelChange={setPanel}
      variant={variant}
      loading={loading}
      busy={busy}
      message={message}
      error={error}
      onDismissMessage={() => setMessage('')}
      onDismissError={() => setError('')}
      onRefresh={refresh}
    >
      {loading && accounts.length === 0 && templates.length === 0 && events.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          Loading calendar…
        </div>
      ) : (
        panelContent
      )}

      <CalendarDrawer
        open={showDrawer}
        title={drawerTitle}
        description={drawerDescription}
        width={drawerWidth}
        onClose={closeDrawer}
      >
        {drawerContent}
      </CalendarDrawer>
    </CalendarConsoleLayout>
  );
}
