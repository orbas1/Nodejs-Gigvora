import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CreationStudioSection from '../CreationStudioSection.jsx';
import CreationStudioSummary from '../CreationStudioSummary.jsx';
import CreationStudioBoard from '../creation-studio/CreationStudioBoard.jsx';
import CreationStudioFormDrawer from '../creation-studio/CreationStudioFormDrawer.jsx';
import CreationStudioPreviewDrawer from '../creation-studio/CreationStudioPreviewDrawer.jsx';
import {
  fetchCompanyCreationStudioItems,
  publishCompanyCreationStudioItem,
  deleteCompanyCreationStudioItem,
  shareCompanyCreationStudioItem,
  createCompanyCreationStudioItem,
  updateCompanyCreationStudioItem,
} from '../../../services/creationStudio.js';

vi.mock('../../../services/creationStudio.js', () => ({
  fetchCompanyCreationStudioItems: vi.fn(),
  publishCompanyCreationStudioItem: vi.fn(),
  deleteCompanyCreationStudioItem: vi.fn(),
  shareCompanyCreationStudioItem: vi.fn(),
  createCompanyCreationStudioItem: vi.fn(),
  updateCompanyCreationStudioItem: vi.fn(),
}));

const baseOverview = {
  summary: {
    drafts: 2,
    scheduled: 1,
    published: 4,
  },
  typeSummaries: [
    { type: 'job', total: 2, byStatus: { draft: 1, scheduled: 1, published: 0 } },
    { type: 'gig', total: 1, byStatus: { draft: 0, scheduled: 0, published: 1 } },
  ],
  upcoming: [
    {
      id: 'launch-1',
      type: 'job',
      title: 'Launch new AI lead role',
      status: 'scheduled',
      launchDate: '2030-04-02T10:00:00.000Z',
    },
  ],
  items: [
    {
      id: 'job-1',
      type: 'job',
      status: 'draft',
      title: 'Founding product designer',
      summary: 'Early design role to shape Gigvora creation studio.',
      tags: ['Design', 'Founding'],
      updatedAt: '2030-03-25T12:00:00.000Z',
    },
  ],
};

