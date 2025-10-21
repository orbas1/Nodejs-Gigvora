import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_PROFILE, DEFAULT_DASHBOARD } from '../sampleData.js';
import {
  HomeProfileSection,
  HomeOverviewSection,
  FinanceManagementSection,
  MentorshipManagementSection,
  MentorshipClientsSection,
  MentorCalendarSection,
  MentorSupportSection,
  MentorInboxSection,
  MentorVerificationSection,
  MentorWalletSection,
  MentorHubSection,
  MentorCreationStudioWizardSection,
  MentorMetricsSection,
  MentorSettingsSection,
  MentorSystemPreferencesSection,
  MentorOrdersSection,
  MentorAdsSection,
} from '../sections/index.js';

describe('mentor dashboard sections', () => {
  it('publishes home profile updates with sanitised payloads', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue();

    render(<HomeProfileSection profile={DEFAULT_PROFILE} onSave={onSave} />);

    await user.clear(screen.getByLabelText(/Full name/i));
    await user.type(screen.getByLabelText(/Full name/i), 'Jordan Mentor');
    await user.clear(screen.getByLabelText(/Signature focus areas/i));
    await user.type(screen.getByLabelText(/Signature focus areas/i), 'Leadership, Product growth');
    const currencyInput = screen.getByLabelText(/Session fee/i, { selector: 'input[type="text"]' });
    const amountInput = screen.getByLabelText(/Session fee/i, { selector: 'input[type="number"]' });
    await user.clear(currencyInput);
    await user.type(currencyInput, '£');
    await user.clear(amountInput);
    await user.type(amountInput, '200');
    await user.clear(screen.getByLabelText(/Social links/i));
    await user.type(screen.getByLabelText(/Social links/i), 'https://mentor.gigvora.com\nhttps://example.com/mentor');

    await user.click(screen.getByRole('button', { name: /publish profile updates/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload.expertise).toEqual(['Leadership', 'Product growth']);
    expect(payload.sessionFee.amount).toBe(200);
    expect(payload.sessionFee.currency).toBe('£');
    expect(payload.socialLinks).toEqual([
      'https://mentor.gigvora.com',
      'https://example.com/mentor',
    ]);
  });

  it('prefills the calendar editor when editing an event', async () => {
    const user = userEvent.setup();
    render(
      <MentorCalendarSection
        events={DEFAULT_DASHBOARD.calendar.events}
        onUpdateEvent={vi.fn().mockResolvedValue()}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    expect(screen.getByLabelText(/Title/i)).toHaveValue('Leadership accelerator session');
    expect(screen.getByLabelText(/Status/i)).toHaveValue('Scheduled');
  });

  it('filters campaigns by status in the ads section', async () => {
    const user = userEvent.setup();
    render(
      <MentorAdsSection
        campaigns={DEFAULT_DASHBOARD.ads.campaigns}
        insights={DEFAULT_DASHBOARD.ads.insights}
      />,
    );

    expect(screen.getAllByRole('heading', { name: 'Explorer spotlight boost' }).length).toBeGreaterThan(0);

    const statusSelects = screen.getAllByLabelText('Status');
    await user.selectOptions(statusSelects[1], 'Paused');

    expect(screen.queryAllByRole('heading', { name: 'Explorer spotlight boost' })).toHaveLength(0);
    expect(screen.getAllByRole('heading', { name: 'Mentorship academy remarketing' }).length).toBeGreaterThan(0);
  });

  it('loads automation blueprints into the mentor hub forms', async () => {
    const user = userEvent.setup();
    render(<MentorHubSection hub={DEFAULT_DASHBOARD.hub} />);

    await user.click(screen.getAllByRole('button', { name: /load blueprint/i })[0]);

    expect(screen.getAllByLabelText('Title')[0]).toHaveValue('Launch: Strategic leadership accelerator');
    expect(screen.getByLabelText(/Priority/i)).toHaveValue('High');
    expect(screen.getByLabelText(/Tags/i).value).toContain('Launch');
  });

  it('persists system preferences and rotates API keys', async () => {
    const user = userEvent.setup();
    const onSavePreferences = vi.fn().mockResolvedValue();
    const onRotateApiKey = vi.fn().mockResolvedValue({ apiKey: 'sk_live_new' });

    render(
      <MentorSystemPreferencesSection
        preferences={DEFAULT_DASHBOARD.systemPreferences}
        onSavePreferences={onSavePreferences}
        onRotateApiKey={onRotateApiKey}
      />,
    );

    await user.click(screen.getByLabelText(/bookings/i));
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await vi.waitFor(() => {
      expect(onSavePreferences).toHaveBeenCalledTimes(1);
    });
    const payload = onSavePreferences.mock.calls[0][0];
    expect(payload.notifications.bookings).toBe(false);

    await user.click(screen.getByRole('button', { name: /rotate key/i }));
    await vi.waitFor(() => {
      expect(onRotateApiKey).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/new api key generated/i)).toBeInTheDocument();
    expect(screen.getByText(/sk_live_new/)).toBeInTheDocument();
  });

  it('renders remaining mentor dashboard sections with realistic sample data', () => {
    const cases = [
      {
        render: () => (
          <HomeOverviewSection
            stats={DEFAULT_DASHBOARD.stats}
            conversion={DEFAULT_DASHBOARD.conversion}
            bookings={DEFAULT_DASHBOARD.bookings}
            explorerPlacement={DEFAULT_DASHBOARD.explorerPlacement}
            feedback={DEFAULT_DASHBOARD.feedback}
            finance={DEFAULT_DASHBOARD.finance}
          />
        ),
        assertion: () => expect(screen.queryAllByText(/Explorer placement/i).length).toBeGreaterThan(0),
      },
      {
        render: () => <FinanceManagementSection finance={DEFAULT_DASHBOARD.finance} />,
        assertion: () => expect(screen.queryAllByText(/Finance management/i).length).toBeGreaterThan(0),
      },
      {
        render: () => (
          <MentorshipManagementSection
            bookings={DEFAULT_DASHBOARD.bookings}
            availability={DEFAULT_DASHBOARD.availability}
            packages={DEFAULT_DASHBOARD.packages}
            segments={DEFAULT_DASHBOARD.segments}
          />
        ),
        assertion: () => expect(screen.queryAllByText(/Mentorship booking/i).length).toBeGreaterThan(0),
      },
      {
        render: () => (
          <MentorshipClientsSection
            clients={DEFAULT_DASHBOARD.clients}
            summary={DEFAULT_DASHBOARD.clientSummary}
          />
        ),
        assertion: () => expect(screen.queryAllByText(/Mentorship clients/i).length).toBeGreaterThan(0),
      },
      {
        render: () => <MentorSupportSection support={DEFAULT_DASHBOARD.support} />,
        assertion: () => expect(screen.queryAllByText(/Support desk/i).length).toBeGreaterThan(0),
      },
      {
        render: () => <MentorInboxSection inbox={DEFAULT_DASHBOARD.inbox} />,
        assertion: () => expect(screen.queryAllByText(/Mentor inbox/i).length).toBeGreaterThan(0),
      },
      {
        render: () => <MentorVerificationSection verification={DEFAULT_DASHBOARD.verification} />,
        assertion: () => expect(screen.queryAllByText(/Verification status/i).length).toBeGreaterThan(0),
      },
      {
        render: () => <MentorWalletSection wallet={DEFAULT_DASHBOARD.wallet} />,
        assertion: () => expect(screen.getAllByRole('button', { name: /record transaction/i }).length).toBeGreaterThan(0),
      },
      {
        render: () => <MentorCreationStudioWizardSection items={DEFAULT_DASHBOARD.creationStudio.items} />,
        assertion: () => expect(screen.queryAllByText(/Creation Studio wizard/i).length).toBeGreaterThan(0),
      },
      {
        render: () => (
          <MentorMetricsSection
            metrics={DEFAULT_DASHBOARD.metricsDashboard.widgets}
            cohorts={DEFAULT_DASHBOARD.metricsDashboard.cohorts}
            reporting={DEFAULT_DASHBOARD.metricsDashboard.reporting}
          />
        ),
        assertion: () => expect(screen.queryAllByText(/Reporting cadence/i).length).toBeGreaterThan(0),
      },
      {
        render: () => <MentorSettingsSection settings={DEFAULT_DASHBOARD.settings} />,
        assertion: () => expect(screen.queryAllByText(/Automation rules/i).length).toBeGreaterThan(0),
      },
      {
        render: () => (
          <MentorOrdersSection
            orders={DEFAULT_DASHBOARD.orders.list}
            summary={DEFAULT_DASHBOARD.orders.summary}
          />
        ),
        assertion: () => expect(screen.queryAllByText(/Orders/i).length).toBeGreaterThan(0),
      },
    ];

    for (const testCase of cases) {
      const view = render(testCase.render());
      testCase.assertion();
      view.unmount();
    }
  });
});
