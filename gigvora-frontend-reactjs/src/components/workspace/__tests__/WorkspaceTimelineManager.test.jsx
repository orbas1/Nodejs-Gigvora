import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WorkspaceTimelineManager from '../WorkspaceTimelineManager.jsx';

async function renderManager(props = {}) {
  let view;
  await act(async () => {
    view = render(<WorkspaceTimelineManager {...props} />);
  });
  return view;
}

describe('WorkspaceTimelineManager', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup({
      eventWrapper: async (callback) => {
        let result;
        await act(async () => {
          result = await callback();
        });
        return result;
      },
    });
  });

  it('creates a timeline entry with numeric conversions and success feedback', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const objects = [
      { id: 7, name: 'Discovery Workstream' },
      { id: 11, name: 'Kickoff workshop' },
    ];

    await renderManager({ onSave, objects, timeline: [] });

    await user.type(screen.getByLabelText('Title'), 'Design delivery');
    await user.selectOptions(screen.getByLabelText('Type'), 'task');
    await user.selectOptions(screen.getByLabelText('Status'), 'in_progress');
    const startValue = '2024-02-10T09:00';
    const endValue = '2024-02-12T17:30';
    await user.type(screen.getByLabelText('Start'), startValue);
    await user.type(screen.getByLabelText('End'), endValue);
    await user.type(screen.getByLabelText('Owner'), 'Carla Mendes');
    await user.selectOptions(screen.getByLabelText('Linked object'), '7');
    await user.type(screen.getByLabelText('Lane (0 for top)'), '2');
    await user.type(screen.getByLabelText('Progress %'), '45');

    await user.click(screen.getByRole('button', { name: 'Add entry' }));

    const feedback = await screen.findByText('Timeline entry added.');
    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload).toEqual({
      id: null,
      title: 'Design delivery',
      entryType: 'task',
      status: 'in_progress',
      startAt: new Date(startValue).toISOString(),
      endAt: new Date(endValue).toISOString(),
      ownerName: 'Carla Mendes',
      relatedObjectId: 7,
      lane: 2,
      progressPercent: 45,
    });

    expect(feedback).toBeInTheDocument();
  });

  it('renders existing entries on the gantt view and supports editing', async () => {
    const timelineEntry = {
      id: 5,
      title: 'Design kickoff',
      entryType: 'milestone',
      status: 'planned',
      startAt: '2024-01-10T09:00:00.000Z',
      endAt: '2024-01-12T09:00:00.000Z',
      ownerName: 'Delivery squad',
      relatedObjectId: 11,
      lane: 1,
      progressPercent: 60,
    };
    const objects = [
      { id: 11, name: 'Kickoff workshop' },
    ];
    const onSave = vi.fn().mockResolvedValue({});

    await renderManager({ timeline: [timelineEntry], objects, onSave });

    const [titleCell] = await screen.findAllByRole('cell', { name: 'Design kickoff' });
    expect(titleCell).toBeInTheDocument();
    const chartEntry = screen.getByTestId('timeline-chart-entry-5');
    expect(chartEntry).toHaveStyle({ left: '0%', width: '100%' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByLabelText('Linked object').value).toBe('11');
    expect(screen.getByLabelText('Start').value).toBe('2024-01-10T09:00');
    expect(screen.getByRole('button', { name: 'Update entry' })).toBeEnabled();

    await user.clear(screen.getByLabelText('Progress %'));
    await user.type(screen.getByLabelText('Progress %'), '75');
    await user.click(screen.getByRole('button', { name: 'Update entry' }));

    const updateFeedback = await screen.findByText('Timeline entry updated.');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      id: 5,
      progressPercent: 75,
    });
    expect(updateFeedback).toBeInTheDocument();
  });
});
