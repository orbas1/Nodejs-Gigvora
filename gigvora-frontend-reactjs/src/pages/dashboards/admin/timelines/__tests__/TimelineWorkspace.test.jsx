import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelineWorkspace from '../TimelineWorkspace.jsx';

vi.mock('../../../../services/adminTimelines.js', () => {
  return {
    createAdminTimeline: vi.fn(),
    updateAdminTimeline: vi.fn(),
    deleteAdminTimeline: vi.fn(),
    fetchAdminTimelines: vi.fn(),
    fetchAdminTimeline: vi.fn(),
    createAdminTimelineEvent: vi.fn(),
    updateAdminTimelineEvent: vi.fn(),
    deleteAdminTimelineEvent: vi.fn(),
    reorderAdminTimelineEvents: vi.fn(),
  };
});

const services = await import('../../../../services/adminTimelines.js');

const baseTimelines = [
  {
    id: 'tl-1',
    name: 'Launch alpha',
    summary: 'Alpha rollout',
    status: 'active',
    visibility: 'internal',
  },
  {
    id: 'tl-2',
    name: 'Public launch',
    summary: 'Launch to everyone',
    status: 'draft',
    visibility: 'public',
  },
];

const baseTimelineDetail = {
  id: 'tl-1',
  name: 'Launch alpha',
  summary: 'Alpha rollout',
  status: 'active',
  visibility: 'internal',
  events: [
    {
      id: 'evt-1',
      title: 'Kick-off',
      status: 'planned',
      eventType: 'milestone',
      startDate: '2024-05-02T00:00:00.000Z',
      summary: 'Meet the squad',
      orderIndex: 0,
    },
    {
      id: 'evt-2',
      title: 'Customer preview',
      status: 'in_progress',
      eventType: 'announcement',
      startDate: '2024-05-10T00:00:00.000Z',
      summary: 'Preview with design partners',
      orderIndex: 1,
    },
  ],
};

function setupMocks({ timelines = baseTimelines, timelineDetail = baseTimelineDetail } = {}) {
  services.fetchAdminTimelines.mockResolvedValue({ results: timelines });
  services.fetchAdminTimeline.mockImplementation(async (id) => {
    if (id === timelineDetail.id) {
      return timelineDetail;
    }
    return { ...timelineDetail, id, name: `Timeline ${id}`, events: [] };
  });
  services.reorderAdminTimelineEvents.mockResolvedValue({ success: true });
}

beforeEach(() => {
  vi.resetAllMocks();
  setupMocks();
});

describe('TimelineWorkspace', () => {
  it('loads timelines and renders the selected timeline detail', async () => {
    render(<TimelineWorkspace />);

    expect(await screen.findByRole('button', { name: /Launch alpha/i })).toBeInTheDocument();
    await waitFor(() => expect(services.fetchAdminTimeline).toHaveBeenCalledWith('tl-1'));

    expect(screen.getByRole('heading', { name: /Kick-off/i })).toBeVisible();
    expect(screen.getByText(/Preview with design partners/i)).toBeVisible();
  });

  it('allows switching between timelines', async () => {
    render(<TimelineWorkspace />);

    const publicLaunchButton = await screen.findByRole('button', { name: /Public launch/i });
    await userEvent.click(publicLaunchButton);

    await waitFor(() => expect(services.fetchAdminTimeline).toHaveBeenCalledWith('tl-2'));
  });

  it('reorders events and persists order', async () => {
    render(<TimelineWorkspace />);

    const moveDownButtons = await screen.findAllByTitle(/Move down/i);
    await userEvent.click(moveDownButtons[0]);

    await waitFor(() => expect(services.reorderAdminTimelineEvents).toHaveBeenCalledWith('tl-1', ['evt-2', 'evt-1']));
  });

  it('opens preview dialog for events', async () => {
    render(<TimelineWorkspace />);

    const viewButtons = await screen.findAllByRole('button', { name: /View/i });
    await userEvent.click(viewButtons[0]);

    expect(await screen.findByRole('dialog')).toHaveTextContent('Kick-off');
  });
});
