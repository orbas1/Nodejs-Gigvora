import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StorageSummaryPanel from './StorageSummaryPanel.jsx';

describe('StorageSummaryPanel', () => {
  it('renders loading skeletons when no summary cards exist', () => {
    const { container } = render(<StorageSummaryPanel summaryCards={[]} loading={false} />);

    const placeholders = container.querySelectorAll('.animate-pulse');
    expect(placeholders).toHaveLength(4);
  });

  it('displays summary cards and primary location details', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onAuditNavigate = vi.fn();

    const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;

    render(
      <StorageSummaryPanel
        loading={false}
        summaryCards={[
          { label: 'Total storage', value: '120 GB', helper: 'Across all buckets', Icon: MockIcon },
        ]}
        primaryLocation={{ name: 'eu-central', status: 'active', provider: 'aws', providerLabel: 'Amazon S3' }}
        summary={{ hasHealthyPrimary: true }}
        onRefresh={onRefresh}
        onAuditNavigate={onAuditNavigate}
      />,
    );

    expect(screen.getByText('Total storage')).toBeInTheDocument();
    expect(screen.getByText('120 GB')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /audit log/i }));
    expect(onAuditNavigate).toHaveBeenCalledTimes(1);
  });

  it('shows a health warning when the primary site is not healthy', () => {
    render(
      <StorageSummaryPanel
        summaryCards={[{ label: 'Active buckets', value: '5', helper: 'Live data sources' }]}
        primaryLocation={{ name: 'us-east', status: 'degraded', provider: 'gcp' }}
        summary={{ hasHealthyPrimary: false }}
      />,
    );

    expect(screen.getByText('Primary site is not marked healthy.')).toBeInTheDocument();
  });
});
