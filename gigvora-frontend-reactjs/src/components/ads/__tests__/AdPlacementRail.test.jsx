import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../services/ads.js', () => ({
  fetchAdPlacements: vi.fn(),
}));

import { fetchAdPlacements } from '../../../services/ads.js';
import AdPlacementRail from '../AdPlacementRail.jsx';

describe('AdPlacementRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders offers returned from the service and supports manual refresh', async () => {
    const user = userEvent.setup();
    fetchAdPlacements.mockResolvedValueOnce([
      {
        id: 'placement-1',
        coupons: [
          {
            id: 'coupon-1',
            code: 'SAVE25',
            discountType: 'percentage',
            discountValue: 25,
            lifecycleStatus: 'active',
            isActive: true,
            metadata: { ctaUrl: 'https://gigvora.com/offers' },
            termsUrl: 'https://gigvora.com/terms',
          },
        ],
        creative: {
          headline: 'Launch with Gigvora ads',
          subheadline: 'Run omnichannel journeys in minutes',
          callToAction: 'Redeem',
        },
        surface: 'global_dashboard',
        position: 'hero',
      },
    ]);

    const { rerender } = render(<AdPlacementRail surface="global_dashboard" />);

    const headlines = await screen.findAllByText(/launch with gigvora ads/i);
    expect(headlines.length).toBeGreaterThan(0);
    const redeemLinks = screen.getAllByRole('link', { name: /redeem/i });
    expect(redeemLinks.some((link) => link.getAttribute('href') === 'https://gigvora.com/offers')).toBe(true);

    fetchAdPlacements.mockResolvedValueOnce([]);
    const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
    await user.click(refreshButtons[0]);
    rerender(<AdPlacementRail surface="global_dashboard" />);

    expect(fetchAdPlacements).toHaveBeenCalledTimes(2);
  });

  it('surfaces empty and error states', async () => {
    fetchAdPlacements.mockResolvedValueOnce([]);
    const renderResult = render(<AdPlacementRail surface="user_dashboard" />);
    const noCouponsMessages = await screen.findAllByText(/no coupons active/i);
    expect(noCouponsMessages.length).toBeGreaterThan(0);

    fetchAdPlacements.mockRejectedValueOnce(new Error('Network issue'));
    renderResult.rerender(<AdPlacementRail surface="company_dashboard" />);
    const errors = await screen.findAllByText(/network issue/i);
    expect(errors.length).toBeGreaterThan(0);
  });
});
