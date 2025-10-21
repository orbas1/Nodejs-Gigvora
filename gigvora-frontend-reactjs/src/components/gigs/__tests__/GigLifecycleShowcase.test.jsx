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
});
