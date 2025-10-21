import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CompanyAnalyticsPage from '../CompanyAnalyticsPage.jsx';
import CompanyByokAutoReplyPage from '../CompanyByokAutoReplyPage.jsx';
import CompanyCalendarPage from '../CompanyCalendarPage.jsx';
import CompanyCrmIntegrationsPage from '../CompanyCrmIntegrationsPage.jsx';
import CompanyIntegrationsPage from '../CompanyIntegrationsPage.jsx';
import CompanyIdVerificationPage from '../CompanyIdVerificationPage.jsx';
import CompanyInboxPage from '../CompanyInboxPage.jsx';
import CompanyOrdersPage from '../CompanyOrdersPage.jsx';
import CompanyProjectManagementPage from '../CompanyProjectManagementPage.jsx';

const mockUseSession = vi.fn();
const mockUseCompanyAutoReply = vi.fn();
const mockUseCrmIntegrationManager = vi.fn();
const mockUseCompanyIdentityVerifications = vi.fn();
const mockUseCompanyDashboard = vi.fn();
const mockUseCompanyCalendar = vi.fn();
const mockUseCompanyOrders = vi.fn();

vi.mock('../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('../../../components/dashboard/AccessDeniedPanel.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied" data-props={JSON.stringify(props)} />,
}));

vi.mock('../../../components/DataStatus.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="data-status" />,
}));

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

vi.mock('../../../context/SessionContext.jsx', () => ({
  __esModule: true,
  useSession: () => mockUseSession(),
}));

vi.mock('../../../hooks/useCompanyAutoReply.js', () => ({
  __esModule: true,
  default: (...args) => mockUseCompanyAutoReply(...args),
}));

vi.mock('../../../hooks/useCrmIntegrationManager.js', () => ({
  __esModule: true,
  default: (...args) => mockUseCrmIntegrationManager(...args),
}));

vi.mock('../../../hooks/useCompanyIdentityVerifications.js', () => ({
  __esModule: true,
  useCompanyIdentityVerifications: (...args) => mockUseCompanyIdentityVerifications(...args),
}));

vi.mock('../../../hooks/useCompanyDashboard.js', () => ({
  __esModule: true,
  useCompanyDashboard: (...args) => mockUseCompanyDashboard(...args),
  default: (...args) => mockUseCompanyDashboard(...args),
}));

vi.mock('../../../hooks/useCompanyCalendar.js', () => ({
  __esModule: true,
  default: (...args) => mockUseCompanyCalendar(...args),
}));

vi.mock('../../../hooks/useCompanyOrders.js', () => ({
  __esModule: true,
  useCompanyOrders: (...args) => mockUseCompanyOrders(...args),
  default: (...args) => mockUseCompanyOrders(...args),
}));

vi.mock('../../../components/company/auto-reply/ByokCredentialCard.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="byok-card" />,
}));

vi.mock('../../../components/company/auto-reply/AutoReplySettingsForm.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="auto-reply-settings" />,
}));

vi.mock('../../../components/company/auto-reply/AutoReplyTemplatesTable.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="auto-reply-templates" />,
}));

vi.mock('../../../components/company/auto-reply/AutoReplyActivityTimeline.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="auto-reply-activity" />,
}));

vi.mock('../../../components/ui/Modal.jsx', () => ({
  __esModule: true,
  default: ({ open, children }) => (open ? <div data-testid="modal">{children}</div> : null),
}));

vi.mock('../../../components/company/calendar/CalendarSummary.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-summary" />,
}));

vi.mock('../../../components/company/calendar/CalendarUpcomingGrid.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-upcoming" />,
}));

vi.mock('../../../components/company/calendar/CalendarEventDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="calendar-drawer" /> : null),
}));

vi.mock('../../../components/company/calendar/CalendarEventForm.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-form" />,
}));

vi.mock('../../../components/company/calendar/CalendarEventList.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-list" />,
}));

vi.mock('../../../components/company/calendar/CalendarAutomationPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-automation" />,
}));

vi.mock('../../../components/company/calendar/CalendarEventDetails.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="calendar-details" /> : null),
}));

vi.mock('../../../services/companyCalendar.js', () => ({
  __esModule: true,
  createCompanyCalendarEvent: vi.fn(),
  updateCompanyCalendarEvent: vi.fn(),
  deleteCompanyCalendarEvent: vi.fn(),
}));

vi.mock('../../../components/projectGigManagement/GigOperationsWorkspace.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="gig-operations-workspace" />,
}));

vi.mock('../../../components/company/idVerification/IdVerificationSummaryCards.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="id-summary" />,
}));

