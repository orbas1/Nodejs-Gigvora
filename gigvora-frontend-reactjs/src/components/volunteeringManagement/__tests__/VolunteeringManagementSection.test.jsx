import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import VolunteeringManagementSection from '../VolunteeringManagementSection.jsx';
import {
  createVolunteerApplication,
  createVolunteerResponse,
  createVolunteerSpend,
} from '../../../services/volunteeringManagement.js';

vi.mock('../../../services/volunteeringManagement.js', () => ({
  createVolunteerApplication: vi.fn(),
  createVolunteerResponse: vi.fn(),
  createVolunteerSpend: vi.fn(),
}));

vi.mock('../forms/RolePicker.jsx', () => ({
  default: ({ value, onChange, disabled }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange({ id: 'role-99', title: 'Impact Lead', organization: 'Civic Org' })}
    >
      {value?.title ?? 'Pick role'}
    </button>
  ),
}));

const userId = 'user-77';

const baseData = {
  summary: {
    openApplications: 1,
    outstandingRequests: 2,
    openContracts: 0,
    averageReviewRating: 4.3,
  },
  applications: [
    {
      id: 'app-1',
      status: 'in_review',
      availabilityHoursPerWeek: 5,
      submittedAt: '2024-05-01T10:00:00.000Z',
      role: { id: 'role-1', title: 'Mentor Catalyst', organization: 'Impact Org' },
      responses: [],
      contract: null,
    },
  ],
  openContracts: [],
  finishedContracts: [],
  spend: { entries: [], totalsByCurrency: { USD: 0 } },
  reviews: [],
};

describe('VolunteeringManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates applications, logs partner replies, and records spend', async () => {
    createVolunteerApplication.mockResolvedValue({ id: 'app-new' });
    createVolunteerResponse.mockResolvedValue({ id: 'resp-1' });
    createVolunteerSpend.mockResolvedValue({ id: 'spend-1' });

    const onRefresh = vi.fn(() => Promise.resolve());

    render(<VolunteeringManagementSection userId={userId} data={baseData} onRefresh={onRefresh} />);

    const newButtons = screen.getAllByRole('button', { name: 'New' });
    await userEvent.click(newButtons[0]);

    const applicationDialog = await screen.findByRole('dialog', { name: /new application/i });
    await userEvent.click(within(applicationDialog).getByRole('button', { name: 'Pick role' }));
    await userEvent.click(within(applicationDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createVolunteerApplication).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ volunteeringRoleId: 'role-99', status: 'draft' }),
      );
    });
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    onRefresh.mockClear();

    const respondButton = screen.getByRole('button', { name: 'Respond' });
    await userEvent.click(respondButton);

    const responseDialog = await screen.findByRole('dialog', { name: /partner reply/i });
    const messageField = within(responseDialog).getByLabelText('Message');
    await userEvent.type(messageField, 'Thanks for the quick update');
    await userEvent.type(within(responseDialog).getByLabelText('Request'), 'Schedule kickoff');
    await userEvent.click(within(responseDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createVolunteerResponse).toHaveBeenCalledWith(
        userId,
        'app-1',
        expect.objectContaining({
          responseType: 'message',
          message: 'Thanks for the quick update',
          requestedAction: 'Schedule kickoff',
        }),
      );
    });
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    onRefresh.mockClear();

    const spendButton = screen.getByRole('button', { name: 'Spend' });
    await userEvent.click(spendButton);

    const spendDialog = await screen.findByRole('dialog', { name: /spend entry/i });
    const amountField = within(spendDialog).getByLabelText('Amount');
    await userEvent.clear(amountField);
    await userEvent.type(amountField, '125');
    await userEvent.selectOptions(within(spendDialog).getByLabelText('Category'), 'stipend');
    await userEvent.type(within(spendDialog).getByLabelText('Description'), 'Travel stipend');
    await userEvent.click(within(spendDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createVolunteerSpend).toHaveBeenCalledWith(
        userId,
        'app-1',
        expect.objectContaining({ amount: 125, category: 'stipend' }),
      );
    });
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});
