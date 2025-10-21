import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MentoringPackagesPanel from '../MentoringPackagesPanel.jsx';
import MentoringPeoplePanel from '../MentoringPeoplePanel.jsx';
import MentoringReviewsPanel from '../MentoringReviewsPanel.jsx';
import MentoringSessionDrawer from '../MentoringSessionDrawer.jsx';
import MentoringSessionForm from '../MentoringSessionForm.jsx';
import MentoringSessionsPanel from '../MentoringSessionsPanel.jsx';
import MentoringSummaryBar from '../MentoringSummaryBar.jsx';
import MentorshipPurchaseForm from '../MentorshipPurchaseForm.jsx';
import UserMentoringSection from '../UserMentoringSection.jsx';

vi.mock('../../../services/userMentoring.js', () => ({
  createMentoringSession: vi.fn().mockResolvedValue({}),
  updateMentoringSession: vi.fn().mockResolvedValue({}),
  recordMentorshipPurchase: vi.fn().mockResolvedValue({}),
  updateMentorshipPurchase: vi.fn().mockResolvedValue({}),
  addFavouriteMentor: vi.fn().mockResolvedValue({}),
  removeFavouriteMentor: vi.fn().mockResolvedValue({}),
  submitMentorReview: vi.fn().mockResolvedValue({}),
}));

describe('MentoringPackagesPanel', () => {
  it('uses default formatters when none provided', () => {
    render(
      <MentoringPackagesPanel
        orders={[
          {
            id: 'order-1',
            packageName: 'Leadership pod',
            mentorId: 1,
            sessionsRedeemed: 2,
            sessionsPurchased: 6,
            totalAmount: 1250,
            currency: '£',
            purchasedAt: '2024-05-10T12:00:00Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('Leadership pod')).toBeInTheDocument();
    expect(screen.getByText(/£1,250/)).toBeInTheDocument();
  });
});

describe('MentoringPeoplePanel', () => {
  it('toggles between favourites and suggestions without handlers', async () => {
    const user = userEvent.setup();
    render(
      <MentoringPeoplePanel
        favourites={[{ id: 1, firstName: 'Ava', lastName: 'Kim', profile: {} }]}
        suggestions={[{ id: 2, firstName: 'Leo', lastName: 'Patel', profile: {} }]}
      />,
    );

    expect(screen.getByText(/Ava Kim/)).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /picks/i }));
    });
    expect(await screen.findByText(/Leo Patel/)).toBeInTheDocument();
  });
});

describe('MentoringReviewsPanel', () => {
  it('invokes callback for the first pending review', async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();
    render(
      <MentoringReviewsPanel
        pending={[{ id: 'rev-1', topic: 'Growth session', mentor: { firstName: 'Mia', lastName: 'Lee' } }]}
        recent={[]}
        canEdit
        onReview={onReview}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /review first/i }));
    });
    await waitFor(() => expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: 'rev-1' })));
  });
});

describe('MentoringSessionDrawer', () => {
  it('renders fallback formatting and links securely', () => {
    render(
      <MentoringSessionDrawer
        session={{
          id: 'session-1',
          topic: 'Career planning',
          status: 'scheduled',
          scheduledAt: '2024-05-22T09:00:00Z',
          mentorId: 3,
          mentor: { firstName: 'Kai', lastName: 'Reed' },
          meetingUrl: 'https://meet.example.com',
          pricePaid: 320,
          currency: 'USD',
        }}
        canEdit
      />,
    );

    const link = screen.getByRole('link', { name: /meet.example.com/i });
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});

describe('MentoringSessionForm', () => {
  it('normalises submission payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <MentoringSessionForm
        mentors={[{ id: 4, firstName: 'Eli', lastName: 'Stone', profile: {} }]}
        onSubmit={onSubmit}
      />,
    );

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Mentor'), '4');
      await user.type(screen.getByLabelText('Session topic'), 'Portfolio review');
      await user.type(screen.getByLabelText('Scheduled for'), '2024-06-10T10:30');
      await user.click(screen.getByRole('button', { name: /save session/i }));
    });

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          mentorId: 4,
          topic: 'Portfolio review',
          scheduledAt: '2024-06-10T10:30:00.000Z',
        }),
      ),
    );
  });
});

describe('MentoringSessionsPanel', () => {
  it('filters sessions and surfaces empty states', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <MentoringSessionsPanel
        sessions={{
          upcoming: [
            {
              id: 'sess-1',
              topic: 'Interview prep',
              status: 'upcoming',
              mentorId: 1,
              mentor: { firstName: 'Ava', lastName: 'Ng' },
              scheduledAt: '2024-05-25T12:00:00Z',
            },
          ],
          requested: [],
          completed: [],
          cancelled: [],
        }}
        canEdit
        onCreate={vi.fn()}
        onSelect={onSelect}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /open session/i }));
    });
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'sess-1' })));

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /requests/i }));
    });
    await waitFor(() => expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument());
  });
});

describe('MentoringSummaryBar', () => {
  it('displays summary values with fallback currency formatter', () => {
    render(
      <MentoringSummaryBar
        summary={{ totalSessions: 4, totalSpend: 800, activePackages: 2 }}
      />,
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText(/£800/)).toBeInTheDocument();
  });
});

describe('MentorshipPurchaseForm', () => {
  it('uppercases currency and converts amounts', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MentorshipPurchaseForm mentors={[{ id: 5, firstName: 'Quinn', lastName: 'Reeves', profile: {} }]} onSubmit={onSubmit} />);

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Mentor'), '5');
      await user.type(screen.getByLabelText('Package name'), 'Growth credits');
      await user.type(screen.getByLabelText('Total amount'), '950');
      await user.click(screen.getByRole('button', { name: /save package/i }));
    });

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ totalAmount: 950, currency: 'USD' })),
    );
  });
});

describe('UserMentoringSection', () => {
  it('allows switching panels and emits panel change events', async () => {
    const user = userEvent.setup();
    const onPanelChange = vi.fn();
    render(
      <UserMentoringSection
        mentoring={{
          summary: { totalSessions: 3, totalSpend: 500, currency: 'USD' },
          sessions: { upcoming: [], requested: [], completed: [], cancelled: [], all: [] },
          favourites: [],
          suggestions: [],
          purchases: { orders: [] },
          reviews: { pending: [], recent: [] },
        }}
        userId="user-1"
        onPanelChange={onPanelChange}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /packages/i }));
    });
    await waitFor(() => expect(onPanelChange).toHaveBeenCalledWith('mentoring-packages'));
  });
});
