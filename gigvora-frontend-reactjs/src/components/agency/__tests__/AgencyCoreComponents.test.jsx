import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const dataStatusSpy = vi.fn();

vi.mock('../../DataStatus.jsx', () => ({
  __esModule: true,
  default: (props) => {
    dataStatusSpy(props);
    return (
      <button type="button" data-testid="data-status" onClick={props.onRefresh}>
        {props.loading ? 'Loading…' : 'Ready'}
      </button>
    );
  },
}));

vi.mock('../PanelDialog.jsx', () => ({
  __esModule: true,
  default: ({ open, children, actions, onClose, title }) =>
    open ? (
      <div data-testid="panel">
        <h2>{title}</h2>
        <button type="button" data-testid="panel-close" onClick={onClose}>
          Close
        </button>
        <div>{children}</div>
        <div data-testid="panel-actions">{actions}</div>
      </div>
    ) : null,
}));

import AgencyAiActivityLog from '../AgencyAiActivityLog.jsx';
import AgencyAiOverview from '../AgencyAiOverview.jsx';
import AgencyApiKeyCard from '../AgencyApiKeyCard.jsx';
import AgencyAutoReplySettings from '../AgencyAutoReplySettings.jsx';
import AgencyBidTemplates from '../AgencyBidTemplates.jsx';
import AgencyBiddingStrategyForm from '../AgencyBiddingStrategyForm.jsx';
import AgencyOverviewContent from '../AgencyOverviewContent.jsx';
import AgencyOverviewSection from '../AgencyOverviewSection.jsx';
import CredentialManager from '../CredentialManager.jsx';
import ExperienceManager from '../ExperienceManager.jsx';
import MediaGalleryManager from '../MediaGalleryManager.jsx';
import ProfileBasicsForm from '../ProfileBasicsForm.jsx';
import SkillTagManager from '../SkillTagManager.jsx';

const baseCredential = {
  id: 'cred-1',
  type: 'qualification',
  title: 'PMP',
  issuer: 'PMI',
  issuedAt: '2021-01-01',
  verificationStatus: 'verified',
};

const baseExperience = {
  id: 'exp-1',
  title: 'Product overhaul',
  summary: 'Led redesign',
  startDate: '2023-01-01',
  endDate: '2023-06-01',
  tags: ['design'],
};

const baseMedia = {
  id: 'media-1',
  type: 'image',
  title: 'Showcase',
  url: 'https://cdn.example.com/image.jpg',
  position: 1,
};

const baseSkill = {
  id: 'skill-1',
  name: 'Product strategy',
  category: 'Strategy',
  proficiency: 90,
  experienceYears: 4,
  position: 1,
  isFeatured: true,
};

describe('Agency AI and automation components', () => {
  beforeEach(() => {
    dataStatusSpy.mockClear();
  });

  it('renders activity log entries with timestamps', () => {
    render(
      <AgencyAiActivityLog
        activityLog={[{ id: '1', summary: 'Auto-replied to lead', createdAt: '2024-02-01T09:00:00Z', details: 'Sent onboarding kit.' }]}
      />,
    );

    expect(screen.getByText(/auto-replied to lead/i)).toBeInTheDocument();
    expect(screen.getByText(/onboarding kit/i)).toBeInTheDocument();
  });

  it('surfaces analytics cards and forwards refresh props', () => {
    const onRefresh = vi.fn();
    render(
      <AgencyAiOverview
        workspaceName="Atlas Studio"
        analytics={{ autoRepliesLast7Days: 4, bidWinRate: 52.3, bidsSubmittedLast30Days: 18, avgBidTurnaroundMinutes: 12 }}
        loading
        fromCache
        lastUpdated={new Date('2024-03-01T12:00:00Z')}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText(/atlas studio/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(dataStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ loading: true, fromCache: true, onRefresh }),
    );
  });

  it('allows managing API keys with success and error feedback', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue();
    const remove = vi.fn().mockRejectedValue(new Error('Cannot remove key'));

    render(
      <AgencyApiKeyCard
        apiKey={{ fingerprint: '****1234', configured: true, updatedAt: '2024-02-01T10:00:00Z' }}
        onSave={save}
        onRemove={remove}
      />,
    );

    await user.type(screen.getByPlaceholderText(/sk-live/i), 'sk-live-abc');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(save).toHaveBeenCalled();
    });
    expect(save).toHaveBeenCalledWith({ apiKey: 'sk-live-abc' });

    await user.click(screen.getByRole('button', { name: /remove key/i }));
    await waitFor(() => {
      expect(remove).toHaveBeenCalled();
    });
    expect(await screen.findByText(/cannot remove key/i)).toBeInTheDocument();
  });

  it('persists auto reply configuration and opens test conversation', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    render(
      <AgencyAutoReplySettings
        settings={{ enabled: true, channels: ['direct'], temperature: 0.2, responseTimeGoalMinutes: 8, model: 'gpt-4o-mini' }}
        onSave={save}
      />,
    );

    await user.click(screen.getByRole('button', { name: /test/i }));
    expect(openSpy).toHaveBeenCalledWith('/inbox?compose=ai-auto-reply-test', '_blank', 'noopener');

    await user.click(screen.getByLabelText(/project rooms/i));
    await user.clear(screen.getByLabelText(/instructions/i));
    await user.type(screen.getByLabelText(/instructions/i), 'Use short greetings.');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          autoReply: expect.objectContaining({
            instructions: 'Use short greetings.',
            channels: expect.arrayContaining(['project']),
          }),
        }),
      );
    });
    openSpy.mockRestore();
  });

  it('supports bid template creation and deletion flows', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue();
    const update = vi.fn().mockResolvedValue();
    const remove = vi.fn().mockResolvedValue();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    render(
      <AgencyBidTemplates
        templates={[{ id: 'template-1', name: 'Growth', status: 'active', markupPercent: 20, responseSlaHours: 8, deliveryWindowDays: 5 }]}
        onCreate={create}
        onUpdate={update}
        onDelete={remove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /board/i }));
    expect(openSpy).toHaveBeenCalledWith('/dashboard/agency?aiTemplate=template-1', '_blank', 'noopener');

    await user.click(screen.getByRole('button', { name: /new template/i }));
    const dialog = await screen.findByRole('dialog');
    await user.clear(within(dialog).getByLabelText(/name/i));
    await user.type(within(dialog).getByLabelText(/name/i), 'Launchpad');
    await user.click(within(dialog).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(create).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('template-1');
    confirmSpy.mockRestore();
    openSpy.mockRestore();
  });

  it('submits bidding strategy updates with guardrails', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue();

    render(
      <AgencyBiddingStrategyForm
        bidding={{ enabled: false, strategy: 'balanced', markupPercent: 15, guardrails: { requireHumanReview: true, notifyOwner: true, maxConcurrentBids: 2, minRatingThreshold: 4.5 } }}
        onSave={save}
      />,
    );

    await user.click(screen.getByLabelText(/enable/i));
    await user.type(screen.getByLabelText(/minimum budget/i), '500');
    await user.clear(screen.getByLabelText(/target markup/i));
    await user.type(screen.getByLabelText(/target markup/i), '18');
    await user.click(screen.getByRole('button', { name: /save bidding/i }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          bidding: expect.objectContaining({ enabled: true, minBudget: 500, markupPercent: 18 }),
        }),
      );
    });
  });
});

