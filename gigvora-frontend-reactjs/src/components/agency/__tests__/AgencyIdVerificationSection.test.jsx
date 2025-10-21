import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgencyIdVerificationSection from '../id-verification/AgencyIdVerificationSection.jsx';

vi.mock('../../../hooks/useSession.js', () => ({
  default: () => ({ session: { memberships: ['agency_admin'] } }),
}));

const mocks = vi.hoisted(() => {
  const listIdentityVerifications = vi.fn();
  const fetchIdentityVerificationSummary = vi.fn();
  const createIdentityVerification = vi.fn();
  const updateIdentityVerification = vi.fn();
  const createIdentityVerificationEvent = vi.fn();
  const fetchIdentityVerificationSettings = vi.fn();
  const updateIdentityVerificationSettings = vi.fn();

  return {
    listIdentityVerifications,
    fetchIdentityVerificationSummary,
    createIdentityVerification,
    updateIdentityVerification,
    createIdentityVerificationEvent,
    fetchIdentityVerificationSettings,
    updateIdentityVerificationSettings,
  };
});

vi.mock('../../../services/identityVerification.js', () => mocks);

describe('Agency ID verification hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const baseVerification = {
      id: 1,
      userId: 501,
      profileId: 2001,
      fullName: 'Jane Smith',
      status: 'pending',
      riskLevel: 'low',
      riskScore: 520,
      reviewerId: 9,
      assignedReviewerId: 9,
      reviewer: { id: 9, name: 'Dana Ops', email: 'dana@example.com' },
      submittedAt: '2024-05-01T12:00:00Z',
      nextReviewAt: '2024-05-04T12:00:00Z',
      reverificationIntervalDays: 30,
      requiresManualReview: true,
      requiresReverification: false,
      tags: ['priority'],
      documentFrontKey: 'doc-front',
      documentBackKey: 'doc-back',
      selfieKey: 'selfie-1',
      typeOfId: 'passport',
      issuingCountry: 'US',
      issuedAt: '2022-01-01',
      expiresAt: '2032-01-01',
    };

    mocks.listIdentityVerifications.mockImplementation((params = {}) => {
      if (params.includeEvents) {
        return Promise.resolve({
          data: [
            {
              ...baseVerification,
              events: [
                {
                  id: 'evt-1',
                  eventType: 'note',
                  notes: 'Manual review complete',
                  createdAt: '2024-05-02T12:00:00Z',
                  actor: { id: 9, name: 'Dana Ops' },
                },
              ],
            },
          ],
        });
      }
      return Promise.resolve({
        data: [baseVerification],
        reviewers: [{ id: 9, name: 'Dana Ops', email: 'dana@example.com' }],
        filters: { statuses: ['pending', 'verified'], riskLevels: ['low', 'high'] },
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      });
    });

    mocks.fetchIdentityVerificationSummary.mockResolvedValue({
      manualBacklog: 2,
      averageReviewHours: 36,
      reverificationQueue: 1,
    });

    mocks.fetchIdentityVerificationSettings.mockResolvedValue({
      settings: {
        automationEnabled: true,
        requireSelfie: true,
        autoAssignReviewerId: 9,
        manualReviewThreshold: 600,
        reminderCadenceHours: 48,
        reminderChannels: 'email',
        escalateAfterHours: 120,
        allowedDocumentTypes: 'passport',
        autoArchiveAfterDays: 365,
        autoReminderTemplateKey: 'templates/reminder',
        allowProvisionalPass: true,
      },
    });

    mocks.updateIdentityVerificationSettings.mockResolvedValue();
    mocks.createIdentityVerification.mockResolvedValue({ id: 2 });
    mocks.updateIdentityVerification.mockImplementation((id, payload) =>
      Promise.resolve({ id, ...payload }),
    );
    mocks.createIdentityVerificationEvent.mockResolvedValue({});
  });

  it('manages queue, detail, settings, and activity flows', async () => {
    const user = userEvent.setup();

    render(<AgencyIdVerificationSection workspaceId="42" workspaceSlug="atlas-agency" />);

    await waitFor(() => expect(mocks.listIdentityVerifications).toHaveBeenCalled());
    expect(await screen.findByText('Identity reviews')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByText('Manual review only')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await user.click(screen.getByRole('button', { name: 'Inspect' }));
    const detailDialog = await screen.findByRole('dialog');
    const statusSelect = within(detailDialog).getByLabelText('Status', { selector: 'select' });
    await user.selectOptions(statusSelect, 'verified');
    await user.click(within(detailDialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mocks.updateIdentityVerification).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'verified' }),
    ));

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'New check' }));
    const createDialog = await screen.findByRole('dialog', { name: 'New ID check' });
    await user.type(within(createDialog).getByLabelText('User ID'), '101');
    await user.type(within(createDialog).getByLabelText('Full name'), 'Casey Rivers');
    await user.click(within(createDialog).getByRole('button', { name: 'Next' }));
    await user.type(within(createDialog).getByLabelText('Document front key'), 'front-key');
    await user.click(within(createDialog).getByRole('button', { name: 'Next' }));
    await user.click(within(createDialog).getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(mocks.createIdentityVerification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 101, fullName: 'Casey Rivers', workspaceId: 42 }),
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    const automationHeading = await screen.findByText('Automation rules');
    const settingsForm = automationHeading.closest('form');
    const cadenceField = within(settingsForm).getByLabelText('Reminder cadence (hrs)');
    await user.clear(cadenceField);
    await user.type(cadenceField, '24');
    await user.click(within(settingsForm).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.updateIdentityVerificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reminderCadenceHours: 24 }),
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(await screen.findByText('Manual review complete')).toBeInTheDocument();
  });
});
