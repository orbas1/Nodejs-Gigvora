import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CrmConnectorManagerDrawer from '../CrmConnectorManagerDrawer.jsx';

vi.mock('../FieldMappingEditor.jsx', () => ({
  __esModule: true,
  default: () => <div>field-mapping</div>,
}));

vi.mock('../RoleAssignmentEditor.jsx', () => ({
  __esModule: true,
  default: () => <div>role-editor</div>,
}));

vi.mock('../IncidentList.jsx', () => ({
  __esModule: true,
  default: () => <div>incidents</div>,
}));

vi.mock('../SyncHistoryList.jsx', () => ({
  __esModule: true,
  default: () => <div>history</div>,
}));

vi.mock('@headlessui/react', () => {
  const DialogComponent = ({ children }) => (
    <div role="dialog" aria-modal="true">
      {typeof children === 'function' ? children({}) : children}
    </div>
  );
  const Panel = ({ children, ...props }) => (
    <div {...props}>{typeof children === 'function' ? children({}) : children}</div>
  );
  const Title = ({ children }) => <h2>{children}</h2>;
  DialogComponent.Panel = Panel;
  DialogComponent.Title = Title;

  const TransitionRoot = ({ show, children }) => (show ? <div>{children}</div> : null);
  const TransitionChild = ({ children }) => <div>{children}</div>;

  return {
    __esModule: true,
    Dialog: DialogComponent,
    Transition: { Root: TransitionRoot, Child: TransitionChild },
  };
});

const defaults = {
  providers: {
    salesforce: {
      defaultSyncFrequency: 'daily',
      modules: ['accounts', 'opportunities'],
    },
  },
  syncFrequencies: ['manual', 'daily'],
  environments: ['production', 'sandbox'],
};

const connector = {
  id: 'crm-1',
  providerKey: 'salesforce',
  name: 'Salesforce',
  environment: 'production',
  syncFrequency: 'daily',
  modules: ['accounts'],
  incidents: [],
  syncRuns: [],
};

describe('CrmConnectorManagerDrawer', () => {
  it('renders connector details and allows switching sections', () => {
    render(
      <CrmConnectorManagerDrawer
        open
        onClose={vi.fn()}
        connector={connector}
        defaults={defaults}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Salesforce' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('type', 'button');

    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));

    expect(screen.getByRole('button', { name: /run sync/i })).toBeInTheDocument();
  });

  it('invokes close and sync callbacks from the settings view', () => {
    const onClose = vi.fn();
    const onTriggerSync = vi.fn();

    render(
      <CrmConnectorManagerDrawer
        open
        onClose={onClose}
        connector={connector}
        defaults={defaults}
        onTriggerSync={onTriggerSync}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /run sync/i }));
    expect(onTriggerSync).toHaveBeenCalledWith('salesforce', { integrationId: 'crm-1' });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