describe('Agency profile and workspace components', () => {

  it('renders overview content sections', () => {
    render(
      <MemoryRouter>
        <AgencyOverviewContent displayName="Atlas" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/hello, atlas/i)).toBeInTheDocument();
    expect(screen.getByText(/team focus/i)).toBeInTheDocument();
  });

  it('renders overview section summary', () => {
    render(
      <MemoryRouter>
        <AgencyOverviewSection displayName="Atlas" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/agency control tower/i)).toBeInTheDocument();
    expect(screen.getByText(/bench capacity/i)).toBeInTheDocument();
  });

  it('creates, updates, and reports credential errors', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue();
    const update = vi.fn().mockResolvedValue();
    const remove = vi.fn().mockRejectedValue(new Error('Failed to delete'));

    render(
      <CredentialManager
        credentials={[baseCredential]}
        onCreate={create}
        onUpdate={update}
        onDelete={remove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    const panel = screen.getByTestId('panel');
    await user.type(within(panel).getByLabelText(/title/i), 'Lead facilitator');
    await user.click(within(panel).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(create).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editPanel = screen.getByTestId('panel');
    await user.type(within(editPanel).getByLabelText(/issuer/i), ' Guild');
    await user.click(within(editPanel).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(update).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(await screen.findByText(/failed to delete/i)).toBeInTheDocument();
  });

  it('collects experience payloads with tags', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue();

    render(<ExperienceManager experiences={[baseExperience]} onCreate={create} />);

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    const panel = screen.getByTestId('panel');
    await user.type(within(panel).getByLabelText(/title/i), ' Growth sprint');
    await user.type(within(panel).getByLabelText(/tags/i), 'growth, ai');
    await user.click(within(panel).getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining(['growth', 'ai']),
        }),
      );
    });
  });

  it('manages media gallery items and handles delete errors', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue();
    const remove = vi.fn().mockRejectedValue(new Error('Cannot remove asset'));

    render(<MediaGalleryManager media={[baseMedia]} onCreate={create} onDelete={remove} />);

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    const panel = screen.getByTestId('panel');
    await user.selectOptions(within(panel).getByLabelText(/type/i), 'video');
    await user.clear(within(panel).getByLabelText(/link/i));
    await user.type(within(panel).getByLabelText(/link/i), 'https://cdn.example.com/video');
    await user.click(within(panel).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(create).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(await screen.findByText(/cannot remove asset/i)).toBeInTheDocument();
  });

  it('submits profile basics form and previews imagery', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue();

    render(
      <ProfileBasicsForm
        profile={{ tagline: 'We design velocity', bannerImageUrl: 'https://cdn/banner.jpg', profileImageUrl: 'https://cdn/avatar.jpg' }}
        onSubmit={save}
      />,
    );

    await user.click(screen.getByRole('button', { name: /preview/i }));
    expect(screen.getByTestId('panel')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/tagline/i), ' for agencies');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ tagline: 'We design velocity for agencies' }),
      );
    });
  });

  it('manages skill tags and reports deletion errors', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue();
    const remove = vi.fn().mockRejectedValue(new Error('Cannot remove skill'));

    render(
      <SkillTagManager
        skills={[baseSkill]}
        onCreate={create}
        onDelete={remove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    const panel = screen.getByTestId('panel');
    await user.type(within(panel).getByLabelText(/name/i), ' Growth strategy');
    await user.click(within(panel).getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(create).toHaveBeenCalled();
    });

    await user.click(screen.getAllByRole('button', { name: /remove/i })[0]);
    expect(await screen.findByText(/cannot remove skill/i)).toBeInTheDocument();
  });
});
