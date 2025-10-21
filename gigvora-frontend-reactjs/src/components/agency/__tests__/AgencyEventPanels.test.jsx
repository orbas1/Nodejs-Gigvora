import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgencyEventInsightsPanel from '../events/AgencyEventInsightsPanel.jsx';
import AgencyEventSettingsPanel from '../events/AgencyEventSettingsPanel.jsx';

describe('Agency event panels', () => {
  it('shows event insights with recommendations', () => {
    render(
      <AgencyEventInsightsPanel
        overview={{
          tasksCompletionRate: 86,
          tasksCompleted: 43,
          tasksTotal: 50,
          checklistCompletionRate: 72,
          checklistsCompleted: 18,
          checklistsTotal: 25,
          budgetVariance: 12000,
          budgetCurrency: 'USD',
        }}
        recommendations={[
          { id: '1', title: 'Schedule dry run', message: 'Host run-through with client team.', severity: 'medium' },
          { id: '2', title: 'Update assets', message: 'Creative approvals pending.', severity: 'low' },
        ]}
      />,
    );

    expect(screen.getByText('Programme health')).toBeInTheDocument();
    expect(screen.getByText('Task completion')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('Budget variance')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(within(list).getByText('Schedule dry run')).toBeInTheDocument();
    expect(within(list).getByText('Update assets')).toBeInTheDocument();
  });

  it('saves workspace defaults', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <AgencyEventSettingsPanel
        initialSettings={{
          includeArchivedByDefault: false,
          autoArchiveAfterDays: 60,
          defaultFormat: 'virtual',
          defaultVisibility: 'invite_only',
          defaultTimezone: 'UTC',
          requireCheckInNotes: false,
          allowedRoles: ['agency', 'company'],
        }}
        onSave={handleSave}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Default format'), 'hybrid');
    await user.selectOptions(screen.getByLabelText('Default visibility'), 'public');

    const timezoneField = screen.getByLabelText('Default timezone');
    await user.clear(timezoneField);
    await user.type(timezoneField, 'Europe/London');

    const archiveField = screen.getByLabelText('Auto-archive after (days)');
    await user.clear(archiveField);
    await user.type(archiveField, '45');

    await user.click(screen.getByRole('button', { name: 'Client company' }));
    await user.type(screen.getByPlaceholderText('Add a custom role'), 'Security');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await user.click(screen.getByRole('switch', { name: /Show archived events by default/i }));
    await user.click(screen.getByRole('switch', { name: /Require check-in notes/i }));

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        includeArchivedByDefault: true,
        autoArchiveAfterDays: 45,
        defaultFormat: 'hybrid',
        defaultVisibility: 'public',
        defaultTimezone: 'Europe/London',
        requireCheckInNotes: true,
        allowedRoles: ['agency', 'security'],
      }),
    );
  });
});
