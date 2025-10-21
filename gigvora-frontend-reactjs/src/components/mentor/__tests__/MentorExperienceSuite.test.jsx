import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MentorOnboardingForm from '../MentorOnboardingForm.jsx';
import MentorPackageBuilder from '../MentorPackageBuilder.jsx';
import MentorProfileCard from '../MentorProfileCard.jsx';
import MentorReviewForm from '../../mentoring/user/MentorReviewForm.jsx';

vi.mock('../../../services/mentorship.js', () => ({
  submitMentorProfile: vi.fn(),
}));

import { submitMentorProfile } from '../../../services/mentorship.js';

describe('MentorOnboardingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields and submits a sanitised payload', async () => {
    const analytics = { track: vi.fn() };
    const onSubmitted = vi.fn();

    render(<MentorOnboardingForm analytics={analytics} onSubmitted={onSubmitted} />);

    const submitButton = screen.getByRole('button', { name: /apply as mentor/i });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Jordan  Patel  ' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'Jordan@example.com ' } });
    fireEvent.change(screen.getByLabelText('Preferred timezone'), { target: { value: 'GMT' } });
    fireEvent.change(screen.getByLabelText('Focus areas'), { target: { value: 'Product, Leadership' } });

    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);
    await screen.findByText(/mentor team will be in touch shortly/i);

    await waitFor(() =>
      expect(submitMentorProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jordan  Patel',
          email: 'jordan@example.com',
          expertise: ['Product', 'Leadership'],
        }),
      ),
    );
    expect(analytics.track).toHaveBeenCalledWith('web_mentor_onboarding_submitted', expect.any(Object));
    expect(onSubmitted).toHaveBeenCalled();
  });
});

describe('MentorPackageBuilder', () => {
  it('prevents duplicate packages and surfaces save feedback', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const analytics = { track: vi.fn() };

    render(
      <MentorPackageBuilder
        packages={[
          {
            id: 'initial',
            name: 'Leadership pod',
            description: 'Six weeks',
            sessions: 6,
            price: 1800,
            currency: '£',
            format: 'Hybrid',
            outcome: 'Promotion ready',
          },
        ]}
        onSave={onSave}
        analytics={analytics}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add package/i }));
    expect(await screen.findByText(/name your package/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Package name'), { target: { value: 'Leadership pod' } });
    fireEvent.click(screen.getByRole('button', { name: /add package/i }));
    expect(await screen.findByText(/already configured this package/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Package name'), { target: { value: 'Career accelerator' } });
    fireEvent.click(screen.getByRole('button', { name: /add package/i }));
    fireEvent.click(screen.getByRole('button', { name: /save packages/i }));
    await screen.findByText(/Packages updated/i);

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(analytics.track).toHaveBeenCalledWith('web_mentor_packages_saved', { packages: 2 });
  });
});

describe('MentorProfileCard', () => {
  it('renders mentor details and triggers callbacks', async () => {
    const onBook = vi.fn();
    const onView = vi.fn();

    render(
      <MentorProfileCard
        mentor={{
          id: 'm-1',
          name: 'Sam Carter',
          headline: 'Product strategist',
          region: '',
          bio: 'Helps scale marketplaces.',
          expertise: ['Product'],
          packages: [
            { name: 'Focus sprint', description: 'Two weeks', currency: '£', price: 600 },
          ],
          rating: 4.8,
          reviews: 22,
          sessionFee: { amount: 240, currency: '$' },
        }}
        onBook={onBook}
        onView={onView}
      />,
    );

    expect(screen.getByText('Sam Carter')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /book session/i }));
    fireEvent.click(screen.getByRole('button', { name: /view profile/i }));
    expect(onBook).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sam Carter' }));
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sam Carter' }));
  });
});

describe('MentorReviewForm', () => {
  it('derives mentor options from sessions and mentors', async () => {
    const onSubmit = vi.fn();
    render(
      <MentorReviewForm
        mentors={[{ id: 1, firstName: 'Alex', lastName: 'Rivera', profile: { headline: 'Design leader' } }]}
        sessions={[
          {
            id: 99,
            mentorId: 2,
            topic: 'Interview prep',
            mentor: { id: 2, firstName: 'Jamie', lastName: 'Taylor', profile: { headline: 'Ops lead' } },
          },
        ]}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Session (optional)'), { target: { value: '99' } });
    fireEvent.change(screen.getByLabelText('Mentor'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ mentorId: 2, rating: 4 })),
    );
  });
});
