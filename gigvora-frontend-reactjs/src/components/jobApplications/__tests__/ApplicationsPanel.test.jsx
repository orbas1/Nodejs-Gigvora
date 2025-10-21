import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ApplicationsPanel from '../panels/ApplicationsPanel.jsx';

describe('ApplicationsPanel', () => {
  it('shows an empty state and triggers create handler', async () => {
    const onCreate = vi.fn();

    render(
      <ApplicationsPanel
        applications={[]}
        onCreate={onCreate}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    expect(screen.getByText('No applications yet. Start by adding a role.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /new application/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders application details and wires action buttons', async () => {
    const onEdit = vi.fn();
    const onArchive = vi.fn();
    const application = {
      id: 'app-1',
      status: 'interviewing',
      submittedAt: '2024-05-18T10:00:00Z',
      sourceChannel: 'Referral',
      detail: {
        title: 'Senior Engineer',
        companyName: 'Acme',
        salary: { min: 90000, max: 120000, currency: 'USD' },
      },
    };

    render(
      <ApplicationsPanel
        applications={[application]}
        onCreate={vi.fn()}
        onEdit={onEdit}
        onArchive={onArchive}
      />,
    );

    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText(/\$90,000 – \$120,000/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(application);

    await userEvent.click(screen.getByRole('button', { name: /archive/i }));
    expect(onArchive).toHaveBeenCalledWith(application);
  });
});
