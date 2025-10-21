import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import RbacMatrixPanel from '../RbacMatrixPanel.jsx';
import { fetchRbacMatrix } from '../../../services/rbac.js';

vi.mock('../../../services/rbac.js', () => ({
  fetchRbacMatrix: vi.fn(),
}));

const baseMatrix = {
  version: '2024.10.21',
  publishedAt: '2024-10-21T08:00:00.000Z',
  reviewCadenceDays: 30,
  personas: [
    {
      key: 'platform_admin',
      label: 'Platform Administrator',
      description: 'Owns production configuration and emergency response.',
      defaultChannels: ['email', 'slack'],
      escalationTarget: 'security.operations',
      grants: [
        {
          policyKey: 'platform.runtime.control',
          resource: 'runtime.telemetry',
          actions: ['view', 'acknowledge'],
          constraints: ['MFA enforced before acknowledgement.'],
        },
      ],
    },
    {
      key: 'security_officer',
      label: 'Security Officer',
      description: 'Handles perimeter enforcement and incident response.',
      defaultChannels: ['pagerduty'],
      escalationTarget: 'chief.security.officer',
      grants: [
        {
          policyKey: 'governance.rbac.matrix',
          resource: 'governance.rbac',
          actions: ['view', 'simulate'],
          constraints: ['Simulations must cite incident ticket.'],
        },
      ],
    },
  ],
  guardrails: [
    {
      key: 'mfa-enforcement',
      label: 'Multi-factor enforcement',
      description: 'Privileged actions require WebAuthn or TOTP.',
      coverage: ['platform_admin', 'security_officer'],
      severity: 'critical',
    },
    {
      key: 'change-window-governance',
      label: 'Change window governance',
      description: 'Runtime changes restricted to approved windows.',
      coverage: ['platform_admin'],
      severity: 'high',
    },
    {
      key: 'dual-approval',
      label: 'Dual approval for secret rotation',
      description: 'Secret rotations require dual approval before execution.',
      coverage: ['platform_admin'],
      severity: 'high',
    },
  ],
  resources: [
    {
      key: 'runtime.telemetry',
      label: 'Runtime telemetry & readiness',
      description: 'Aggregated readiness snapshots, dependency guard state, exporter freshness.',
      owner: 'Platform Operations',
      surfaces: ['admin-dashboard'],
    },
    {
      key: 'governance.rbac',
      label: 'RBAC policy matrix & audit trail',
      description: 'Persona-level permissions and audit exports.',
      owner: 'Security Governance',
      surfaces: ['admin-dashboard', 'api'],
    },
  ],
};

describe('RbacMatrixPanel', () => {
  let user;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup({
      eventWrapper: async (callback) => {
        await act(async () => {
          await callback();
        });
      },
    });
  });

  it('renders the RBAC matrix and refreshes data on demand', async () => {
    const updatedMatrix = {
      ...baseMatrix,
      guardrails: [
        ...baseMatrix.guardrails,
        {
          key: 'watermark-enforcement',
          label: 'Audit watermark enforcement',
          description: 'Exports require watermarking and incident reference.',
          coverage: ['platform_admin', 'compliance_manager'],
          severity: 'medium',
        },
      ],
      personas: [
        ...baseMatrix.personas,
        {
          key: 'compliance_manager',
          label: 'Compliance Manager',
          description: 'Publishes legal policies and export audits.',
          defaultChannels: ['email'],
          escalationTarget: 'chief.legal.officer',
          grants: [],
        },
      ],
    };

    fetchRbacMatrix
      .mockResolvedValueOnce(baseMatrix)
      .mockResolvedValueOnce(updatedMatrix);

    await act(async () => {
      render(<RbacMatrixPanel />);
    });

    expect(await screen.findByText('Security controls enforced across privileged personas.')).toBeInTheDocument();
    expect(screen.getByText('Platform Administrator')).toBeInTheDocument();
    expect(screen.getByText('Security Officer')).toBeInTheDocument();
    expect(fetchRbacMatrix).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => expect(fetchRbacMatrix).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Audit watermark enforcement')).toBeInTheDocument();
  });

  it('surfaces API failures with actionable messaging', async () => {
    fetchRbacMatrix.mockRejectedValueOnce(new Error('RBAC service unavailable'));

    await act(async () => {
      render(<RbacMatrixPanel />);
    });

    expect(await screen.findByText(/RBAC service unavailable/)).toBeInTheDocument();
    expect(screen.getByText("We couldn't refresh your data")).toBeInTheDocument();
  });

  it('shows guidance when the matrix has not been published yet', async () => {
    fetchRbacMatrix.mockResolvedValueOnce(null);

    await act(async () => {
      render(<RbacMatrixPanel />);
    });

    expect(
      await screen.findByText(/RBAC metadata has not been published yet/i),
    ).toBeInTheDocument();
  });
});