vi.mock('../../../components/company/idVerification/IdVerificationFilters.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="id-filters" data-props={JSON.stringify(props)} />,
}));

vi.mock('../../../components/company/idVerification/IdVerificationTable.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="id-table" />,
}));

vi.mock('../../../components/company/idVerification/IdVerificationDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="id-drawer" /> : null),
}));

vi.mock('../../../components/company/idVerification/IdVerificationRequestModal.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="id-request-modal" /> : null),
}));

vi.mock('../../../components/companyInbox/SummaryCards.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="inbox-summary" />,
}));

vi.mock('../../../components/companyInbox/ThreadCard.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="thread-card" />,
}));

vi.mock('../../../components/companyInbox/EmptyState.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="inbox-empty" />,
}));

vi.mock('../../../components/companyInbox/LabelManagerModal.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="label-modal" /> : null),
}));

vi.mock('../../../components/companyInbox/NewThreadModal.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="new-thread-modal" /> : null),
}));

vi.mock('../../../components/companyInbox/FilterDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="filter-drawer" /> : null),
}));

vi.mock('../../../components/messaging/ConversationMessage.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="conversation-message" />,
}));

vi.mock('../../../components/projectGigManagement/ProjectGigManagementContainer.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="project-gig-container" />,
}));

vi.mock('../../../services/companyInbox.js', () => ({
  __esModule: true,
  fetchCompanyInboxOverview: vi.fn().mockResolvedValue({
    workspace: { id: 1, name: 'Workspace' },
    metrics: {},
    labels: [],
    members: [],
    meta: { availableWorkspaces: [] },
  }),
  fetchCompanyInboxThreads: vi.fn().mockResolvedValue({
    threads: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  }),
  fetchCompanyInboxThread: vi.fn().mockResolvedValue({ messages: [] }),
  fetchCompanyInboxLabels: vi.fn().mockResolvedValue([]),
  createCompanyInboxLabel: vi.fn().mockResolvedValue({}),
  updateCompanyInboxLabel: vi.fn().mockResolvedValue({}),
  deleteCompanyInboxLabel: vi.fn().mockResolvedValue({}),
  setCompanyThreadLabels: vi.fn().mockResolvedValue({}),
  fetchCompanyInboxMembers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../services/messaging.js', () => ({
  __esModule: true,
  sendMessage: vi.fn().mockResolvedValue({}),
  createThread: vi.fn().mockResolvedValue({}),
  updateThreadState: vi.fn().mockResolvedValue({}),
  escalateThread: vi.fn().mockResolvedValue({}),
  assignSupport: vi.fn().mockResolvedValue({}),
  updateSupportStatus: vi.fn().mockResolvedValue({}),
  markThreadRead: vi.fn().mockResolvedValue({}),
}));

const baseSession = {
  isAuthenticated: true,
  session: {
    id: '42',
    memberships: ['company'],
    primaryDashboard: 'company',
    name: 'Workspace Owner',
  },
};

const baseAutoReplyState = {
  data: {
    settings: { workspaceId: '1', autoReplies: { enabled: true, channels: [] } },
    templates: [],
    activity: [],
    meta: { availableWorkspaces: [] },
  },
  error: null,
  loading: false,
  refresh: vi.fn(),
  fromCache: false,
  lastUpdated: null,
};

const baseIntegrationState = {
  loading: false,
  summary: {
    total: 0,
    connected: 0,
    requiresAttention: 0,
    openIncidents: 0,
    lastSyncedAt: null,
    environments: {},
  },
  connectors: [],
  managedConnectors: [],
  auditLog: [],
  defaults: {},
  refresh: vi.fn(),
  toggleConnection: vi.fn(),
  updateConnectorSettings: vi.fn(),
  rotateApiKey: vi.fn(),
  updateFieldMappings: vi.fn(),
  updateRoleAssignments: vi.fn(),
  triggerSync: vi.fn(),
  createIncidentRecord: vi.fn(),
  markIncidentResolved: vi.fn(),
};

const baseVerificationState = {
  data: {
    metadata: {
      workspace: { id: 1 },
      workspaceOptions: [],
      reviewerOptions: [],
      memberOptions: [],
    },
    stats: { countsByStatus: {} },
    pagination: { page: 1, totalPages: 1, totalItems: 0, pageSize: 25 },
  },
  loading: false,
  error: null,
  refresh: vi.fn(),
  lastUpdated: null,
};

const baseDashboardState = {
  data: { meta: { availableWorkspaces: [], selectedWorkspaceId: null } },
  loading: false,
  error: null,
  refresh: vi.fn(),
  fromCache: false,
  lastUpdated: null,
  summaryCards: [],
};

