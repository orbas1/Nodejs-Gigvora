import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StorageLocationsPanel from '../StorageLocationsPanel.jsx';
import StorageRulesPanel from '../StorageRulesPanel.jsx';
import StoragePresetsPanel from '../StoragePresetsPanel.jsx';
import StorageAuditPanel from '../StorageAuditPanel.jsx';

describe('Storage admin panels', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup({ applyAcceptDefaultUnhandledRejections: false });
  });

  it('allows admins to open and create storage locations', async () => {
    const handleAdd = vi.fn();
    const handleOpen = vi.fn();

    render(
      <StorageLocationsPanel
        locations={[
          {
            id: 1,
            name: 'Primary site',
            provider: 'cloudflare_r2',
            status: 'active',
            isPrimary: true,
            versioningEnabled: true,
            replicationEnabled: false,
            metrics: {
              usageLabel: '12 GB',
              objectLabel: '120 files',
              ingestLabel: '600 MB in',
              egressLabel: '150 MB out',
            },
          },
        ]}
        onAdd={handleAdd}
        onOpen={handleOpen}
      />,
    );

    await user.click(screen.getByRole('button', { name: /new site/i }));
    expect(handleAdd).toHaveBeenCalled();

    await user.click(screen.getByText('Primary site'));
    expect(handleOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Primary site' }),
    );
  });

  it('summarises lifecycle rules', () => {
    render(
      <StorageRulesPanel
        rules={[
          {
            id: 1,
            name: 'Archive completed',
            locationName: 'Primary site',
            status: 'active',
            transitionAfterDays: 30,
            transitionStorageClass: 'glacier',
            expireAfterDays: 365,
            deleteExpiredObjects: true,
            compressObjects: true,
            description: 'Archive and purge stale deliverables.',
          },
        ]}
      />,
    );

    expect(screen.getByText('Archive completed')).toBeInTheDocument();
    expect(screen.getByText('After 30 days → glacier')).toBeInTheDocument();
    expect(screen.getByText('365 days • delete')).toBeInTheDocument();
  });

  it('renders upload presets with formatted metadata', () => {
    render(
      <StoragePresetsPanel
        presets={[
          {
            id: 1,
            name: 'Marketing assets',
            locationName: 'Global CDN',
            description: 'Optimised for campaign uploads.',
            active: true,
            maxSizeLabel: '250 MB',
            expiresLabel: '7 days',
            allowedMimeTypes: ['image/png', 'image/jpeg', 'video/mp4'],
            allowedRoles: ['marketing'],
            requireModeration: true,
            encryption: 'AES256',
          },
        ]}
      />,
    );

    expect(screen.getByText('Marketing assets')).toBeInTheDocument();
    expect(screen.getByText('image/png, image/jpeg, video/mp4')).toBeInTheDocument();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
  });

  it('lists recent audit events with metadata', () => {
    render(
      <StorageAuditPanel
        auditLog={[
          {
            id: 1,
            summary: 'Lifecycle rule updated',
            eventType: 'rule.updated',
            actorLabel: 'Alice',
            timeLabel: '2 minutes ago',
            createdLabel: '2024-03-22 09:00',
            metadataPreview: [
              { label: 'Rule', value: 'Archive completed' },
              { label: 'Status', value: 'active' },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Lifecycle rule updated')).toBeInTheDocument();
    expect(screen.getByText('Rule')).toBeInTheDocument();
    expect(screen.getByText('Archive completed')).toBeInTheDocument();
  });
});
