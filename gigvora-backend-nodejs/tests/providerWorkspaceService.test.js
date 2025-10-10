import { describe, it, expect } from '@jest/globals';
import {
  createWorkspace,
  listWorkspaces,
  inviteMember,
  acceptInvite,
  updateMember,
  recordContactNote,
} from '../src/services/providerWorkspaceService.js';
import { createUser } from './helpers/factories.js';

describe('providerWorkspaceService', () => {
  it('creates workspaces, manages membership lifecycle, and records contact notes', async () => {
    const owner = await createUser({ email: 'owner@agency.test', userType: 'company' });
    const collaborator = await createUser({ email: 'analyst@agency.test', userType: 'company' });
    const subject = await createUser({ email: 'talent@agency.test', userType: 'freelancer' });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      name: 'Launch Agency',
      slug: 'launch-agency',
      type: 'agency',
      timezone: 'Europe/London',
      defaultCurrency: 'GBP',
      intakeEmail: 'intake@agency.test',
      settings: {
        autoAssign: true,
      },
    });

    expect(workspace).toMatchObject({
      name: 'Launch Agency',
      slug: 'launch-agency',
      members: expect.arrayContaining([expect.objectContaining({ userId: owner.id, role: 'owner', status: 'active' })]),
    });

    const invite = await inviteMember(workspace.id, 'analyst@agency.test', 'manager', owner.id);
    expect(invite).toMatchObject({ status: 'pending', role: 'manager' });

    const acceptedInvite = await acceptInvite(invite.inviteToken, collaborator.id);
    expect(acceptedInvite.status).toBe('accepted');

    const updatedMember = await updateMember(workspace.id, collaborator.id, { status: 'active', role: 'admin' });
    expect(updatedMember).toMatchObject({ role: 'admin', status: 'active' });

    const contactNote = await recordContactNote(
      workspace.id,
      subject.id,
      collaborator.id,
      'Candidate requested interview reschedule; follow up tomorrow.',
      'shared',
    );

    expect(contactNote).toMatchObject({
      workspaceId: workspace.id,
      subjectUserId: subject.id,
      author: expect.objectContaining({ id: collaborator.id }),
      visibility: 'shared',
    });

    const workspaces = await listWorkspaces({ ownerId: owner.id }, { pageSize: 5 });
    expect(workspaces.data[0]).toMatchObject({ id: workspace.id, members: expect.any(Array) });
    expect(workspaces.pagination.total).toBeGreaterThanOrEqual(1);
  });
});
