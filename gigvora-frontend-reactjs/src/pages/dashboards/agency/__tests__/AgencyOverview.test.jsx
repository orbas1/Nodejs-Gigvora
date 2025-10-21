import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgencyOverview from '../AgencyOverview.jsx';

describe('AgencyOverview', () => {
  it('renders welcome copy and metrics', () => {
    render(<AgencyOverview displayName="Ops" />);

    expect(screen.getByRole('heading', { level: 1, name: /hello, ops/i })).toBeVisible();
    expect(screen.getByText(/Active clients/i)).toBeVisible();
    expect(screen.getByText(/Team focus/i)).toBeVisible();
  });
});
