import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import EventManagementSection from '../EventManagementSection.jsx';
import * as controllerModule from '../useEventManagementController.js';

vi.mock('../EventSummaryBar.jsx', () => ({
  default: ({ onCreate }) => (
    <button type="button" onClick={onCreate}>
      summary-new
    </button>
  ),
}));

vi.mock('../EventTemplateGallery.jsx', () => ({
  default: ({ onUseTemplate }) => (
    <button type="button" onClick={() => onUseTemplate?.({ id: 'tpl-1', name: 'Template', highlights: ['Intro'] })}>
      use-template
    </button>
  ),
}));

vi.mock('../EventLibrary.jsx', () => ({
  default: ({ events, onSelect, onOpenWorkspace, onDelete }) => (
    <div>
      <button type="button" onClick={() => onSelect(events[0].id)}>
        select-event
      </button>
      <button type="button" onClick={() => onOpenWorkspace(events[0].id)}>
        manage-event
      </button>
      <button type="button" onClick={() => onDelete(events[0].id)}>
        delete-event
      </button>
    </div>
  ),
}));

vi.mock('../EventWorkspace.jsx', () => ({
  default: () => <div data-testid="workspace" />,
}));

vi.mock('../EventWizard.jsx', () => ({
  default: () => <div data-testid="wizard" />,
}));

const baseEvent = {
  id: 'evt-12',
  title: 'Creator Camp',
  status: 'planned',
  startAt: '2024-06-01T09:00:00.000Z',
  endAt: '2024-06-01T17:00:00.000Z',
  timezone: 'Europe/London',
  format: 'in_person',
  visibility: 'invite_only',
  agenda: [],
  guests: [],
  tasks: [],
  budget: [],
  assets: [],
  checklist: [],
};

describe('EventManagementSection', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2024-04-01T09:00:00Z'));
  });

  it('wires controller actions to UI events', async () => {
    const user = userEvent.setup();
    const selectEvent = vi.fn();
    const openCreateWizard = vi.fn();
    const openEditWizard = vi.fn();
    const requestDeleteEvent = vi.fn();

    vi.spyOn(controllerModule, 'default').mockReturnValue({
      overview: { active: 1, tasksCompleted: 0, tasksTotal: 0, guestsConfirmed: 0, nextEvent: { title: 'Creator Camp' } },
      events: [baseEvent],
      settings: { defaultFormat: 'virtual', defaultVisibility: 'invite_only', defaultTimezone: 'Europe/London' },
      templates: [
        {
          id: 'tpl-1',
          name: 'Product showcase',
          format: 'virtual',
          durationHours: 2,
          techStack: ['Zoom'],
          highlights: ['Welcome keynote', 'Demo'],
        },
      ],
      canManage: true,
      selectedEvent: baseEvent,
      selectEvent,
      wizardState: { open: false, mode: 'create', initialValues: null },
      openCreateWizard,
      openEditWizard,
      closeWizard: vi.fn(),
      saveEvent: vi.fn(),
      requestDeleteEvent,
      confirmState: { open: false, title: '', message: '', actionLabel: 'Delete' },
      confirmAction: vi.fn(),
      closeConfirm: vi.fn(),
      busy: false,
      feedback: null,
      error: null,
      closeFeedback: vi.fn(),
      closeError: vi.fn(),
      mutateEvent: vi.fn(),
      taskApi: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
      guestApi: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
      budgetApi: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
      agendaApi: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
      assetApi: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
      checklistApi: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
    });

    render(<EventManagementSection data={{}} userId="user-1" onRefresh={vi.fn()} />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /summary-new/i }));
    });
    expect(openCreateWizard).toHaveBeenCalled();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /manage-event/i }));
    });
    expect(selectEvent).toHaveBeenCalledWith('evt-12');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /use-template/i }));
    });
    await waitFor(() => expect(openCreateWizard).toHaveBeenCalledTimes(2));

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /delete-event/i }));
    });
    expect(requestDeleteEvent).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
