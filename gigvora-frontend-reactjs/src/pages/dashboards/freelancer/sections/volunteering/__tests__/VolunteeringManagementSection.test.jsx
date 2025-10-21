import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@headlessui/react', async () => {
  const React = await import('react');
  const { Fragment } = React;

  const renderChildren = (children, props = {}) =>
    typeof children === 'function' ? children(props) : children;

  const Transition = Object.assign(
    ({ show = true, as: Component = Fragment, children }) => {
      if (!show) {
        return null;
      }
      return <Component>{renderChildren(children)}</Component>;
    },
    {
      Child: ({ show = true, as: Component = Fragment, children }) => {
        if (!show) {
          return null;
        }
        return <Component>{renderChildren(children)}</Component>;
      },
    },
  );

  const Dialog = Object.assign(
    ({ as: Component = 'div', children, ...props }) => (
      <Component role="dialog" aria-modal="true" {...props}>
        {renderChildren(children)}
      </Component>
    ),
    {
      Panel: ({ as: Component = 'div', children, ...props }) => (
        <Component {...props}>{renderChildren(children)}</Component>
      ),
      Title: ({ as: Component = 'h2', children, ...props }) => (
        <Component {...props}>{renderChildren(children)}</Component>
      ),
      Description: ({ as: Component = 'p', children, ...props }) => (
        <Component {...props}>{renderChildren(children)}</Component>
      ),
    },
  );

  return { Transition, Dialog };
});

vi.mock('../../../../../../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../../../../hooks/useVolunteeringManagement.js', () => ({
  default: vi.fn(),
}));

import useSession from '../../../../../../hooks/useSession.js';
import useVolunteeringManagement from '../../../../../../hooks/useVolunteeringManagement.js';

import VolunteeringManagementSection from '../VolunteeringManagementSection.jsx';

const mockSession = useSession;
const mockVolunteering = useVolunteeringManagement;

function buildWorkspace() {
  return {
    metrics: {
      activeApplications: 2,
      interviewsScheduled: 1,
      openContracts: 1,
      hoursCommitted: 12,
    },
    applications: [
      {
        id: 'app-1',
        title: 'Community mentor',
        organizationName: 'Atlas Labs',
        status: 'submitted',
        appliedAt: '2024-03-01T00:00:00Z',
        targetStartDate: '2024-03-15T00:00:00Z',
        hoursPerWeek: 5,
      },
    ],
    responses: [],
    contracts: {
      open: [
        {
          id: 'contract-1',
          title: 'Weekly strategy stand-up',
          hoursCommitted: 12,
          status: 'pending',
        },
      ],
      finished: [],
    },
    spend: {
      totals: { lifetime: 1200, yearToDate: 300 },
      entries: [
        {
          id: 'spend-1',
          description: 'Travel stipend',
          amount: 150,
          currencyCode: 'USD',
        },
      ],
    },
  };
}

beforeEach(() => {
  mockSession.mockReturnValue({ freelancerProfile: { id: 'freelancer-1' } });
  mockVolunteering.mockReturnValue({
    workspace: buildWorkspace(),
    metadata: {
      statusOptions: ['draft', 'submitted'],
      responseStatusOptions: ['awaiting_reply', 'interview'],
      contractStatusOptions: ['pending', 'signed'],
      spendCategories: ['stipend', 'travel'],
    },
    loading: false,
    mutating: false,
    error: null,
    createApplication: vi.fn().mockResolvedValue(undefined),
    updateApplication: vi.fn().mockResolvedValue(undefined),
    deleteApplication: vi.fn().mockResolvedValue(undefined),
    createResponse: vi.fn().mockResolvedValue(undefined),
    updateResponse: vi.fn().mockResolvedValue(undefined),
    deleteResponse: vi.fn().mockResolvedValue(undefined),
    createContract: vi.fn().mockResolvedValue(undefined),
    updateContract: vi.fn().mockResolvedValue(undefined),
    deleteContract: vi.fn().mockResolvedValue(undefined),
    createSpend: vi.fn().mockResolvedValue(undefined),
    updateSpend: vi.fn().mockResolvedValue(undefined),
    deleteSpend: vi.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('freelancer volunteering management section', () => {
  it('prompts for freelancer context when unavailable', () => {
    mockSession.mockReturnValueOnce({ freelancerProfile: null });

    render(<VolunteeringManagementSection />);
    expect(screen.getByText('Freelancer context missing.')).toBeInTheDocument();
  });

  it('shows overview metrics by default', () => {
    render(<VolunteeringManagementSection />);

    expect(screen.getByText('Active apps')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Latest applications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contracts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spend' })).toBeInTheDocument();
  });

  it('switches between volunteering workflows', async () => {
    const user = userEvent.setup();

    render(<VolunteeringManagementSection />);

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('Applications')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reply' }));
    expect(screen.getByText('Responses')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Deals' }));
    expect(screen.getByText('Contracts')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Spend' })[0]);
    expect(screen.getByRole('heading', { name: 'Spend' })).toBeInTheDocument();
  });

  it('surfaces loading and error states from the hook', () => {
    mockVolunteering.mockReturnValueOnce({
      workspace: null,
      metadata: null,
      loading: true,
      mutating: false,
      error: null,
      createApplication: vi.fn(),
      updateApplication: vi.fn(),
      deleteApplication: vi.fn(),
      createResponse: vi.fn(),
      updateResponse: vi.fn(),
      deleteResponse: vi.fn(),
      createContract: vi.fn(),
      updateContract: vi.fn(),
      deleteContract: vi.fn(),
      createSpend: vi.fn(),
      updateSpend: vi.fn(),
      deleteSpend: vi.fn(),
    });

    const { rerender } = render(<VolunteeringManagementSection />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    mockVolunteering.mockReturnValueOnce({
      workspace: null,
      metadata: null,
      loading: false,
      mutating: false,
      error: new Error('Something went wrong'),
      createApplication: vi.fn(),
      updateApplication: vi.fn(),
      deleteApplication: vi.fn(),
      createResponse: vi.fn(),
      updateResponse: vi.fn(),
      deleteResponse: vi.fn(),
      createContract: vi.fn(),
      updateContract: vi.fn(),
      deleteContract: vi.fn(),
      createSpend: vi.fn(),
      updateSpend: vi.fn(),
      deleteSpend: vi.fn(),
    });

    rerender(<VolunteeringManagementSection />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
