import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobDetailPanel from '../JobDetailPanel.jsx';

const job = {
  id: 'role-1',
  title: 'Lead Platform Engineer',
  summary: 'Design resilient infrastructure and accelerate developer workflows.',
  company: {
    name: 'Nova Systems',
    verified: true,
    website: 'https://nova.systems',
    locations: ['San Francisco, USA', 'Lisbon, Portugal'],
  },
  location: 'Remote - North America',
  salary: { min: 160000, max: 190000, currency: 'USD', period: 'year' },
  postedAt: '2024-04-19T00:00:00.000Z',
  applicationDeadline: '2024-05-31T00:00:00.000Z',
  matchScore: 88,
  workMode: 'remote',
  commitment: 'full_time',
  pipeline: { stageLabel: 'Interviewing', applicants: 42, interviewing: 5 },
  responsibilities: ['Own platform roadmap with SRE partnership.', 'Lead platform enablement squad rituals.'],
  requirements: ['8+ years in backend/platform roles', 'Expertise with Kubernetes and Go'],
  benefits: ['Equity refreshers', 'Learning stipend'],
  culture: ['Distributed first', 'Monthly maker week'],
  tools: ['Kubernetes', 'Terraform', 'Datadog'],
  interviewProcess: ['Recruiter screen', 'Technical deep dive', 'Panel interview'],
  about: 'Nova Systems accelerates AI infrastructure for global brands.',
  mission: 'Empower builders with frictionless infrastructure.',
  tags: ['Platform', 'SRE', 'Scaling'],
  recruiter: {
    name: 'Jordan Lee',
    title: 'Senior Talent Partner',
    email: 'jordan@nova.systems',
    timezone: 'UTC-8',
  },
  metrics: { interviews: 5, teamSize: 32 },
  insights: { responseTime: '24h', teamSize: 32, reportsTo: 'VP Engineering' },
  attachments: [{ id: 'deck', name: 'Engineering culture deck', url: 'https://example.com/deck.pdf' }],
  contactEmail: 'talent@nova.systems',
};

describe('JobDetailPanel', () => {
  it('shows placeholder when no job selected', () => {
    render(<JobDetailPanel job={null} />);

    expect(screen.getByText('Select a role to dive deeper')).toBeInTheDocument();
    expect(screen.getByText(/Explore role rituals/)).toBeInTheDocument();
  });

  it('renders job details and sections', () => {
    render(<JobDetailPanel job={job} />);

    expect(screen.getByText('Lead Platform Engineer')).toBeInTheDocument();
    expect(screen.getByText('Nova Systems')).toBeInTheDocument();
    expect(screen.getByText('Own platform roadmap with SRE partnership.')).toBeInTheDocument();
    expect(screen.getByText('Engineering culture deck')).toBeInTheDocument();
    expect(screen.getByText('Empower builders with frictionless infrastructure.')).toBeInTheDocument();
  });

  it('calls handlers for save and apply', async () => {
    const user = userEvent.setup();
    const onToggleSave = vi.fn();
    const onApply = vi.fn();

    const jobWithoutApply = { ...job, applyUrl: undefined };

    render(<JobDetailPanel job={jobWithoutApply} onToggleSave={onToggleSave} onApply={onApply} />);

    await user.click(screen.getByRole('button', { name: /save role/i }));
    expect(onToggleSave).toHaveBeenCalledWith(jobWithoutApply);

    await user.click(screen.getByRole('button', { name: /apply now/i }));
    expect(onApply).toHaveBeenCalled();
  });
});
