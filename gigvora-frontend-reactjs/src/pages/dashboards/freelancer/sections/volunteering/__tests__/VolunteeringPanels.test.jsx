import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

import ApplicationsPanel from '../ApplicationsPanel.jsx';
import ContractsPanel from '../ContractsPanel.jsx';
import OverviewPanel from '../OverviewPanel.jsx';
import ResponsesPanel from '../ResponsesPanel.jsx';
import SpendPanel from '../SpendPanel.jsx';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('freelancer volunteering panels', () => {
  it('captures new applications through the modal workflow', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ApplicationsPanel
        applications={[]}
        metadata={{
          statusOptions: ['draft', 'submitted'],
        }}
        mutating={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onOpenResponses={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^New$/ }));

    const titleInput = await screen.findByLabelText('Title');
    await user.type(titleInput, 'Community mentor');
    await user.type(screen.getByLabelText('Organisation'), 'Atlas Labs');
    await user.selectOptions(screen.getByLabelText('Status'), 'submitted');
    await user.type(screen.getByLabelText('Skills'), 'Strategy, Leadership');
    await user.type(screen.getByLabelText('Hours / week'), '8');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Community mentor',
          organizationName: 'Atlas Labs',
          status: 'submitted',
          skills: ['Strategy', 'Leadership'],
          hoursPerWeek: '8',
        }),
      );
    });
  });

  it('supports quick editing and deletion of applications', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ApplicationsPanel
        applications={[
          {
            id: 'app-1',
            title: 'Community mentor',
            organizationName: 'Atlas Labs',
            status: 'submitted',
            targetStartDate: '2024-03-15T00:00:00Z',
            hoursPerWeek: 6,
          },
        ]}
        metadata={{ statusOptions: ['draft', 'submitted'] }}
        mutating={false}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onOpenResponses={vi.fn()}
      />,
    );

    const row = screen.getByText('Community mentor').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('app-1');
  });

  it('submits contract information linking to applications', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ContractsPanel
        contracts={[]}
        applications={[{ id: 'app-1', title: 'Community mentor' }]}
        metadata={{ contractStatusOptions: ['pending', 'signed'] }}
        mutating={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onOpenSpend={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^New$/ }));

    const contractTitle = await screen.findByLabelText('Title');
    await user.type(contractTitle, 'Partnership contract');
    await user.type(screen.getByLabelText('Organisation'), 'Atlas Labs');
    await user.selectOptions(screen.getByLabelText('Status'), 'pending');
    await user.selectOptions(screen.getByLabelText('Linked application'), 'app-1');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Partnership contract',
          organizationName: 'Atlas Labs',
          status: 'pending',
          applicationId: 'app-1',
        }),
      );
    });
  });

  it('registers responses tied to applications', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ResponsesPanel
        applications={[{ id: 'app-1', title: 'Community mentor' }]}
        metadata={{ responseStatusOptions: ['awaiting_reply', 'interview'] }}
        mutating={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        queuedApplicationId="app-1"
        onQueueConsumed={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^New$/ }));

    await user.selectOptions(await screen.findByLabelText('Application'), 'app-1');
    await user.selectOptions(screen.getByLabelText('Status'), 'interview');
    await user.type(screen.getByLabelText('Attachments'), 'https://example.com/brief.pdf');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({
          applicationId: 'app-1',
          status: 'interview',
          attachments: ['https://example.com/brief.pdf'],
        }),
      );
    });
  });

  it('records spend entries against contracts', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <SpendPanel
        spend={{ totals: { lifetime: 0, yearToDate: 0 }, entries: [] }}
        contracts={[{ id: 'contract-1', title: 'Mentorship' }]}
        metadata={{ spendCategories: ['stipend', 'travel'] }}
        mutating={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        queuedContractId="contract-1"
        onQueueConsumed={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^New$/ }));

    await user.selectOptions(await screen.findByLabelText('Contract'), 'contract-1');
    await user.selectOptions(screen.getByLabelText('Category'), 'stipend');
    await user.type(screen.getByLabelText('Amount'), '150');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        'contract-1',
        expect.objectContaining({
          contractId: 'contract-1',
          category: 'stipend',
          amount: '150',
        }),
      );
    });
  });

  it('enables quick navigation between overview metrics', async () => {
    const user = userEvent.setup();
    const onSelectView = vi.fn();

    render(
      <OverviewPanel
        metrics={{ activeApplications: 1, interviewsScheduled: 0, openContracts: 1, hoursCommitted: 5 }}
        workspace={{
          applications: [
            {
              id: 'app-1',
              title: 'Community mentor',
              organizationName: 'Atlas Labs',
              status: 'submitted',
              appliedAt: '2024-03-01T00:00:00Z',
            },
          ],
          contracts: { open: [], finished: [] },
          spend: { totals: { lifetime: 0, yearToDate: 0 }, entries: [] },
        }}
        onSelectView={onSelectView}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Active apps\s+1/ }));
    expect(onSelectView).toHaveBeenCalledWith('apply');
  });
});
