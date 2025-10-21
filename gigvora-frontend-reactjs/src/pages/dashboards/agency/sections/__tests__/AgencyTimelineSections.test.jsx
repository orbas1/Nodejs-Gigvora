import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import HighlightDetailDialog from '../HighlightDetailDialog.jsx';
import MetricDetailDialog from '../MetricDetailDialog.jsx';
import WeatherDetailDialog from '../WeatherDetailDialog.jsx';
import TimelineSummarySection from '../TimelineSummarySection.jsx';
import OpenGigsSection from '../OpenGigsSection.jsx';
import TimelineBoardSection from '../TimelineBoardSection.jsx';
import TimelineAnalyticsSection from '../TimelineAnalyticsSection.jsx';
import TimelineInsightsDrawer from '../TimelineInsightsDrawer.jsx';
import TimelinePostComposer from '../TimelinePostComposer.jsx';

vi.mock('@headlessui/react', () => {
  const React = require('react');
  const DialogComponent = ({ as: Component = 'div', children, onClose, ...props }) => (
    <Component role="dialog" aria-modal="true" {...props}>
      {typeof children === 'function' ? children({ close: onClose }) : children}
    </Component>
  );
  DialogComponent.Panel = ({ as: Component = 'div', children, ...props }) => (
    <Component {...props}>{children}</Component>
  );
  DialogComponent.Title = ({ as: Component = 'h2', children, ...props }) => (
    <Component {...props}>{children}</Component>
  );
  const TransitionRoot = ({ show, children }) => (show ? <>{typeof children === 'function' ? children() : children}</> : null);
  const TransitionChild = ({ children }) => <>{typeof children === 'function' ? children() : children}</>;
  return {
    __esModule: true,
    Dialog: DialogComponent,
    Transition: { Root: TransitionRoot, Child: TransitionChild },
  };
});

