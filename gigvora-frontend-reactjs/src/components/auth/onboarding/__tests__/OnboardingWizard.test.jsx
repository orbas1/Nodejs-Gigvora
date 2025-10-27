import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../../../../services/onboarding.js', () => ({
  listOnboardingPersonas: vi.fn(),
  createOnboardingJourney: vi.fn(),
}));

import OnboardingWizard from '../OnboardingWizard.jsx';
import {
  listOnboardingPersonas,
  createOnboardingJourney,
} from '../../../../services/onboarding.js';

const apiPersona = {
  id: 'visionary-founder',
  title: 'Visionary founder',
  subtitle: 'Scale community gravity and launch campaigns with confidence.',
  headline: 'Designed for leaders blending hiring, marketing, and partnerships.',
  benefits: [
    'Launch gradient-ready profiles, campaign pages, and social reels in minutes.',
    'Activate invite rituals with analytics, nudges, and AI storytelling.',
    'Convert warm talent and clients via curated proof tiles and momentum alerts.',
  ],
  metrics: [
    { label: 'Pipeline velocity', value: '3.4x', delta: '+24%' },
    { label: 'Time to launch', value: '8 days' },
  ],
  signatureMoments: [
    {
      label: 'Launch runway',
      description: 'Sync invites, stage hero media, and warm audiences before announcing.',
    },
    {
      label: 'Momentum review',
      description: 'Digest talent, client, and community signals each Friday with the team.',
    },
  ],
  recommendedModules: ['Launch studio', 'Momentum insights', 'Invite rituals'],
};

async function moveToSummary(user) {
  const personaButton = await screen.findByRole('button', { name: /visionary founder/i });
  const continueButton = screen.getByRole('button', { name: /continue/i });

  expect(continueButton).toBeDisabled();
  await user.click(personaButton);
  expect(continueButton).not.toBeDisabled();
  await user.click(continueButton);

  await screen.findByRole('heading', { name: /tell us about your brand/i });
  await user.type(screen.getByLabelText(/company or brand name/i), '  Gigvora Labs  ');
  await user.type(screen.getByLabelText(/your role/i), ' Head of Talent ');
  await user.type(screen.getByLabelText(/preferred timezone/i), ' GMT  ');
  await user.type(screen.getByLabelText(/signature headline/i), ' Vision-led hiring ');
  await user.type(
    screen.getByLabelText(/north-star outcome for the next quarter/i),
    ' Expand referrals and partnerships. ',
  );
  await user.click(screen.getByRole('button', { name: /continue/i }));

  await screen.findByText(/invite collaborators/i);
  const emailField = screen.getByLabelText(/email/i);
  await user.type(emailField, '  FOUNDER@Gigvora.COM  ');
  await user.selectOptions(screen.getByLabelText(/role/i), 'Executive');
  await user.click(screen.getByRole('button', { name: /continue/i }));

  await screen.findByText(/how often should we nudge you/i);
  await user.click(screen.getByText(/monthly deep-dive/i));
  await user.click(screen.getByText(/deal progress/i));
  await user.click(screen.getByRole('switch'));
  await user.click(screen.getByRole('button', { name: /continue/i }));

  await screen.findByText(/launch checklist/i);
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOnboardingPersonas.mockResolvedValue([apiPersona]);
  });

  it('loads personas from the API and tracks analytics across steps', async () => {
    const analytics = { track: vi.fn() };
    render(<OnboardingWizard analytics={analytics} />);

    await waitFor(() => expect(listOnboardingPersonas).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(apiPersona.subtitle)).toBeInTheDocument();

    const user = userEvent.setup();
    await moveToSummary(user);

    expect(analytics.track).toHaveBeenCalledWith(
      'web_onboarding_step_viewed',
      expect.objectContaining({ stepId: 'persona', hasPersona: false }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'web_onboarding_persona_selected',
      expect.objectContaining({ personaId: apiPersona.id, title: apiPersona.title }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'web_onboarding_step_viewed',
      expect.objectContaining({ stepId: 'profile', hasPersona: true }),
    );
  });

  it('sanitises launch payloads and resolves completion flow', async () => {
    const analytics = { track: vi.fn() };
    const onComplete = vi.fn();
    const journey = { id: 'journey-001', createdAt: '2025-05-01T10:00:00Z' };
    createOnboardingJourney.mockResolvedValue(journey);

    render(<OnboardingWizard analytics={analytics} onComplete={onComplete} initialPersonaId={apiPersona.id} />);

    const user = userEvent.setup();
    await moveToSummary(user);

    const launchButton = screen.getByRole('button', { name: /launch workspace/i });
    await user.click(launchButton);

    await waitFor(() => expect(createOnboardingJourney).toHaveBeenCalledTimes(1));
    expect(createOnboardingJourney).toHaveBeenCalledWith(
      expect.objectContaining({
        personaKey: apiPersona.id,
        profile: expect.objectContaining({
          companyName: 'Gigvora Labs',
          role: 'Head of Talent',
          timezone: 'GMT',
        }),
        invites: [{ email: 'founder@gigvora.com', role: 'Executive' }],
        preferences: expect.objectContaining({
          updates: true,
          digestCadence: 'monthly',
          enableAiDrafts: false,
          focusSignals: expect.arrayContaining(['Deal progress', 'Community engagement']),
          storyThemes: expect.arrayContaining(['Culture', 'Product launches']),
        }),
      }),
    );

    expect(analytics.track).toHaveBeenCalledWith(
      'web_onboarding_completed',
      expect.objectContaining({
        personaId: apiPersona.id,
        inviteCount: 1,
        digestCadence: 'monthly',
        hasAiDrafts: false,
        journeyId: journey.id,
      }),
    );

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        journey,
        persona: expect.objectContaining({ id: apiPersona.id }),
        invites: [{ email: 'founder@gigvora.com', role: 'Executive' }],
      }),
    );
  });

  it('surfaces launch errors when the journey request fails', async () => {
    const failure = new Error('Network down');
    createOnboardingJourney.mockRejectedValue(failure);

    render(<OnboardingWizard />);

    const user = userEvent.setup();
    await moveToSummary(user);

    await user.click(screen.getByRole('button', { name: /launch workspace/i }));

    await screen.findByText('Network down');
    expect(createOnboardingJourney).toHaveBeenCalledTimes(1);
  });
});
