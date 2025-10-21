import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CampaignForm from '../CampaignForm.jsx';
import CampaignList from '../CampaignList.jsx';
import CampaignPreview from '../CampaignPreview.jsx';
import CrmDrawer from '../CrmDrawer.jsx';
import DealColumn from '../DealColumn.jsx';
import DealForm from '../DealForm.jsx';
import DealPreview from '../DealPreview.jsx';
import FollowUpForm from '../FollowUpForm.jsx';
import FollowUpList from '../FollowUpList.jsx';
import FollowUpPreview from '../FollowUpPreview.jsx';
import ProposalForm from '../ProposalForm.jsx';
import ProposalList from '../ProposalList.jsx';
import ProposalPreview from '../ProposalPreview.jsx';
import SectionHeader from '../SectionHeader.jsx';
import SegmentBadge from '../SegmentBadge.jsx';
import SummaryCard from '../SummaryCard.jsx';

const currencyFormatter = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value ?? 0);
const percentFormatter = (value) => `${Math.round((value ?? 0) * 100)}%`;

describe('CRM forms', () => {
  it('submits campaign form and handles field updates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onCancel = vi.fn();
    render(
      <CampaignForm
        value={{ name: 'Launch', status: 'draft', targetService: '', launchDate: '2024-01-01' }}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      />,
    );

    await user.type(screen.getByPlaceholderText('Enterprise outbound sprint'), ' Q1');
    expect(onChange).toHaveBeenCalledWith('name', expect.stringContaining('Launch'));

    await user.selectOptions(screen.getByLabelText('Status'), ['active']);
    expect(onChange).toHaveBeenCalledWith('status', 'active');

    await user.click(screen.getByRole('button', { name: 'Save campaign' }));
    expect(onSubmit).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('supports deal form editing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <DealForm
        value={{
          title: 'New Retainer',
          clientName: 'Acme',
          pipelineValue: 20000,
          stageId: '1',
          winProbability: 0,
          expectedCloseDate: '2024-02-01',
          source: 'referral',
        }}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        stages={[{ id: '1', name: 'Discovery' }]}
        currency="USD"
        editingDeal={{ title: 'New Retainer' }}
      />,
    );

    await user.type(screen.getByLabelText('Client name'), ' LLC');
    expect(onChange).toHaveBeenCalledWith('clientName', expect.stringContaining('Acme'));

    const dealForm = screen.getByRole('button', { name: 'Update deal' }).closest('form');
    fireEvent.submit(dealForm);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('submits follow-up and proposal forms', async () => {
    const user = userEvent.setup();
    const followUpChange = vi.fn();
    const followUpSubmit = vi.fn((event) => event.preventDefault());
    render(
      <FollowUpForm
        value={{ dealId: '1', dueAt: '2024-01-10', channel: 'Email', note: 'Check in' }}
        deals={[{ id: '1', title: 'Pitch', clientName: 'Client' }]}
        onChange={followUpChange}
        onSubmit={followUpSubmit}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('Email, call, Slack'), ' + Call');
    expect(followUpChange).toHaveBeenCalledWith('channel', expect.stringContaining('Email'));

    const followUpForm = screen.getByRole('button', { name: 'Schedule' }).closest('form');
    fireEvent.submit(followUpForm);
    expect(followUpSubmit).toHaveBeenCalled();

    const proposalChange = vi.fn();
    const proposalSubmit = vi.fn((event) => event.preventDefault());
    render(
      <ProposalForm
        value={{ dealId: '1', title: 'Kickoff', status: 'draft', templateId: '', sentAt: '' }}
        deals={[{ id: '1', title: 'Pitch', clientName: 'Client' }]}
        templates={[{ id: 'tmp', name: 'Standard' }]}
        onChange={proposalChange}
        onSubmit={proposalSubmit}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('New proposal'), ' Plan');
    expect(proposalChange).toHaveBeenCalledWith('title', expect.stringContaining('Kickoff'));

    const proposalForm = screen.getByRole('button', { name: 'Save proposal' }).closest('form');
    fireEvent.submit(proposalForm);
    expect(proposalSubmit).toHaveBeenCalled();
  });
});

describe('CRM lists and previews', () => {
  it('interacts with campaign list and preview', async () => {
    const user = userEvent.setup();
    const inspect = vi.fn();
    const remove = vi.fn();
    const campaigns = [
      { id: 1, name: 'Outbound', status: 'active', targetService: 'CMO', launchDate: '2024-01-05' },
    ];

    const { rerender } = render(<CampaignList campaigns={campaigns} onInspect={inspect} onDelete={remove} />);

    await user.click(screen.getByText('Outbound'));
    expect(inspect).toHaveBeenCalledWith(campaigns[0]);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalledWith(campaigns[0]);

    rerender(<CampaignPreview campaign={{ ...campaigns[0], ownerName: 'Taylor', notes: 'Key launch' }} onDelete={remove} />);

    expect(screen.getByText('Taylor')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalled();
  });

  it('interacts with deals list and preview', async () => {
    const user = userEvent.setup();
    const inspect = vi.fn();
    const edit = vi.fn();
    const remove = vi.fn();
    const column = {
      id: 1,
      name: 'Discovery',
      totalValue: 40000,
      weightedValue: 20000,
      deals: [
        {
          id: 'deal-1',
          title: 'Retainer',
          clientName: 'Acme',
          pipelineValue: 20000,
          winProbability: 60,
          nextFollowUpAt: '2024-01-07T00:00:00Z',
          tags: ['priority'],
          stage: { winProbability: 40 },
        },
      ],
    };

    const { rerender } = render(
      <DealColumn
        column={column}
        currencyFormatter={currencyFormatter}
        percentFormatter={percentFormatter}
        onInspectDeal={inspect}
        onEditDeal={edit}
        onDeleteDeal={remove}
      />,
    );

    await user.click(screen.getByText('Retainer'));
    expect(inspect).toHaveBeenCalledWith(column.deals[0]);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(edit).toHaveBeenCalledWith(column.deals[0]);
    expect(inspect).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalledWith(column.deals[0]);

    rerender(
      <DealPreview
        deal={{
          ...column.deals[0],
          description: 'Detailed notes',
          expectedCloseDate: '2024-02-01',
          source: 'Referral',
        }}
        currencyFormatter={currencyFormatter}
        percentFormatter={percentFormatter}
        onEdit={edit}
        onDelete={remove}
      />,
    );

    expect(screen.getByText(currencyFormatter(20000))).toBeInTheDocument();
    expect(screen.getByText(percentFormatter(0.6))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(edit).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });

  it('handles follow ups and proposals', async () => {
    const user = userEvent.setup();
    const inspect = vi.fn();
    const complete = vi.fn();
    const remove = vi.fn();
    const followUps = [
      {
        id: 'fu-1',
        deal: { title: 'Retainer', clientName: 'Acme' },
        dueAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'scheduled',
        channel: 'Email',
        note: 'Send recap',
      },
    ];

    const { rerender } = render(
      <FollowUpList followUps={followUps} onInspect={inspect} onComplete={complete} onDelete={remove} />,
    );

    const card = screen.getByText('Retainer').closest('button');
    expect(card.className).toContain('rose');

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(complete).toHaveBeenCalledWith(followUps[0]);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalledWith(followUps[0]);

    rerender(<FollowUpPreview followUp={followUps[0]} onComplete={complete} onDelete={remove} />);
    await user.click(screen.getByRole('button', { name: 'Mark done' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(complete).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();

    const proposals = [
      {
        id: 'prop-1',
        title: 'Proposal 1',
        status: 'sent',
        sentAt: '2024-01-05',
        deal: { clientName: 'Client' },
      },
    ];

    rerender(<ProposalList proposals={proposals} onInspect={inspect} onDelete={remove} />);
    await user.click(screen.getByText('Proposal 1'));
    expect(inspect).toHaveBeenCalledWith(proposals[0]);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalledWith(proposals[0]);

    rerender(
      <ProposalPreview
        proposal={{ ...proposals[0], template: { name: 'Standard' }, notes: 'Summary' }}
        onDelete={remove}
      />,
    );
    expect(screen.getByText('Standard')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalled();
  });
});

describe('CRM primitives', () => {
  it('renders section header and summary components', () => {
    render(
      <SectionHeader title="Pipeline" description="Monitor health" action={<button type="button">Action</button>} />,
    );
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Monitor health')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();

    render(<SegmentBadge tone="emerald">Active</SegmentBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();

    render(<SummaryCard label="Deals" value="12" helper="This quarter" />);
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('This quarter')).toBeInTheDocument();
  });

  it('opens and closes CRM drawer', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CrmDrawer open title="Drawer" subtitle="Details" onClose={onClose}>
        <p>Content</p>
      </CrmDrawer>,
    );

    expect(await screen.findByText('Content')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close panel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
