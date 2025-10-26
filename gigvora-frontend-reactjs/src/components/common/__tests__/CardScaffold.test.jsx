import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardScaffold from '../CardScaffold.jsx';
import ButtonSuite from '../ButtonSuite.jsx';

describe('CardScaffold', () => {
  it('renders premium header layout with highlight bar and actions', () => {
    render(
      <CardScaffold
        highlight="primary"
        eyebrow="Opportunity"
        title="Partnership Brief"
        subtitle="Q4 Expansion"
        description="Align regional launch milestones with funding readiness."
        meta={<span>Updated 2h ago</span>}
        actions={<ButtonSuite size="sm">Open</ButtonSuite>}
        footer={<span>Next review: Oct 12</span>}
      >
        <p>Ensure investor readiness across all executive sponsors.</p>
      </CardScaffold>,
    );

    expect(screen.getByText(/opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/partnership brief/i)).toBeInTheDocument();
    expect(screen.getByText(/updated 2h ago/i)).toBeInTheDocument();
    expect(screen.getByText(/next review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('supports horizontal media driven layouts', () => {
    render(
      <CardScaffold
        orientation="horizontal"
        media={<img alt="Metrics preview" src="/metrics.png" />}
        actions={<ButtonSuite variant="ghost">Details</ButtonSuite>}
      >
        <p>View cross-network traction and heatmaps.</p>
      </CardScaffold>,
    );

    const card = screen.getByText(/cross-network traction/i).closest('[data-orientation]');
    expect(card).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByAltText(/metrics preview/i)).toBeInTheDocument();
  });

  it('enables interactive affordances for dashboard level cards', () => {
    render(
      <CardScaffold interactive as="div" title="Executive Summary">
        <p>Tap for revenue, hiring, and retention KPIs.</p>
      </CardScaffold>,
    );

    const card = screen.getByText(/executive summary/i).closest('[data-interactive]');
    expect(card).toHaveAttribute('data-interactive', 'true');
    expect(card).toHaveAttribute('tabindex', '0');
  });
});
