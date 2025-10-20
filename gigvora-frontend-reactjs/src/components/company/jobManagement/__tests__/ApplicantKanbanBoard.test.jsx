import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ApplicantKanbanBoard from '../ApplicantKanbanBoard.jsx';

const sampleColumns = [
  {
    status: 'submitted',
    label: 'Submitted',
    applications: [
      {
        id: '1',
        candidateName: 'Jordan Example',
        jobTitle: 'Product Designer',
        submittedAt: '2024-05-01T12:00:00.000Z',
      },
    ],
  },
  {
    status: 'interview',
    label: 'Interview',
    applications: [],
  },
];

describe('ApplicantKanbanBoard', () => {
  it('renders applications in their respective columns', () => {
    render(<ApplicantKanbanBoard columns={sampleColumns} />);

    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Jordan Example')).toBeInTheDocument();
    expect(screen.getByText('Product Designer')).toBeInTheDocument();
  });

  it('invokes onMoveApplication when selecting a new stage from the quick action menu', () => {
    const handleMove = vi.fn();
    render(<ApplicantKanbanBoard columns={sampleColumns} onMoveApplication={handleMove} />);

    const select = screen.getByLabelText(/Move application for Jordan Example/i);
    fireEvent.change(select, { target: { value: 'interview' } });

    expect(handleMove).toHaveBeenCalledWith('1', 'interview');
  });

  it('drags an application card into another column and triggers onMoveApplication', () => {
    const handleMove = vi.fn();
    render(<ApplicantKanbanBoard columns={sampleColumns} onMoveApplication={handleMove} />);

    const applicationCard = screen.getByTestId('kanban-application-1');
    const interviewColumn = screen.getByTestId('kanban-column-interview');

    const dataTransfer = {
      data: {},
      setData(key, value) {
        this.data[key] = value;
      },
      getData(key) {
        return this.data[key];
      },
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    fireEvent.dragStart(applicationCard, { dataTransfer });
    fireEvent.drop(interviewColumn, { dataTransfer });

    expect(handleMove).toHaveBeenCalledWith('1', 'interview');
  });
});
