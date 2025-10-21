import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogInsightsPanel from '../CatalogInsightsPanel.jsx';

const refreshMock = vi.fn();
const useCachedResourceMock = vi.fn();

vi.mock('../../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: (...args) => useCachedResourceMock(...args),
}));

describe('CatalogInsightsPanel', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    useCachedResourceMock.mockReset();
    useCachedResourceMock.mockReturnValue({
      data: {
        summary: {
          conversionRate: { value: 42, change: 3, label: 'Last 30 days' },
          repeatClientRate: { value: 55, change: 2, label: 'Growth focus' },
          crossSellAcceptance: { value: 24, change: -1, openOpportunities: 3 },
        },
        bundles: [{ id: 'bundle-1', name: 'Product Design Sprint' }],
        crossSell: [{ id: 'cross-1', title: 'Growth audit add-on' }],
      },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: '2024-05-01T10:00:00Z',
      refresh: refreshMock,
    });
  });

  it('loads freelancer insights from the cached resource hook', () => {
    render(<CatalogInsightsPanel freelancerId="freelancer-123" />);

    expect(useCachedResourceMock).toHaveBeenCalledWith(
      'catalog-insights:freelancer-123',
      expect.any(Function),
      expect.objectContaining({ ttl: expect.any(Number), dependencies: expect.arrayContaining(['freelancer-123']) }),
    );

    expect(screen.getByText('Overall conversion rate')).toBeInTheDocument();
    expect(screen.getByText('Product Design Sprint')).toBeInTheDocument();
    expect(screen.getByText('Growth audit add-on')).toBeInTheDocument();
  });

  it('supports manually refreshing the insights payload', async () => {
    const user = userEvent.setup();

    render(<CatalogInsightsPanel freelancerId="freelancer-999" />);

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    expect(refreshMock).toHaveBeenCalledWith({ force: true });
  });
});
