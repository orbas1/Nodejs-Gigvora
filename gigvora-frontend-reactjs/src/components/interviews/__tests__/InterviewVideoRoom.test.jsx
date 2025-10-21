import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InterviewVideoRoom from '../InterviewVideoRoom.jsx';

describe('InterviewVideoRoom', () => {
  const room = {
    stage: 'Panel interview',
    status: 'in_progress',
    scheduledAt: '2024-05-02T10:00:00Z',
    participants: [
      {
        id: 'participant-team',
        name: 'Alex Johnson',
        role: 'Hiring manager',
        status: 'joined',
        videoDevice: 'HD Cam',
        participantType: 'team',
        isModerator: true,
      },
      {
        id: 'participant-candidate',
        name: 'Jamie Rivera',
        role: 'Product designer',
        status: 'connecting',
        videoDevice: 'Logitech C920',
        participantType: 'candidate',
      },
    ],
    checklist: [
      {
        id: 'checklist-1',
        label: 'Share role overview',
        description: 'Walk through the scope and success metrics.',
        ownerName: 'Alex Johnson',
        status: 'pending',
      },
    ],
  };

  const workflow = {
    lanes: [
      {
        id: 'lane-screening',
        name: 'Screening',
        slaMinutes: 180,
        cards: [
          {
            id: 'card-1',
            candidateName: 'Jordan Blake',
            jobTitle: 'Product Designer',
            stage: 'Panel',
            status: 'awaiting_feedback',
            scheduledAt: '2024-05-01T15:00:00Z',
          },
        ],
      },
    ],
  };

  it('renders the interview room details, participants, and workflow lanes', () => {
    render(
      <InterviewVideoRoom
        room={room}
        workflow={workflow}
        loading={false}
        error={null}
        onRefresh={vi.fn()}
        onChecklistToggle={vi.fn()}
      />,
    );

    expect(screen.getByText('Panel interview')).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
    expect(screen.getByText('Share role overview')).toBeInTheDocument();
  });

  it('supports refreshing room data and toggling checklist items', () => {
    const onRefresh = vi.fn();
    const onChecklistToggle = vi.fn();

    render(
      <InterviewVideoRoom
        room={room}
        workflow={workflow}
        loading={false}
        error={null}
        onRefresh={onRefresh}
        onChecklistToggle={onChecklistToggle}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh data/i }));
    expect(onRefresh).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    expect(onChecklistToggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'checklist-1' }),
      'completed',
    );
  });
});
