import { render, screen } from '@testing-library/react';
import ExperienceTimeline from '../ExperienceTimeline.jsx';

describe('ExperienceTimeline', () => {
  it('shows fallback when empty', () => {
    render(<ExperienceTimeline items={[]} />);

    expect(screen.getByText('Experience timeline')).toBeInTheDocument();
    expect(
      screen.getByText('Add engagements, roles, or programmes to bring your experience story to life.'),
    ).toBeInTheDocument();
  });

  it('renders timeline entries with highlights and metrics', () => {
    render(
      <ExperienceTimeline
        items={[
          {
            organization: 'Launchpad',
            role: 'Fractional CPO',
            startDate: '2021',
            endDate: '2023',
            summary: 'Scaled mentors across EMEA.',
            highlights: ['Grew mentor community by 140%', 'Launched matching automation'],
            metrics: { reach: '5 regions', csat: '4.9/5' },
            engagementType: 'fractional',
            updatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          },
        ]}
        statCards={[{ label: 'Engagements', value: '24', helper: 'Completed' }]}
      />,
    );

    expect(screen.getByText('Launchpad')).toBeInTheDocument();
    expect(screen.getByText('Fractional CPO')).toBeInTheDocument();
    expect(screen.getByText('Scaled mentors across EMEA.')).toBeInTheDocument();
    expect(screen.getByText('Grew mentor community by 140%')).toBeInTheDocument();
    expect(screen.getByText('Engagements')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
