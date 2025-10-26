import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileOverview from '../ProfileOverview.jsx';

describe('ProfileOverview', () => {
  const baseProfileOverview = {
    name: 'Jordan Lee',
    headline: 'Product Lead at Northwind',
    bio: 'Building premium storytelling for digital marketplaces.',
    location: 'Berlin, Germany',
    heroVideoUrl: 'https://cdn.example.com/hero.mp4',
    highlightReel: [
      { id: 'growth', title: 'Growth sprint orchestration', metric: '12x ROI', description: 'Scaled marketplaces.' },
    ],
  };

  const baseProfileHub = {
    availability: { status: 'available' },
    stats: { followers: 1280, connections: 340, projects: 42, satisfaction: 78 },
    trustBadges: [
      { id: 'mentor', label: 'Top Mentor', description: '2023 accelerator' },
      { id: 'creator', label: 'Creator Awards finalist' },
    ],
    mutualConnections: [
      { id: 'alex', name: 'Alex Doe', headline: 'Head of Operations' },
      { id: 'riley', name: 'Riley Kim', headline: 'Product Designer' },
    ],
    highlightReel: [
      { id: 'program', label: 'Mentor summit host', metric: '500+ founders' },
    ],
  };

  it('renders metrics, highlight reel, and trust badges', () => {
    render(<ProfileOverview profileOverview={baseProfileOverview} profileHub={baseProfileHub} />);

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('12x ROI')).toBeInTheDocument();
    expect(screen.getByText('Top Mentor')).toBeInTheDocument();
    expect(screen.getByText('Growth sprint orchestration')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
  });

  it('invokes onAction when CTAs are clicked', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(<ProfileOverview profileOverview={baseProfileOverview} profileHub={baseProfileHub} onAction={onAction} />);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);
    expect(onAction).toHaveBeenCalledWith('connect');

    const shareButton = screen.getByRole('button', { name: /share profile/i });
    await user.click(shareButton);
    expect(onAction).toHaveBeenCalledWith('share');
  });

  it('shows persona-specific recommendation', () => {
    render(
      <ProfileOverview
        profileOverview={baseProfileOverview}
        profileHub={baseProfileHub}
        viewerPersona="investor"
      />,
    );

    expect(screen.getByText('Recommended for investors')).toBeInTheDocument();
    expect(screen.getByText(/go-to-market reel/i)).toBeInTheDocument();
  });
});
