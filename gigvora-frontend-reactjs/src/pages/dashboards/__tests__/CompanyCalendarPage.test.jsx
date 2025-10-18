import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyCalendarPage from '../CompanyCalendarPage.jsx';
import useCompanyCalendar from '../../../hooks/useCompanyCalendar.js';
import {
  createCompanyCalendarEvent,
  updateCompanyCalendarEvent,
  deleteCompanyCalendarEvent,
} from '../../../services/companyCalendar.js';

vi.mock('../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('../../../components/company/calendar/CalendarEventDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open, children }) => (open ? <div data-testid="calendar-drawer">{children}</div> : null),
}));

vi.mock('../../../hooks/useCompanyCalendar.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../services/companyCalendar.js', () => ({
  __esModule: true,
  createCompanyCalendarEvent: vi.fn(),
  updateCompanyCalendarEvent: vi.fn(),
  deleteCompanyCalendarEvent: vi.fn(),
}));

const baseCalendarState = {
  loading: false,
  fromCache: false,
  error: null,
  lastUpdated: new Date(),
  refresh: vi.fn().mockResolvedValue(undefined),
  availableWorkspaces: [
    { id: '101', name: 'Acme Talent Hub', timezone: 'UTC', permissions: ['manage_calendar'] },
    { id: '202', name: 'Global Mentorship Guild', timezone: 'America/New_York', permissions: ['view_calendar'] },
  ],
  filters: { from: null, to: null, types: [], search: '' },
  data: {
    filters: { from: null, to: null, types: [], search: '' },
  },
  eventsByType: {
    project: [
      {
        id: 'evt-project-1',
        title: 'Revenue ops project kickoff',
        eventType: 'project',
        startsAt: new Date(Date.now() + 3600_000).toISOString(),
        endsAt: new Date(Date.now() + 7200_000).toISOString(),
        status: 'scheduled',
        location: 'HQ',
        metadata: { relatedEntityName: 'Revenue intelligence rollout', relatedEntityType: 'project' },
      },
    ],
    interview: [],
    gig: [],
    mentorship: [],
    volunteering: [],
  },
  summary: {
    totalEvents: 1,
    nextEvent: {
      id: 'evt-project-1',
      title: 'Revenue ops project kickoff',
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    },
    overdueCount: 0,
    totalsByType: { project: 1 },
    upcomingByType: { project: [] },
  },
};

function renderPage(initialEntry = '/dashboard/company/calendar?workspaceId=101') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/company/calendar" element={<CompanyCalendarPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CompanyCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCompanyCalendar.mockReturnValue({ ...baseCalendarState });
    createCompanyCalendarEvent.mockResolvedValue({ id: 'evt-new' });
    updateCompanyCalendarEvent.mockResolvedValue({});
    deleteCompanyCalendarEvent.mockResolvedValue();
  });

  it('creates a new calendar event through the drawer form', async () => {
    const user = userEvent.setup();
    renderPage();

    const workspaceSelect = await screen.findByLabelText(/workspace/i);
    await waitFor(() => {
      expect(workspaceSelect.value).toBe('101');
    });

    const projectsPanelButton = await screen.findByRole('button', { name: /projects/i });
    await user.click(projectsPanelButton);

    const projectsHeading = await screen.findByRole('heading', { name: /projects/i });
    const projectsSection = projectsHeading.closest('section');
    const projectsWithin = projectsSection ? within(projectsSection) : screen;
    const newProjectButton = projectsWithin.getByRole('button', { name: /^new$/i });
    await user.click(newProjectButton);

    const drawer = await screen.findByTestId('calendar-drawer');
    expect(drawer).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Product analytics kickoff');

    const startsAtInput = screen.getByLabelText(/starts at/i);
    fireEvent.change(startsAtInput, { target: { value: '2024-05-01T09:00' } });
    const endsAtInput = screen.getByLabelText(/ends at/i);
    fireEvent.change(endsAtInput, { target: { value: '2024-05-01T10:00' } });

    const locationInput = screen.getByLabelText(/location/i);
    await user.type(locationInput, 'Hybrid meeting room');

    await user.click(screen.getByRole('button', { name: /save event/i }));

    await waitFor(() => {
      expect(createCompanyCalendarEvent).toHaveBeenCalledTimes(1);
    });

    expect(createCompanyCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 101,
        title: 'Product analytics kickoff',
        eventType: 'project',
        startsAt: expect.stringMatching(/^2024-05-01T09:00/),
        endsAt: expect.stringMatching(/^2024-05-01T10:00/),
        metadata: expect.any(Object),
      }),
    );
    await waitFor(() => {
      expect(baseCalendarState.refresh).toHaveBeenCalledWith({ force: true });
    });
  });
});
