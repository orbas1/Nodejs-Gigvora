import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobApplyDrawer from '../JobApplyDrawer.jsx';

describe('JobApplyDrawer', () => {
  it('walks through the application flow and submits data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <JobApplyDrawer
        open
        onClose={() => {}}
        job={{ id: 'role-7', title: 'Senior Product Manager' }}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/Full name/i), 'Taylor Swift');
    await user.type(screen.getByLabelText(/Email/i), 'taylor@example.com');

    await user.click(screen.getByRole('button', { name: /next step/i }));

    await user.type(screen.getByLabelText(/Cover letter/i), 'Excited to drive marketplace growth.');
    const achievementField = screen.getByPlaceholderText('Share a measurable achievement, result, or story.');
    await user.type(achievementField, 'Launched a hiring marketplace to 100k users.');

    await user.click(screen.getByRole('button', { name: /next step/i }));

    await user.type(screen.getByLabelText(/Target start date/i), '2024-06-01');
    await user.type(screen.getByLabelText(/Notes & flexibility/i), 'Two weeks notice.');

    await user.click(screen.getByRole('button', { name: /next step/i }));

    expect(screen.getByText('Snapshot')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit application/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.jobId).toBe('role-7');
    expect(payload.fullName).toBe('Taylor Swift');
    expect(payload.coverLetter).toContain('Excited to drive marketplace growth');
    expect(payload.achievements.some((item) => item.includes('100k users'))).toBe(true);
  });

  it('requires consent before final submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <JobApplyDrawer
        open
        onClose={() => {}}
        job={{ id: 'role-8', title: 'Design Director' }}
        onSubmit={onSubmit}
        defaultValues={{ consentToShareProfile: false, fullName: 'Jordan', email: 'jordan@example.com', coverLetter: 'Hello!' }}
      />
    );

    await user.click(screen.getByRole('button', { name: /next step/i }));
    await user.click(screen.getByRole('button', { name: /next step/i }));
    await user.click(screen.getByRole('button', { name: /next step/i }));

    const consentCheckbox = within(screen.getByText(/authorize Gigvora/).closest('label')).getByRole('checkbox');
    expect(consentCheckbox).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Consent is required/)).toBeInTheDocument();

    await user.click(consentCheckbox);
    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