describe('Agency dashboard timeline surfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders highlight details and allows closing', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <HighlightDetailDialog
        open
        onClose={onClose}
        highlight={{
          id: 'h-1',
          title: 'Major client win',
          summary: 'Closed a multi-year retainer.',
          imageUrl: 'https://cdn.example.com/win.jpg',
          link: 'https://example.com/case-study',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: /major client win/i })).toBeInTheDocument();
    expect(screen.getByText(/closed a multi-year retainer/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /major client win/i })).toHaveAttribute('src', expect.stringContaining('win.jpg'));
    expect(screen.getByRole('link', { name: /view linked resource/i })).toHaveAttribute(
      'href',
      'https://example.com/case-study',
    );

    await user.click(screen.getByRole('button', { name: /close highlight/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports editing metrics from the detail dialog', async () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <MetricDetailDialog
        open
        onClose={onClose}
        onEdit={onEdit}
        lastUpdated={new Date('2024-05-01T12:00:00Z')}
        metric={{
          id: 'rating',
          label: 'Rating',
          value: '4.8/5',
          rawValue: 4.8,
          detailSuffix: '/5',
          status: { label: 'Loved', tone: 'text-emerald-500' },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: /rating/i })).toBeInTheDocument();
    expect(screen.getByText(/loved/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit metric/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('builds weather detail with provider context and edit flow', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <WeatherDetailDialog
        open
        onClose={() => {}}
        onEdit={onEdit}
        location="London, UK"
        coordinates={{ latitude: 51.5074, longitude: -0.1278 }}
        weather={{ temperatureC: 18, windSpeedKph: 12, windDirection: 'NE', provider: 'Meteostat' }}
        lastUpdated={new Date('2024-05-01T07:00:00Z')}
      />,
    );

    const forecastLink = screen.getByRole('link', { name: /open forecast/i });
    expect(forecastLink.getAttribute('href')).toMatch(/51\.5074/);
    expect(forecastLink.getAttribute('href')).toMatch(/-0\.1278/);

    await user.click(screen.getByRole('button', { name: /edit weather/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('invokes timeline summary callbacks for analytics controls', async () => {
    const onLookbackChange = vi.fn();
    const onRefresh = vi.fn();
    const onCreatePost = vi.fn();
    const onOpenInsights = vi.fn();
    const user = userEvent.setup();

    render(
      <TimelineSummarySection
        metrics={[
          { label: 'Views', value: '12.4K' },
          { label: 'Clicks', value: '1.4K' },
        ]}
        lookbackDays={60}
        onLookbackChange={(event) => onLookbackChange(event.target.value)}
        onRefresh={onRefresh}
        onCreatePost={onCreatePost}
        onOpenInsights={onOpenInsights}
        refreshing={false}
        updatedAt="2024-05-01T08:00:00Z"
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '90' } });
    expect(onLookbackChange).toHaveBeenCalledWith('90');

    await user.click(screen.getByRole('button', { name: /insights/i }));
    expect(onOpenInsights).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /sync/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^new$/i }));
    expect(onCreatePost).toHaveBeenCalledTimes(1);
  });

  it('saves updates for open gig orders', async () => {
    const onUpdateOrder = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <OpenGigsSection
        orders={[
          {
            id: 'order-1',
            serviceName: 'Launch content kit',
            vendorName: 'Orbit Studio',
            status: 'draft',
            dueAt: '2024-05-02',
            progressPercent: 25,
          },
        ]}
        onUpdateOrder={onUpdateOrder}
      />,
    );

    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'in_delivery' } });
    fireEvent.change(screen.getByLabelText(/due/i), { target: { value: '2024-05-15' } });
    fireEvent.change(screen.getByLabelText(/progress/i), { target: { value: '55' } });

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onUpdateOrder).toHaveBeenCalledWith('order-1', {
      status: 'in_delivery',
      dueAt: '2024-05-15',
      progressPercent: 55,
    });
  });

  it('handles planner actions across columns', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onStatusChange = vi.fn();
    const onViewAnalytics = vi.fn();
    const onArchive = vi.fn();
    const user = userEvent.setup();

    const columns = [
      {
        status: 'draft',
        items: [
          {
            id: 7,
            title: 'Product drop teaser',
            excerpt: 'Teaser copy for the launch.',
            status: 'draft',
            scheduledAt: '2024-05-04T09:00:00Z',
            publishedAt: null,
            tags: ['Launch'],
            analytics: { impressions: 1280, engagementRate: 0.24 },
          },
        ],
      },
    ];

    render(
      <TimelineBoardSection
        columns={columns}
        onCreate={onCreate}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        onViewAnalytics={onViewAnalytics}
        onArchive={onArchive}
      />,
    );

    await user.click(screen.getByRole('button', { name: /compose/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);

    const column = screen.getByRole('heading', { name: /planner/i }).closest('section');
    expect(column).toBeInTheDocument();

    const card = screen.getByRole('heading', { name: /product drop teaser/i }).closest('article');
    expect(card).toBeInTheDocument();

    const cardWithin = within(card ?? document.body);
    await user.click(cardWithin.getByRole('button', { name: /^live$/i }));
    expect(onStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 }),
      expect.objectContaining({ status: 'published' }),
    );

    await user.click(cardWithin.getByRole('button', { name: /insights/i }));
    expect(onViewAnalytics).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it('exposes top post interactions from analytics', async () => {
    const onSelectPost = vi.fn();
    const user = userEvent.setup();

    render(
      <TimelineAnalyticsSection
        totals={{ impressions: 4200, clicks: 340, engagementRate: 0.14, conversionRate: 0.06 }}
        trend={[{ date: '2024-05-01', impressions: 1200, engagementRate: 0.11 }]}
        channelBreakdown={[{ channel: 'LinkedIn', impressions: 3200, engagementRate: 0.16 }]}
        topPosts={[
          { id: 1, title: 'Launch deck', impressions: 1400, engagementRate: 0.2 },
          { id: 2, title: 'Case study', impressions: 900, engagementRate: 0.12 },
        ]}
        onSelectPost={onSelectPost}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /open/i })[0]);
    expect(onSelectPost).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('shows insight drawer details and clears a selected post', async () => {
    const onClearSelected = vi.fn();
    const user = userEvent.setup();

    render(
      <TimelineInsightsDrawer
        open
        onClose={() => {}}
        totals={{ impressions: 5100, clicks: 460, engagementRate: 0.18, conversionRate: 0.07 }}
        trend={[{ date: '2024-05-01', impressions: 1200, engagementRate: 0.15 }]}
        channelBreakdown={[{ channel: 'Email', impressions: 900, engagementRate: 0.1 }]}
        topPosts={[{ id: 10, title: 'May newsletter', impressions: 500, engagementRate: 0.25 }]}
        onSelectPost={() => {}}
        selectedAnalytics={{
          post: { id: 10, title: 'May newsletter' },
          analytics: { totals: { impressions: 500, clicks: 90, engagementRate: 0.18, conversionRate: 0.06 } },
        }}
        onClearSelected={onClearSelected}
      />,
    );

    const selectedPanel = await screen.findByText(/post detail/i);
    const textContainer = selectedPanel.closest('div');
    expect(textContainer).not.toBeNull();
    const panelRoot = textContainer?.parentElement;
    if (!panelRoot) {
      throw new Error('Selected analytics panel not found');
    }
    expect(within(panelRoot).getByText(/may newsletter/i)).toBeInTheDocument();

    const clearButton = within(panelRoot).getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    expect(onClearSelected).toHaveBeenCalledTimes(1);
  });

  it('normalises payload when composing timeline posts', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <TimelinePostComposer
        open
        onClose={() => {}}
        onSubmit={onSubmit}
        availableChannels={['linkedin', 'email_newsletter']}
        submitting={false}
      />,
    );

    await user.type(screen.getByLabelText(/title/i), 'Launch recap');
    await user.selectOptions(screen.getByLabelText(/status/i), ['scheduled']);

    const scheduledInput = screen.getByLabelText(/scheduled for/i);
    fireEvent.change(scheduledInput, { target: { value: '2024-05-05T09:30' } });

    await user.selectOptions(screen.getByLabelText(/visibility/i), ['client']);
    await user.type(screen.getByLabelText(/tags/i), 'Product, Launch');
    await user.type(screen.getByLabelText(/excerpt/i), 'Quick recap');
    await user.type(screen.getByLabelText(/body content/i), 'Full content body');

    await user.click(screen.getByRole('button', { name: /linkedin/i }));

    await user.click(screen.getByRole('button', { name: /add file/i }));

    const attachmentLabel = screen.getByPlaceholderText(/attachment label/i);
    await user.type(attachmentLabel, 'Recap deck');
    const attachmentType = screen.getByPlaceholderText(/type/i);
    await user.type(attachmentType, 'pdf');
    const attachmentUrl = screen.getByPlaceholderText('https://');
    await user.type(attachmentUrl, 'https://cdn.example.com/recap.pdf');

    await user.click(screen.getByRole('button', { name: /publish post/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'Launch recap',
      status: 'scheduled',
      visibility: 'client',
      excerpt: 'Quick recap',
      content: 'Full content body',
      distributionChannels: ['linkedin'],
      tags: ['Product', 'Launch'],
      heroImageUrl: undefined,
      thumbnailUrl: undefined,
    });
    expect(payload.attachments).toEqual([
      { id: expect.any(String), label: 'Recap deck', type: 'pdf', url: 'https://cdn.example.com/recap.pdf' },
    ]);
    expect(payload.scheduledAt).toMatch(/^2024-05-05T09:30/);
  });
});
