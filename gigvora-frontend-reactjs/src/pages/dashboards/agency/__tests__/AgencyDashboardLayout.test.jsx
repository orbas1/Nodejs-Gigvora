import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import AgencyDashboardLayout from '../AgencyDashboardLayout.jsx';

const renderSpy = vi.fn();

vi.mock('../../../../layouts/DashboardLayout.jsx', () => ({
  default: (props) => {
    renderSpy(props);
    return <div data-testid="layout">{props.children}</div>;
  },
}));

describe('AgencyDashboardLayout', () => {
  it('passes dashboard metadata to the shared layout', () => {
    render(
      <AgencyDashboardLayout title="Test" subtitle="Sub" description="Desc" activeMenuItem="overview">
        <span>Content</span>
      </AgencyDashboardLayout>,
    );

    expect(renderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentDashboard: 'agency',
        activeMenuItem: 'overview',
        title: 'Test',
      }),
    );
  });
});
