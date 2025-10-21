import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntegrationActivityLog from '../integrations/IntegrationActivityLog.jsx';
import IntegrationCard from '../integrations/IntegrationCard.jsx';
import IntegrationCreationWizard from '../integrations/IntegrationCreationWizard.jsx';
import IntegrationManageDrawer from '../integrations/IntegrationManageDrawer.jsx';
import IntegrationProviderCatalog from '../integrations/IntegrationProviderCatalog.jsx';
import IntegrationSummaryHeader from '../integrations/IntegrationSummaryHeader.jsx';

describe('Agency integrations surfaces', () => {
  it('renders provider catalog cards', () => {
    render(
      <IntegrationProviderCatalog
        providers={[
          {
            key: 'hubspot',
            name: 'HubSpot',
            category: 'crm',
            authType: 'oauth',
            defaultSyncFrequency: 'hourly',
            requiresSecrets: true,
            requiredScopes: ['contacts.read'],
            docsUrl: 'https://docs.example.com',
          },
        ]}
      />,
    );

    expect(screen.getByText('HubSpot')).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Docs/i })).toHaveAttribute('href', 'https://docs.example.com');
  });

  it('summarises integration metrics', async () => {
    const user = userEvent.setup();
    const handleWorkspaceChange = vi.fn();
    const handleRefresh = vi.fn();
    const handleCreate = vi.fn();

    render(
      <IntegrationSummaryHeader
        workspace={{ id: 1, name: 'Atlas Agency' }}
        summary={{
          total: 5,
          connected: 4,
          pending: 1,
          error: 0,
          lastSyncedAt: Date.now() - 60_000,
          webhooks: 3,
          secrets: 7,
        }}
        availableWorkspaces={[{ id: 1, name: 'Atlas Agency' }, { id: 2, name: 'Beta Studio' }]}
        selectedWorkspaceId={1}
        onWorkspaceChange={handleWorkspaceChange}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        refreshing={false}
      />,
    );

    expect(screen.getByText('Integrations')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Workspace'), '2');
    expect(handleWorkspaceChange).toHaveBeenCalledWith('2');

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(handleRefresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'New' }));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('shows integration activity log entries', () => {
    render(
      <IntegrationActivityLog
        auditLog={[
          {
            id: 'evt-1',
            summary: 'Rotated credential',
            createdAt: '2024-05-01T12:00:00Z',
            actor: { name: 'Taylor' },
            detail: { secretId: 'sec-1' },
          },
        ]}
      />,
    );

    expect(screen.getByText('Rotated credential')).toBeInTheDocument();
    expect(screen.getByText(/Taylor/)).toBeInTheDocument();
    expect(screen.getByText(/sec-1/)).toBeInTheDocument();
  });

  it('tests integrations and opens manage drawer', async () => {
    const user = userEvent.setup();
    const handleManage = vi.fn();
    const handleTest = vi.fn().mockResolvedValue({ status: 'connected', latencyMs: 120 });

    render(
      <IntegrationCard
        integration={{
          id: 12,
          displayName: 'HubSpot',
          providerKey: 'hubspot',
          status: 'pending',
          syncFrequency: 'daily',
          secrets: [{ id: 1 }],
          webhooks: [],
          lastSyncedAt: '2024-05-01T12:00:00Z',
          metadata: { owner: 'Taylor' },
        }}
        availableProviders={[{ key: 'hubspot', name: 'HubSpot CRM' }]}
        onOpen={handleManage}
        onTestConnection={handleTest}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Test' }));
    await waitFor(() => expect(handleTest).toHaveBeenCalledWith(12));
    expect(screen.getByText(/connected/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manage' }));
    expect(handleManage).toHaveBeenCalled();
  });

  it('steps through the integration creation wizard', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <IntegrationCreationWizard
        open
        onClose={() => {}}
        providers={[
          {
            key: 'slack',
            name: 'Slack',
            category: 'communication',
            defaultSyncFrequency: 'daily',
            requiredScopes: ['chat:write'],
          },
        ]}
        onSubmit={handleSubmit}
      />,
    );

    await user.click(screen.getByText('Slack'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const nameField = screen.getByLabelText('Name');
    await user.clear(nameField);
    await user.type(nameField, 'Slack Alerts');
    await user.selectOptions(screen.getByLabelText('Status'), 'connected');
    await user.selectOptions(screen.getByLabelText('Sync'), 'hourly');
    await user.type(screen.getByLabelText('Owner'), 'Ops Team');
    await user.type(screen.getByLabelText('Environment'), 'production');
    await user.type(screen.getByLabelText('Regions'), 'us-east-1');
    await user.type(screen.getByLabelText('Notes'), 'Monitor workspace alerts.');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create integration' }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          providerKey: 'slack',
          displayName: 'Slack Alerts',
          status: 'connected',
          syncFrequency: 'hourly',
          metadata: expect.objectContaining({
            owner: 'Ops Team',
            environment: 'production',
            regions: ['us-east-1'],
            notes: 'Monitor workspace alerts.',
            scopes: expect.arrayContaining(['chat:write']),
          }),
        }),
      );
    });
  });

  it('updates integration details from manage drawer', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn().mockResolvedValue();
    const handleRotateSecret = vi.fn().mockResolvedValue();

    render(
      <IntegrationManageDrawer
        open
        integration={{
          id: 21,
          displayName: 'Notion',
          providerKey: 'notion',
          status: 'pending',
          syncFrequency: 'weekly',
          metadata: { owner: 'Ops' },
          secrets: [],
          webhooks: [],
        }}
        availableProviders={[{ key: 'notion', name: 'Notion' }]}
        onUpdate={handleUpdate}
        onRotateSecret={handleRotateSecret}
        onTestConnection={vi.fn()}
        onCreateWebhook={vi.fn()}
        onUpdateWebhook={vi.fn()}
        onDeleteWebhook={vi.fn()}
        onClose={() => {}}
      />,
    );

    const nameField = screen.getByLabelText('Name');
    await user.clear(nameField);
    await user.type(nameField, 'Notion Ops');
    await user.selectOptions(screen.getByLabelText('Status'), 'connected');
    await user.selectOptions(screen.getByLabelText('Sync'), 'daily');
    const ownerField = screen.getByLabelText('Owner');
    await user.clear(ownerField);
    await user.type(ownerField, 'Finance');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(handleUpdate).toHaveBeenCalledWith(
      21,
      expect.objectContaining({
        displayName: 'Notion Ops',
        status: 'connected',
        syncFrequency: 'daily',
        metadata: expect.objectContaining({ owner: 'Finance' }),
      }),
    );
  });
});
