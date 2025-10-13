import { describe, it, expect, beforeEach } from '@jest/globals';
import { Group, GroupMembership } from '../src/models/index.js';
import groupService from '../src/services/groupService.js';
import { createUser } from './helpers/factories.js';

async function resetGroups() {
  await GroupMembership.destroy({ where: {} });
  await Group.destroy({ where: {} });
}

describe('groupService', () => {
  let adminUser;
  let agencyUser;
  let memberUser;

  beforeEach(async () => {
    await resetGroups();
    adminUser = await createUser({ userType: 'admin', firstName: 'Ada', lastName: 'Admin' });
    agencyUser = await createUser({ userType: 'agency', firstName: 'Noah', lastName: 'Navigator' });
    memberUser = await createUser({ userType: 'freelancer', firstName: 'Faye', lastName: 'Builder' });
  });

  it('creates a group with unique slug and owner membership', async () => {
    const result = await groupService.createGroup(
      {
        name: 'Community Leadership Guild',
        description: 'Driving community rituals and success metrics.',
        visibility: 'private',
        memberPolicy: 'invite',
        avatarColor: '#1d4ed8',
      },
      { actor: { id: adminUser.id, userType: adminUser.userType } },
    );

    expect(result).toMatchObject({
      name: 'Community Leadership Guild',
      slug: 'community-leadership-guild',
      visibility: 'private',
      memberPolicy: 'invite',
      metrics: expect.objectContaining({ activeMembers: 1, totalMembers: 1 }),
    });

    expect(result.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: adminUser.id,
          role: 'owner',
          status: 'active',
        }),
      ]),
    );
  });

  it('prevents non-managers from managing groups', async () => {
    await expect(
      groupService.createGroup(
        { name: 'Unauthorized Circle' },
        { actor: { id: memberUser.id, userType: memberUser.userType } },
      ),
    ).rejects.toThrow('permission');
  });

  it('supports membership requests and approvals', async () => {
    const group = await groupService.createGroup(
      {
        name: 'Partnership Council',
        memberPolicy: 'request',
      },
      { actor: { id: agencyUser.id, userType: agencyUser.userType } },
    );

    const request = await groupService.requestMembership(group.id, {
      actor: { id: memberUser.id, userType: memberUser.userType },
      message: 'Excited to contribute',
    });

    expect(request).toMatchObject({
      userId: memberUser.id,
      status: 'pending',
      notes: 'Excited to contribute',
    });

    const activated = await groupService.updateMember(
      group.id,
      request.id,
      { status: 'active', role: 'member' },
      { actor: { id: agencyUser.id, userType: agencyUser.userType } },
    );

    expect(activated.status).toBe('active');
    expect(activated.joinedAt).toBeTruthy();
  });

  it('lists managed groups with pagination metadata', async () => {
    await groupService.createGroup(
      { name: 'North Guild' },
      { actor: { id: adminUser.id, userType: adminUser.userType } },
    );
    await groupService.createGroup(
      { name: 'South Guild' },
      { actor: { id: adminUser.id, userType: adminUser.userType } },
    );

    const result = await groupService.listGroups({
      actor: { id: adminUser.id, userType: adminUser.userType },
      includeMembers: true,
      page: 1,
      pageSize: 5,
    });

    expect(result.pagination).toMatchObject({ total: 2, page: 1, pageSize: 5, totalPages: 1 });
    expect(result.data.length).toBe(2);
    expect(result.data[0].members?.[0]).toMatchObject({ status: 'active' });
  });
});
