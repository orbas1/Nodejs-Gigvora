import { render, screen, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PolicyManager from '../PolicyManager.jsx';

vi.mock('../../../../services/legalPolicies.js', () => ({
  fetchAdminLegalPolicies: vi.fn(),
  fetchAdminLegalPolicy: vi.fn(),
  createAdminLegalPolicy: vi.fn(),
  updateAdminLegalPolicy: vi.fn(),
  createAdminLegalPolicyVersion: vi.fn(),
  updateAdminLegalPolicyVersion: vi.fn(),
  publishAdminLegalPolicyVersion: vi.fn(),
  activateAdminLegalPolicyVersion: vi.fn(),
  archiveAdminLegalPolicyVersion: vi.fn(),
}));

import * as services from '../../../../services/legalPolicies.js';

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('PolicyManager', () => {
  const samplePolicies = [
    {
      id: 'doc-1',
      slug: 'terms',
      title: 'Terms of Service',
      category: 'terms',
      status: 'active',
      defaultLocale: 'en',
      region: 'global',
      summary: 'Be excellent.',
      audienceRoles: ['user'],
      editorRoles: ['admin'],
      versions: [
        {
          id: 'ver-1',
          locale: 'en',
          version: 2,
          status: 'published',
          summary: 'Update',
          changeSummary: 'Added dispute section',
          content: 'Long form content',
          effectiveAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        },
      ],
      auditEvents: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    services.fetchAdminLegalPolicies.mockResolvedValue({ data: { documents: samplePolicies } });
    services.fetchAdminLegalPolicy.mockResolvedValue({ data: samplePolicies[0] });
    services.createAdminLegalPolicy.mockResolvedValue({ data: { id: 'doc-2', slug: 'privacy', title: 'Privacy' } });
    services.updateAdminLegalPolicy.mockResolvedValue({});
    services.createAdminLegalPolicyVersion.mockResolvedValue({});
    services.updateAdminLegalPolicyVersion.mockResolvedValue({});
    services.publishAdminLegalPolicyVersion.mockResolvedValue({});
    services.activateAdminLegalPolicyVersion.mockResolvedValue({});
    services.archiveAdminLegalPolicyVersion.mockResolvedValue({});
  });

  it('loads policies and performs document actions', async () => {
    const user = userEvent.setup();

    render(<PolicyManager />);

    expect(services.fetchAdminLegalPolicies).toHaveBeenCalled();

    await screen.findByRole('heading', { name: /terms of service/i });

    const [infoTab] = screen.getAllByRole('button', { name: /^info$/i });
    await runInAct(() => user.click(infoTab));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^edit$/i })));
    const infoDialog = await screen.findByRole('dialog', { name: /edit policy/i });
    await runInAct(() => user.type(within(infoDialog).getByLabelText(/title/i), ' Updated'));
    await runInAct(() => user.click(within(infoDialog).getByRole('button', { name: /^save$/i })));

    await waitFor(() => {
      expect(services.updateAdminLegalPolicy).toHaveBeenCalledWith('doc-1', expect.objectContaining({ title: 'Terms of Service Updated' }));
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await runInAct(() => user.click(screen.getByRole('button', { name: /^version$/i })));
    const versionDialog = await screen.findByRole('dialog');
    await runInAct(() => user.type(within(versionDialog).getByLabelText(/version number/i), '3'));
    await runInAct(() => user.click(within(versionDialog).getByRole('button', { name: /^next$/i })));
    await runInAct(() => user.type(within(versionDialog).getByLabelText(/summary/i), 'Refreshed terms'));
    await runInAct(() => user.type(within(versionDialog).getByLabelText(/content/i), '## Terms body'));
    await runInAct(() => user.click(within(versionDialog).getByRole('button', { name: /^create$/i })));

    await waitFor(() => {
      expect(services.createAdminLegalPolicyVersion).toHaveBeenCalledWith('doc-1', expect.objectContaining({ summary: 'Refreshed terms' }));
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await runInAct(() => user.click(screen.getByRole('button', { name: /^new$/i })));
    const createDialog = await screen.findByRole('dialog');
    await runInAct(() => user.type(within(createDialog).getByLabelText(/^title$/i), 'Privacy Policy'));
    await runInAct(() => user.type(within(createDialog).getByLabelText(/slug/i), 'privacy'));
    await runInAct(() => user.click(within(createDialog).getByRole('button', { name: /^create$/i })));

    await waitFor(() => {
      expect(services.createAdminLegalPolicy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Privacy Policy', slug: 'privacy' }),
      );
    });
  });
});
