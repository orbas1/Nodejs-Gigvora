import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CandidateList from '../CandidateList.jsx';
import CandidateNotesPanel from '../CandidateNotesPanel.jsx';
import CandidateResponsesPanel from '../CandidateResponsesPanel.jsx';
import InterviewManager from '../InterviewManager.jsx';
import JobHistoryTimeline from '../JobHistoryTimeline.jsx';
import KeywordMatcher from '../KeywordMatcher.jsx';

const applications = [
  {
    id: 'app-1',
    candidate: { name: 'Ada Lovelace' },
    jobTitle: 'Engineering Lead',
    status: 'submitted',
    submittedAt: '2024-05-01T09:00:00.000Z',
    decisionAt: '2024-05-05T15:00:00.000Z',
    notes: [{ id: 'note-1' }],
    interviews: [{ id: 'interview-1' }],
  },
];

describe('Candidate experience components', () => {
  it('renders candidate list and handles selection', () => {
    const handleSelect = vi.fn();
    render(<CandidateList candidates={applications} onSelect={handleSelect} selectedId="app-1" />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ada Lovelace'));
    expect(handleSelect).toHaveBeenCalledWith(applications[0]);
  });

  it('allows adding notes and sorts the feed', async () => {
    const handleAdd = vi.fn().mockResolvedValue();
    render(
      <CandidateNotesPanel
        notes={[
          { id: 'note-1', summary: 'Earlier', createdAt: '2024-05-01T09:00:00.000Z' },
          { id: 'note-2', summary: 'Latest', createdAt: '2024-05-03T09:00:00.000Z' },
        ]}
        applications={applications}
        onAdd={handleAdd}
      />,
    );

    fireEvent.change(screen.getByLabelText('Candidate'), { target: { value: 'app-1' } });
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'Great call' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Save$/i }));

    expect(handleAdd).toHaveBeenCalledWith({
      applicationId: 'app-1',
      summary: 'Great call',
      stage: '',
      sentiment: 'neutral',
      nextSteps: '',
    });
    expect(screen.getAllByText(/Latest|Earlier/)[0]).toHaveTextContent('Latest');
  });

  it('sends candidate responses and resets the form', async () => {
    const handleSend = vi.fn().mockResolvedValue();
    render(
      <CandidateResponsesPanel
        applications={applications}
        responses={[
          {
            id: 'response-1',
            channel: 'message',
            direction: 'outbound',
            sentAt: '2024-05-04T10:00:00.000Z',
            message: 'Hello',
          },
        ]}
        onSend={handleSend}
      />,
    );

    fireEvent.change(screen.getByLabelText('Candidate'), { target: { value: 'app-1' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Next step' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send$/i }));

    await waitFor(() => expect(handleSend).toHaveBeenCalled());
    expect(handleSend).toHaveBeenCalledWith({ applicationId: 'app-1', channel: 'message', message: 'Next step' });
    expect(screen.getByText(/Sent • message/)).toBeInTheDocument();
  });

  it('schedules interviews and completes them', async () => {
    const handleSchedule = vi.fn().mockResolvedValue();
    const handleUpdate = vi.fn();
    render(
      <InterviewManager
        applications={applications}
        interviews={[{ id: 'int-1', interviewStage: 'Final', scheduledAt: '2024-05-06T12:00:00.000Z' }]}
        onSchedule={handleSchedule}
        onUpdate={handleUpdate}
      />,
    );

    fireEvent.change(screen.getByLabelText('Candidate'), { target: { value: 'app-1' } });
    fireEvent.change(screen.getByLabelText('Date & time'), { target: { value: '2024-05-10T12:00' } });
    fireEvent.click(screen.getByRole('button', { name: /^Schedule$/i }));
    await waitFor(() => expect(handleSchedule).toHaveBeenCalled());
    expect(handleSchedule).toHaveBeenCalledWith({
      applicationId: 'app-1',
      interviewStage: 'Interview',
      scheduledAt: '2024-05-10T12:00',
      durationMinutes: 45,
    });

    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'int-1', interviewStage: 'Final' }),
    );
  });

  it('shows timeline entries or empty state', () => {
    const { rerender } = render(<JobHistoryTimeline items={[]} />);
    expect(screen.getByText(/No activity/i)).toBeInTheDocument();

    rerender(
      <JobHistoryTimeline
        items={[{ id: '1', summary: 'Created', createdAt: '2024-05-01T09:00:00.000Z', payload: { status: 'draft' } }]}
      />,
    );
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText(/status/)).toBeInTheDocument();
  });

  it('updates keywords and lists matches', async () => {
    const handleUpdate = vi.fn().mockResolvedValue();
    render(
      <KeywordMatcher
        keywords={[{ keyword: 'design' }]}
        matches={[{ applicationId: 'app-1', candidateName: 'Ada Lovelace', score: 0.84, matchedKeywords: ['design'] }]}
        onUpdate={handleUpdate}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Add keywords'), { target: { value: 'design, research' } });
    fireEvent.submit(screen.getByText('Update'));

    expect(handleUpdate).toHaveBeenCalledWith([
      { keyword: 'design', weight: 1 },
      { keyword: 'research', weight: 1 },
    ]);
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
  });
});
