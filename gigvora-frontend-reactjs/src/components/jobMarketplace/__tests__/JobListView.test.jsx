import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobListView from '../JobListView.jsx';

const sampleJobs = [
  {
    id: '1',
    title: 'Lead Product Designer',
    summary: 'Drive end-to-end experience across our marketplace.',
    company: { name: 'Aurora Labs', verified: true },
    location: 'Remote - North America',
    workMode: 'remote',
    commitment: 'full_time',
    experienceLevel: 'senior',
    salary: { min: 140000, max: 170000, currency: 'USD', period: 'year' },
    postedAt: '2024-05-01T00:00:00.000Z',
    tags: ['Product', 'Design Systems', 'B2B'],
    matchScore: 92,
    pipeline: { stageLabel: 'Interviewing', applicants: 18, interviewing: 5, offers: 1 },
    saved: true,
    metrics: { views: 1200, saves: 32 },
  },
  {
    id: '2',
    title: 'Growth Marketing Manager',
    summary: 'Lead lifecycle experiments that unlock subscriber expansion.',
    company: { name: 'Momentum Studios' },
    location: 'Berlin, Germany',
    workMode: 'hybrid',
    commitment: 'full_time',
    experienceLevel: 'mid',
    salary: { min: 85000, max: 105000, currency: 'EUR', period: 'year' },
    postedAt: '2024-04-22T00:00:00.000Z',
    tags: ['Growth', 'Lifecycle', 'Retention'],
    matchScore: 67,
    pipeline: { stageLabel: 'Screening', applicants: 54, interviewing: 3, offers: 0 },
    saved: false,
    metrics: { views: 520, saves: 11 },
  },
];

describe('JobListView', () => {
  it('renders jobs and metrics', () => {
    render(
      <JobListView
        jobs={sampleJobs}
        metrics={{ total: 2, remote: 1, saved: 1, interviewing: 1 }}
        onSelectJob={() => {}}
      />
    );

    expect(screen.getByText('Marketplace pipeline')).toBeInTheDocument();
    expect(screen.getByText('2 roles match the criteria')).toBeInTheDocument();
    expect(screen.getByText('Lead Product Designer')).toBeInTheDocument();
    expect(screen.getByText('Growth Marketing Manager')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
  });

  it('filters roles by search input', async () => {
    const user = userEvent.setup();
    render(<JobListView jobs={sampleJobs} />);

    expect(screen.getByText('Growth Marketing Manager')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search job titles, skills, or companies'), 'designer');

    expect(screen.queryByText('Growth Marketing Manager')).not.toBeInTheDocument();
    expect(screen.getByText('Lead Product Designer')).toBeInTheDocument();
  });

  it('emits save and selection events', async () => {
    const user = userEvent.setup();
    const onSelectJob = vi.fn();
    const onToggleSave = vi.fn();

    render(<JobListView jobs={sampleJobs} onSelectJob={onSelectJob} onToggleSave={onToggleSave} />);

    await user.click(screen.getByText('Growth Marketing Manager'));
    expect(onSelectJob).toHaveBeenCalledWith(sampleJobs[1]);

    await user.click(screen.getAllByRole('button', { name: /save/i })[1]);
    expect(onToggleSave).toHaveBeenCalledWith(sampleJobs[1]);
  });
});
