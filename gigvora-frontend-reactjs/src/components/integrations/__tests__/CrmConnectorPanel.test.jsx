import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CrmConnectorPanel from '../CrmConnectorPanel.jsx';

const drawerRenderSpy = vi.fn();

vi.mock('../CrmConnectorManagerDrawer.jsx', () => ({
  __esModule: true,
  default: (props) => {
    drawerRenderSpy(props);
    return <div data-testid="connector-drawer" data-open={props.open} />;
  },
}));

describe('CrmConnectorPanel', () => {
  beforeEach(() => {
    drawerRenderSpy.mockReset();
  });

  const connector = {
    id: 'crm-1',
    providerKey: 'salesforce',
    name: 'Salesforce',
    status: 'connected',
    environment: 'production',
    syncFrequency: 'daily',
    modules: ['accounts', 'opportunities'],
    authType: 'api_key',
    owner: 'Ops',
    nextSyncAt: '2024-05-01T15:00:00Z',
    syncRuns: [{ id: 'run-1', status: 'completed', startedAt: '2024-04-30T10:00:00Z' }],
    incidents: [{ id: 'incident-1', status: 'open', summary: 'Sync queue', openedAt: '2024-04-30T11:00:00Z' }],
  };

  const renderPanel = (override = {}) =>
    render(
      <CrmConnectorPanel
        connector={{ ...connector, ...override }}
        defaults={{}}
        onUpdateSettings={vi.fn()}
        onRotateCredential={vi.fn()}
        onUpdateFieldMappings={vi.fn()}
        onUpdateRoleAssignments={vi.fn()}
        onTriggerSync={vi.fn()}
        onCreateIncident={vi.fn()}
        onResolveIncident={vi.fn()}
      />,
    );

  it('renders the connector summary with status and incident banner', () => {
    renderPanel();

    expect(screen.getByText('Salesforce')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2 modules')).toBeInTheDocument();
    expect(screen.getByText(/open incident/i)).toBeInTheDocument();
  });

  it('triggers syncs and toggles the manager drawer visibility', () => {
    const onTriggerSync = vi.fn();

    render(
      <CrmConnectorPanel
        connector={connector}
        defaults={{}}
        onUpdateSettings={vi.fn()}
        onRotateCredential={vi.fn()}
        onUpdateFieldMappings={vi.fn()}
        onUpdateRoleAssignments={vi.fn()}
        onTriggerSync={onTriggerSync}
        onCreateIncident={vi.fn()}
        onResolveIncident={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^sync$/i }));
    expect(onTriggerSync).toHaveBeenCalledWith('salesforce', { integrationId: 'crm-1' });

    const drawer = screen.getByTestId('connector-drawer');
    expect(drawer).toHaveAttribute('data-open', 'false');

    fireEvent.click(screen.getByRole('button', { name: /manage/i }));
    expect(drawerRenderSpy).toHaveBeenLastCalledWith(expect.objectContaining({ open: true }));
  });
});