const baseCalendarState = {
  data: {},
  loading: false,
  error: null,
  refresh: vi.fn(),
  fromCache: false,
  lastUpdated: null,
  availableWorkspaces: [],
  upcomingEvents: [],
  meta: {},
};

const baseOrdersState = {
  data: null,
  metrics: {},
  permissions: {},
  loading: false,
  error: null,
  refresh: vi.fn(),
  fromCache: false,
  lastUpdated: null,
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  addTimelineEvent: vi.fn(),
  postMessage: vi.fn(),
  createEscrow: vi.fn(),
  updateEscrow: vi.fn(),
  submitReview: vi.fn(),
};

function renderWithRouter(element, path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const scenarios = [
  {
    name: 'CompanyAnalyticsPage',
    component: <CompanyAnalyticsPage />,
    path: '/dashboard/company/analytics',
    setup: () => {
      mockUseCompanyDashboard.mockReturnValue(baseDashboardState);
    },
  },
  {
    name: 'CompanyCalendarPage',
    component: <CompanyCalendarPage />,
    path: '/dashboard/company/calendar',
    setup: () => {
      mockUseCompanyCalendar.mockReturnValue(baseCalendarState);
    },
  },
  {
    name: 'CompanyByokAutoReplyPage',
    component: <CompanyByokAutoReplyPage />,
    path: '/dashboard/company/ai-auto-reply',
    setup: () => {
      mockUseCompanyAutoReply.mockReturnValue(baseAutoReplyState);
    },
  },
  {
    name: 'CompanyCrmIntegrationsPage',
    component: <CompanyCrmIntegrationsPage />,
    path: '/dashboard/company/integrations/crm',
    setup: () => {
      mockUseCrmIntegrationManager.mockReturnValue(baseIntegrationState);
    },
  },
  {
    name: 'CompanyIntegrationsPage',
    component: <CompanyIntegrationsPage />,
    path: '/dashboard/company/integrations',
    setup: () => {
      mockUseCrmIntegrationManager.mockReturnValue(baseIntegrationState);
    },
  },
  {
    name: 'CompanyIdVerificationPage',
    component: <CompanyIdVerificationPage />,
    path: '/dashboard/company/id-verification',
    setup: () => {
      mockUseCompanyIdentityVerifications.mockReturnValue(baseVerificationState);
    },
  },
  {
    name: 'CompanyInboxPage',
    component: <CompanyInboxPage />,
    path: '/dashboard/company/inbox',
    setup: () => {
      mockUseCompanyAutoReply.mockReturnValue(baseAutoReplyState);
      mockUseCrmIntegrationManager.mockReturnValue(baseIntegrationState);
      mockUseCompanyIdentityVerifications.mockReturnValue(baseVerificationState);
    },
  },
  {
    name: 'CompanyOrdersPage',
    component: <CompanyOrdersPage />,
    path: '/dashboard/company/orders',
    setup: () => {
      mockUseCompanyOrders.mockReturnValue(baseOrdersState);
    },
  },
  {
    name: 'CompanyProjectManagementPage',
    component: <CompanyProjectManagementPage />,
    path: '/dashboard/company/projects',
    setup: () => {
      mockUseCompanyAutoReply.mockReturnValue(baseAutoReplyState);
    },
  },
];

describe('Company dashboard access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue(baseSession);
    mockUseCompanyAutoReply.mockReturnValue(baseAutoReplyState);
    mockUseCrmIntegrationManager.mockReturnValue(baseIntegrationState);
    mockUseCompanyIdentityVerifications.mockReturnValue(baseVerificationState);
    mockUseCompanyDashboard.mockReturnValue(baseDashboardState);
    mockUseCompanyCalendar.mockReturnValue(baseCalendarState);
    mockUseCompanyOrders.mockReturnValue(baseOrdersState);
  });

  scenarios.forEach(({ name, component, path, setup }) => {
    describe(name, () => {
      beforeEach(() => {
        if (setup) {
          setup();
        }
      });

      it('redirects unauthenticated users to login', async () => {
        mockUseSession.mockReturnValue({ isAuthenticated: false, session: null });
        renderWithRouter(component, path);
        expect(await screen.findByTestId('login-page')).toBeInTheDocument();
      });

      it('displays access denied when company membership is missing', async () => {
        mockUseSession.mockReturnValue({
          isAuthenticated: true,
          session: { memberships: ['user'], primaryDashboard: 'user' },
        });
        renderWithRouter(component, path);
        expect(await screen.findByTestId('access-denied')).toBeInTheDocument();
      });
    });
  });
});
