import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GigLifecycleShowcase from '../GigLifecycleShowcase.jsx';

describe('GigLifecycleShowcase', () => {
  it('renders all key lifecycle sections and timeline entries', () => {
    render(<GigLifecycleShowcase />);

    expect(screen.getByText('Operational blueprint')).toBeInTheDocument();
    expect(screen.getByText('Discovery & alignment')).toBeInTheDocument();
    expect(screen.getByText('Pitching & selection')).toBeInTheDocument();
    expect(screen.getByText('Delivery & QA')).toBeInTheDocument();
    expect(screen.getByText('Review & showcase')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Submission & setup')).toBeInTheDocument();
    expect(screen.getByText('Levels & addons')).toBeInTheDocument();
    expect(screen.getByText('Tasks & deliverables')).toBeInTheDocument();
    expect(screen.getByText('FAQ & governance')).toBeInTheDocument();
    expect(screen.getByText('Reviews & showcase')).toBeInTheDocument();
  });

  it('lists submission steps, tasks, and addons for context', () => {
    render(<GigLifecycleShowcase />);

    const submissionSteps = screen.getAllByText((content) =>
      content.startsWith('Structured pitch templates') ||
      content.startsWith('Automated compliance guardrails') ||
      content.startsWith('Smart reminders') ||
      content.startsWith('Escrow-ready billing'),
    );
    expect(submissionSteps).toHaveLength(4);

    const tasks = screen.getAllByText(/Milestone orchestration|Dependency mapping|Real-time status syncing|Revision tracking/);
    expect(tasks.length).toBeGreaterThanOrEqual(4);

    expect(
      screen.getByText((content) => content.includes('Strategic workshops with Gigvora specialists.')),
    ).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Analytics and reporting bundles.'))).toBeInTheDocument();
  });

  it('renders data provided by a custom blueprint payload', () => {
    const blueprint = {
      hero: {
        eyebrow: 'Custom operations',
        title: 'Custom blueprint',
        description: 'Tailored delivery steps for premium cohorts.',
        highlights: ['Custom highlight one', 'Custom highlight two'],
      },
      timelinePhases: [
        { title: 'Phase 1', description: 'Custom phase', metrics: ['Metric A'] },
      ],
      submission: {
        title: 'Custom submission',
        steps: ['First step'],
        highlight: { title: 'Custom note', description: 'Details for operators.' },
      },
      levels: {
        title: 'Custom levels',
        levels: [{ name: 'Alpha', detail: 'Alpha detail' }],
        addons: ['Addon A'],
      },
      tasks: {
        title: 'Custom tasks',
        tasks: ['Task A'],
        mediaCallouts: [{ label: 'Asset', helper: 'Asset guidance' }],
      },
      faq: {
        title: 'Custom FAQ',
        items: [{ question: 'Custom question?', answer: 'Custom answer.' }],
        note: 'Custom note',
      },
      reviews: {
        title: 'Custom reviews',
        items: ['Review A'],
      },
    };

    render(<GigLifecycleShowcase blueprint={blueprint} />);

    expect(screen.getByText('Custom blueprint')).toBeInTheDocument();
    expect(screen.getByText('Tailored delivery steps for premium cohorts.')).toBeInTheDocument();
    expect(screen.getByText('Custom highlight one')).toBeInTheDocument();
    expect(screen.getByText('Custom submission')).toBeInTheDocument();
    expect(screen.getByText('Custom tasks')).toBeInTheDocument();
    expect(screen.getByText('Custom FAQ')).toBeInTheDocument();
    expect(screen.getByText('Custom reviews')).toBeInTheDocument();
    expect(screen.getAllByText('Custom note').length).toBeGreaterThanOrEqual(1);
  });
});
