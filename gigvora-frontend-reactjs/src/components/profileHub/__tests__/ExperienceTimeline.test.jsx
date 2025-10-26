import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExperienceTimeline from '../ExperienceTimeline.jsx';

describe('ExperienceTimeline', () => {
  const timelineItems = [
    {
      id: 'exp-1',
      role: 'Principal Product Lead',
      organization: 'Gigvora',
      startDate: '2021-07-01',
      summary: 'Scaled premium profile hub experiences.',
      tags: ['Product', 'Leadership'],
      achievements: ['Increased engagement by 45%', 'Launched cross-platform editor'],
      metrics: [
        { label: 'Retention lift', value: '45%' },
        { label: 'NPS', value: 72 },
      ],
      media: { videoUrl: 'https://cdn.example.com/spotlight.mp4' },
      spotlight: true,
    },
    {
      id: 'exp-2',
      role: 'Community Strategist',
      organization: 'Atlas Collective',
      startDate: '2019-01-01',
      endDate: '2021-05-01',
      summary: 'Grew the community programme with immersive workshops.',
      tags: ['Community'],
      achievements: ['Hosted 50+ workshops', 'Built ambassador network'],
    },
  ];

  it('renders timeline entries and filters by tag', async () => {
    const user = userEvent.setup();

    render(<ExperienceTimeline items={timelineItems} />);

    const [initialList] = screen.getAllByRole('list');
    expect(within(initialList).getByText('Principal Product Lead')).toBeInTheDocument();
    expect(within(initialList).queryByText('Community Strategist')).not.toBeInTheDocument();

    const communityButtons = screen.getAllByRole('button', { name: /community/i });
    const communityNames = communityButtons.map((button) => button.textContent.trim());
    expect(communityNames).toContain('Community');
    const communityFilter = communityButtons[communityNames.indexOf('Community')];
    await user.click(communityFilter);

    await waitFor(() => {
      const [filteredList] = screen.getAllByRole('list');
      expect(within(filteredList).getByText('Community Strategist')).toBeInTheDocument();
      expect(within(filteredList).queryByText('Principal Product Lead')).not.toBeInTheDocument();
    });
  });

  it('invokes spotlight and share callbacks', async () => {
    const onSpotlight = vi.fn();
    const onShare = vi.fn();
    const user = userEvent.setup();

    render(<ExperienceTimeline items={timelineItems} onSpotlight={onSpotlight} onShare={onShare} />);

    const communityButtons = screen.getAllByRole('button', { name: /community/i });
    const communityNames = communityButtons.map((button) => button.textContent.trim());
    const communityFilter = communityButtons[communityNames.indexOf('Community')];
    await user.click(communityFilter);

    const [timelineList] = screen.getAllByRole('list');
    const communityCard = await within(timelineList).findByRole('button', { name: /community strategist/i });
    await user.click(communityCard);
    expect(onSpotlight).toHaveBeenCalledWith(expect.objectContaining({ id: 'exp-2' }));

    const shareButton = screen.getByRole('button', { name: /share highlight/i });
    await user.click(shareButton);
    expect(onShare).toHaveBeenCalledWith(expect.objectContaining({ id: 'exp-2' }));
  });
});
