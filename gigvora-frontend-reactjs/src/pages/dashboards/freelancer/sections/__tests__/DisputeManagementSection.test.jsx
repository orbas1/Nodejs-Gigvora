import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DisputeManagementSection from '../DisputeManagementSection.jsx';

const sessionStub = vi.hoisted(() => ({ session: { id: 101 } }));
const fetchDashboardMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionStub,
}));

vi.mock('../../../../../services/freelancerDisputes.js', () => ({
  __esModule: true,
  fetchDisputeDashboard: fetchDashboardMock,
}));

describe('DisputeManagementSection', () => {
  beforeEach(() => {
    fetchDashboardMock.mockReset();
    sessionStub.session = { id: 101 };
  });

  it('renders summary metrics from the dispute dashboard', async () => {
    fetchDashboardMock.mockResolvedValue({
      summary: { openCases: 3, awaitingCustomer: 1, urgentCases: 2, dueWithin72h: 4 },
    });

    render(
      <MemoryRouter>
        <DisputeManagementSection />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchDashboardMock).toHaveBeenCalledWith(101, { limit: 5 });
    });

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('surfaces an error message when the dashboard fails to load', async () => {
    fetchDashboardMock.mockRejectedValue(new Error('Service unavailable'));

    render(
      <MemoryRouter>
        <DisputeManagementSection />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/service unavailable/i)).toBeInTheDocument();
  });
});