describe('Creation studio experience', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads items, supports filtering, and handles actions in CreationStudioSection', async () => {
    const user = userEvent.setup();
    const mockItems = [
      {
        id: 'job-1',
        type: 'job',
        status: 'draft',
        title: 'Founding product designer',
        summary: 'Early design role to shape Gigvora creation studio.',
        tags: ['Design', 'Founding'],
        updatedAt: '2030-03-25T12:00:00.000Z',
      },
      {
        id: 'job-2',
        type: 'job',
        status: 'scheduled',
        title: 'AI project manager',
        summary: 'Coordinate AI delivery pods.',
        tags: ['AI'],
        updatedAt: '2030-03-26T10:00:00.000Z',
      },
    ];

    fetchCompanyCreationStudioItems.mockResolvedValue({ items: mockItems });
    publishCompanyCreationStudioItem.mockResolvedValue({ ok: true });
    shareCompanyCreationStudioItem.mockResolvedValue({ shareUrl: 'https://gigvora.com/share/job-2' });
    deleteCompanyCreationStudioItem.mockResolvedValue({ ok: true });

    Object.defineProperty(window.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <CreationStudioSection
          overview={baseOverview}
          workspaceOptions={[{ id: '1', name: 'Core workspace' }]}
          workspaceId="1"
          permissions={{ canManage: true }}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchCompanyCreationStudioItems).toHaveBeenCalled();
    });

    expect(await screen.findByText('Founding product designer')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /scheduled/i }));

    await waitFor(() => {
      expect(fetchCompanyCreationStudioItems).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'scheduled' }),
        expect.any(Object),
      );
    });

    const scheduledCard = await screen.findByText('AI project manager');
    const cardSection = scheduledCard.closest('article');
    expect(cardSection).toBeTruthy();
    if (!cardSection) {
      throw new Error('Card container missing');
    }

    const publishButton = within(cardSection).getByRole('button', { name: /publish/i });
    await user.click(publishButton);
    await waitFor(() => {
      expect(publishCompanyCreationStudioItem).toHaveBeenCalledWith('job-2', { publishAt: null });
    });

    const shareButton = within(cardSection).getByRole('button', { name: /share/i });
    await user.click(shareButton);
    await waitFor(() => {
      expect(shareCompanyCreationStudioItem).toHaveBeenCalledWith('job-2', { workspaceId: 1 });
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://gigvora.com/share/job-2');

    const deleteButton = within(cardSection).getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    await waitFor(() => {
      expect(deleteCompanyCreationStudioItem).toHaveBeenCalledWith('job-2');
    });
  });

  it('renders CreationStudioSummary with actionable insights', () => {
    render(
      <MemoryRouter>
        <CreationStudioSummary overview={baseOverview} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Active drafts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Launch new AI lead role')).toBeInTheDocument();
  });

  it('protects management actions when user lacks permission in CreationStudioBoard', async () => {
    const user = userEvent.setup();
    const items = [
      {
        id: 'job-3',
        type: 'job',
        status: 'draft',
        title: 'Operations coordinator',
      },
    ];

    render(
      <CreationStudioBoard
        items={items}
        loading={false}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        search=""
        onSearchChange={() => {}}
        onResetSearch={() => {}}
        onCreate={vi.fn()}
        onPreview={vi.fn()}
        onEdit={vi.fn()}
        onPublish={vi.fn()}
        onDelete={vi.fn()}
        canManage={false}
        activeType="job"
        subTypes={[]}
        onTypeChange={() => {}}
      />,
    );

    expect(screen.queryByRole('button', { name: /^new$/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /preview/i }));
  });

  it('submits new creation through CreationStudioFormDrawer when authorised', async () => {
    const user = userEvent.setup();
    createCompanyCreationStudioItem.mockResolvedValue({ id: 'abc' });

    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <CreationStudioFormDrawer
        open
        mode="create"
        item={null}
        initialType="job"
        workspaceId="42"
        onClose={onClose}
        onSaved={onSaved}
        canManage
      />,
    );

    await user.type(screen.getByLabelText(/^Title$/i), 'Enterprise product manager');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(createCompanyCreationStudioItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Enterprise product manager', workspaceId: 42 }),
      );
    });
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows permission error in CreationStudioFormDrawer when user cannot manage', async () => {
    const user = userEvent.setup();

    render(
      <CreationStudioFormDrawer
        open
        mode="create"
        item={null}
        initialType="job"
        workspaceId="42"
        onClose={vi.fn()}
        onSaved={vi.fn()}
        canManage={false}
      />,
    );

    await user.type(screen.getByLabelText(/^Title$/i), 'Growth marketer');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    expect(await screen.findByText('You do not have permission to save this item.')).toBeInTheDocument();
    expect(createCompanyCreationStudioItem).not.toHaveBeenCalled();
  });

  it('renders CreationStudioPreviewDrawer with provided content', () => {
    render(
      <CreationStudioPreviewDrawer
        open
        item={{
          title: 'Preview launch',
          summary: 'Review the complete creation before publishing.',
          content: '<p>Launch content</p>',
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Preview launch')).toBeInTheDocument();
    expect(screen.getByText(/complete creation/i)).toBeInTheDocument();
  });

  it('updates an existing creation when editing', async () => {
    const user = userEvent.setup();
    updateCompanyCreationStudioItem.mockResolvedValue({ id: 'job-1' });

    render(
      <CreationStudioFormDrawer
        open
        mode="edit"
        item={{ id: 'job-1', title: 'Existing job', type: 'job' }}
        initialType="job"
        workspaceId="77"
        onClose={vi.fn()}
        onSaved={vi.fn()}
        canManage
      />,
    );

    await user.clear(screen.getByLabelText(/^Title$/i));
    await user.type(screen.getByLabelText(/^Title$/i), 'Existing job updated');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(updateCompanyCreationStudioItem).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({ title: 'Existing job updated', workspaceId: 77 }),
      );
    });
  });
});
