import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserLaunchpadJobsSection from '../UserLaunchpadJobsSection.jsx';
import {
  fetchLaunchpadApplications,
  submitTalentApplication,
  submitEmployerBrief,
  recordEmployerPlacement,
  updateLaunchpadApplicationStatus,
} from '../../../../services/launchpad.js';

vi.mock('../../../../services/launchpad.js', () => ({
  __esModule: true,
  fetchLaunchpadApplications: vi.fn(),
  submitTalentApplication: vi.fn(),
  submitEmployerBrief: vi.fn(),
  recordEmployerPlacement: vi.fn(),
  updateLaunchpadApplicationStatus: vi.fn(),
}));

describe('UserLaunchpadJobsSection', () => {
  const baseApplication = {
    id: 555,
    launchpad: { id: 77, title: 'Experience Launchpad' },
    status: 'screening',
    recommendedStatus: 'interview',
    qualificationScore: 0.82,
    applicantFirstName: 'Jordan',
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchLaunchpadApplications.mockResolvedValue({ items: [{ ...baseApplication }] });
    submitTalentApplication.mockResolvedValue({});
    submitEmployerBrief.mockResolvedValue({});
    recordEmployerPlacement.mockResolvedValue({});
    updateLaunchpadApplicationStatus.mockResolvedValue({});
  });

  it('persists notes from the status wizard when applying a new state', async () => {
    const user = userEvent.setup();
    render(<UserLaunchpadJobsSection applications={[baseApplication]} />);

    const wizardTrigger = await screen.findByRole('button', { name: /status wizard/i });
    await user.click(wizardTrigger);

    // Ensure the wizard renders before interacting with controls
    await screen.findByText(/concierge status wizard/i);
    const acceptedOption = (await screen.findAllByRole('radio')).find(
      (radio) => radio.getAttribute('value') === 'accepted',
    );
    expect(acceptedOption).toBeTruthy();
    await user.click(acceptedOption);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    const notesField = await screen.findByPlaceholderText(/record why the status changed/i);
    await user.type(notesField, 'Candidate ready for onboarding.');

    await user.click(screen.getByRole('button', { name: /apply status/i }));

    await waitFor(() => {
      expect(updateLaunchpadApplicationStatus).toHaveBeenCalledTimes(1);
    });

    const [applicationId, payload] = updateLaunchpadApplicationStatus.mock.calls[0];
    expect(applicationId).toBe(555);
    expect(payload).toMatchObject({ status: 'accepted', notes: 'Candidate ready for onboarding.' });

    await waitFor(() => {
      expect(screen.queryByText(/concierge status wizard/i)).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(/application status updated with programme notes/i),
    ).toBeInTheDocument();
  });
});
