import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import VolunteeringWorkspace from '../VolunteeringWorkspace.jsx';

const overviewPaneSpy = vi.fn();
const contractsPaneSpy = vi.fn();
const applicationsPaneSpy = vi.fn();
const responsesPaneSpy = vi.fn();
const spendPaneSpy = vi.fn();

vi.mock('../panes/OverviewPane.jsx', () => ({
  __esModule: true,
  default: (props) => {
    overviewPaneSpy(props);
    return <div data-testid="overview-pane" />;
  },
}));

vi.mock('../panes/ContractsPane.jsx', () => ({
  __esModule: true,
  default: (props) => {
    contractsPaneSpy(props);
    return <div data-testid="contracts-pane" />;
  },
}));

vi.mock('../panes/ApplicationsPane.jsx', () => ({
  __esModule: true,
  default: (props) => {
    applicationsPaneSpy(props);
    return <div data-testid="applications-pane" />;
  },
}));

vi.mock('../panes/ResponsesPane.jsx', () => ({
  __esModule: true,
  default: (props) => {
    responsesPaneSpy(props);
    return <div data-testid="responses-pane" />;
  },
}));

vi.mock('../panes/SpendPane.jsx', () => ({
  __esModule: true,
  default: (props) => {
    spendPaneSpy(props);
    return <div data-testid="spend-pane" />;
  },
}));

let fetchOverviewMock;

vi.mock('../../../../services/agency.js', () => ({
  __esModule: true,
  fetchAgencyVolunteeringOverview: (...args) => fetchOverviewMock(...args),
  createAgencyVolunteeringContract: vi.fn(),
  updateAgencyVolunteeringContract: vi.fn(),
  deleteAgencyVolunteeringContract: vi.fn(),
  createAgencyVolunteeringApplication: vi.fn(),
  updateAgencyVolunteeringApplication: vi.fn(),
  deleteAgencyVolunteeringApplication: vi.fn(),
  createAgencyVolunteeringResponse: vi.fn(),
  updateAgencyVolunteeringResponse: vi.fn(),
  deleteAgencyVolunteeringResponse: vi.fn(),
  createAgencyVolunteeringSpendEntry: vi.fn(),
  updateAgencyVolunteeringSpendEntry: vi.fn(),
  deleteAgencyVolunteeringSpendEntry: vi.fn(),
}));

const buildSnapshot = (overrides = {}) => ({
  contracts: {
    all: [{ id: 1, title: 'Community Outreach' }],
    open: [],
    finished: [],
  },
  applications: [{ id: 10, volunteerName: 'Jane', contractId: 1 }],
  responses: [{ id: 20, applicationId: 10, summary: 'Thanks' }],
  spend: {
    entries: [{ id: 30, contractId: 1, amount: 5000 }],
    totals: { currency: 'USD', total: 5000 },
  },
  summary: { totalContracts: 1 },
  lookups: {},
  workspace: { id: 'ws-1', defaultCurrency: 'USD' },
  allowedActions: { canView: true, canManage: true },
  refreshedAt: '2024-05-01T12:00:00.000Z',
  ...overrides,
});

describe('VolunteeringWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchOverviewMock = vi.fn();
  });

  it('loads overview data and wires panes correctly', async () => {
    fetchOverviewMock.mockResolvedValue(buildSnapshot());

    render(<VolunteeringWorkspace workspaceId="ws-1" workspaceSlug="acme" />);

    await waitFor(() => {
      const latestCall = overviewPaneSpy.mock.calls.at(-1)?.[0];
      expect(latestCall?.summary).toEqual({ totalContracts: 1 });
    });

    const dealsButton = screen.getAllByRole('button', { name: /deals/i })[0];
    fireEvent.click(dealsButton);

    await waitFor(() => expect(contractsPaneSpy).toHaveBeenCalled());
    expect(contractsPaneSpy.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        contracts: expect.objectContaining({ all: expect.any(Array) }),
        canManage: true,
      }),
    );

    const applyButton = screen.getAllByRole('button', { name: /apply/i })[0];
    fireEvent.click(applyButton);

    await waitFor(() => expect(applicationsPaneSpy).toHaveBeenCalled());
    expect(fetchOverviewMock).toHaveBeenCalledWith({ workspaceId: 'ws-1', workspaceSlug: 'acme' });
  });

  it('renders an access warning when the viewer lacks permissions', async () => {
    fetchOverviewMock.mockResolvedValue(buildSnapshot({ allowedActions: { canView: false } }));

    render(<VolunteeringWorkspace workspaceId="ws-2" workspaceSlug="demo" />);

    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
    const retryButton = screen.getByRole('button', { name: /retry access check/i });
    fireEvent.click(retryButton);

    await waitFor(() => expect(fetchOverviewMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByTestId('overview-pane')).not.toBeInTheDocument());
  });
});
