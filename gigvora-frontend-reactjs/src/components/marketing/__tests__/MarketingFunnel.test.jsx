import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarketingLayout from '../MarketingLayout.jsx';
import ProductTour from '../ProductTour.jsx';
import PricingTable from '../PricingTable.jsx';
import analytics from '../../../services/analytics.js';

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: vi.fn(),
  },
}));

describe('Marketing funnel components', () => {
  beforeEach(() => {
    analytics.track.mockClear();
  });

  it('tracks layout persona interactions and forwards callback', async () => {
    const handleSelect = vi.fn();
    render(
      <MarketingLayout
        hero={{ id: 'test-layout', node: <div>Hero</div> }}
        metrics={[{ label: 'Members', value: '10k+' }]}
        personaSwitcher={{
          personas: [
            { id: 'founder', label: 'Founder' },
            { id: 'operations', label: 'Operations' },
          ],
          selectedId: 'founder',
          onSelect: handleSelect,
        }}
      >
        <div>Children</div>
      </MarketingLayout>,
    );

    // Layout view event
    expect(analytics.track).toHaveBeenCalledWith(
      'marketing_layout_viewed',
      expect.objectContaining({ layoutId: 'test-layout', metricCount: 1, hasPersonaSwitcher: true }),
      expect.objectContaining({ source: 'web_marketing_site' }),
    );

    const operationsButton = screen.getByRole('button', { name: 'Operations' });
    await userEvent.click(operationsButton);

    expect(handleSelect).toHaveBeenCalledWith({ id: 'operations', label: 'Operations' });
    expect(analytics.track).toHaveBeenCalledWith(
      'marketing_layout_persona_selected',
      expect.objectContaining({ layoutId: 'test-layout', persona: 'operations' }),
      expect.objectContaining({ source: 'web_marketing_site' }),
    );
  });

  it('renders persona-specific highlights in ProductTour and tracks changes', async () => {
    const steps = [
      {
        id: 'command',
        label: 'Command',
        title: 'Command overview',
        summary: 'See everything in one view.',
        personaHighlights: {
          founder: ['Executive summary'],
          operations: ['Ops automation'],
        },
        metrics: {
          timeToValue: '10 minutes',
          automation: '75% of tasks',
          collaboration: 'Execs, ops',
        },
      },
      {
        id: 'launch',
        label: 'Launch',
        title: 'Launch planner',
        summary: 'Coordinate every launch.',
        personaHighlights: {
          founder: ['Investor-ready recaps'],
          operations: ['Dependencies surfaced'],
        },
      },
    ];
    const personas = [
      { id: 'founder', label: 'Founder' },
      { id: 'operations', label: 'Operations' },
    ];

    render(
      <ProductTour
        steps={steps}
        personas={personas}
        initialPersonaId="founder"
        autoPlay={false}
        analyticsMetadata={{ source: 'web_marketing_site' }}
      />,
    );

    expect(screen.getByText('Executive summary')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Operations' }));
    expect(screen.getByText('Ops automation')).toBeInTheDocument();
    expect(analytics.track).toHaveBeenCalledWith(
      'marketing_product_tour_persona_changed',
      expect.objectContaining({ persona: 'operations' }),
      expect.objectContaining({ source: 'web_marketing_site' }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.getByText('Launch planner')).toBeInTheDocument();
    expect(analytics.track).toHaveBeenCalledWith(
      'marketing_product_tour_step_changed',
      expect.objectContaining({ stepId: 'launch', persona: 'operations' }),
      expect.objectContaining({ source: 'web_marketing_site' }),
    );
  });

  it('switches pricing cycle and emits plan selection events', async () => {
    const handlePlanSelected = vi.fn();
    render(
      <PricingTable
        plans={[
          {
            id: 'launch',
            name: 'Launch',
            headline: 'For new teams',
            pricing: { monthly: 120, annual: 100 },
            savings: { annual: 'Save 20%' },
            features: ['Feature A'],
          },
        ]}
        featureMatrix={[{ key: 'feature-a', label: 'Feature A', tiers: { launch: true } }]}
        metrics={[{ label: 'ROI', value: '4x' }]}
        analyticsMetadata={{ source: 'web_marketing_site' }}
        onPlanSelected={handlePlanSelected}
      />,
    );

    expect(screen.getByText('$100')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Monthly/i }));
    expect(analytics.track).toHaveBeenCalledWith(
      'marketing_pricing_cycle_changed',
      expect.objectContaining({ cycle: 'monthly' }),
      expect.objectContaining({ source: 'web_marketing_site' }),
    );
    expect(screen.getByText('$120')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Start a 14-day pilot/i }));
    expect(handlePlanSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'primary',
        billingCycle: 'monthly',
        plan: expect.objectContaining({ id: 'launch' }),
      }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'marketing_pricing_plan_selected',
      expect.objectContaining({ plan: 'launch', billingCycle: 'monthly', action: 'primary' }),
      expect.objectContaining({ source: 'web_marketing_site' }),
    );
  });
});
