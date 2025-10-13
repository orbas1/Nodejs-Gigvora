import { beforeEach, describe, expect, it } from '@jest/globals';
import connectionService from '../src/services/connectionService.js';
import { Connection, Profile, User } from '../src/models/index.js';
import { createUser } from './helpers/factories.js';
import './setupTestEnv.js';

async function createProfile(user, overrides = {}) {
  return Profile.create({
    userId: user.id,
    headline: overrides.headline ?? 'Network builder',
    location: overrides.location ?? 'Remote',
    avatarSeed: overrides.avatarSeed ?? `${user.firstName} ${user.lastName}`,
  });
}

async function connect(requester, addressee, status = 'accepted') {
  await Connection.create({
    requesterId: requester.id,
    addresseeId: addressee.id,
    status,
  });
}

describe('connectionService.buildConnectionNetwork', () => {
  let origin;
  let directAgency;
  let directCompany;
  let indirectFreelancer;
  let thirdDegreeMentor;

  beforeEach(async () => {
    await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
    await Connection.destroy({ truncate: true, cascade: true, restartIdentity: true });
    await Profile.destroy({ truncate: true, cascade: true, restartIdentity: true });

    origin = await createUser({ firstName: 'Origin', lastName: 'Owner', userType: 'freelancer' });
    directAgency = await createUser({ firstName: 'Agena', lastName: 'Bridge', userType: 'agency' });
    directCompany = await createUser({ firstName: 'Comp', lastName: 'Leader', userType: 'company' });
    indirectFreelancer = await createUser({ firstName: 'Indi', lastName: 'Circle', userType: 'freelancer' });
    thirdDegreeMentor = await createUser({ firstName: 'Third', lastName: 'Mentor', userType: 'mentor' });

    await Promise.all([
      createProfile(origin, { headline: 'Principal designer', location: 'London, UK' }),
      createProfile(directAgency, { headline: 'Agency partner', location: 'Berlin, DE' }),
      createProfile(directCompany, { headline: 'Product lead', location: 'NYC, US' }),
      createProfile(indirectFreelancer, { headline: 'UX Research', location: 'Paris, FR' }),
      createProfile(thirdDegreeMentor, { headline: 'Mentor', location: 'Toronto, CA' }),
    ]);

    await connect(origin, directAgency);
    await connect(origin, directCompany);
    await connect(directAgency, indirectFreelancer);
    await connect(indirectFreelancer, thirdDegreeMentor);
  });

  it('segments first, second, and third degree connections with metadata', async () => {
    const network = await connectionService.buildConnectionNetwork({ userId: origin.id });

    expect(network.summary).toEqual({
      firstDegree: 2,
      secondDegree: 1,
      thirdDegree: 1,
      total: 4,
    });

    expect(network.firstDegree.map((entry) => entry.name)).toEqual(
      expect.arrayContaining(['Agena Bridge', 'Comp Leader']),
    );

    expect(network.secondDegree).toHaveLength(1);
    const [second] = network.secondDegree;
    expect(second.name).toBe('Indi Circle');
    expect(second.mutualConnections).toBe(1);
    expect(second.connectors[0]).toMatchObject({ name: 'Agena Bridge' });

    expect(network.thirdDegree).toHaveLength(1);
    const [third] = network.thirdDegree;
    expect(third.name).toBe('Third Mentor');
    expect(third.path.map((node) => node.name)).toEqual([
      'Origin Owner',
      'Agena Bridge',
      'Indi Circle',
      'Third Mentor',
    ]);
  });

  it('enforces role-based connection policy', async () => {
    const policy = (await connectionService.buildConnectionNetwork({ userId: directAgency.id })).policy;
    expect(policy.actorRole).toBe('agency');
    expect(policy.allowedRoles).toEqual(expect.arrayContaining(['freelancer', 'company', 'agency']));
    expect(policy.matrix.freelancer).toEqual(
      expect.arrayContaining(['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter']),
    );
  });
});

describe('connectionService.requestConnection', () => {
  let freelancer;
  let agency;
  let admin;

  beforeEach(async () => {
    await Connection.destroy({ truncate: true, cascade: true, restartIdentity: true });
    freelancer = await createUser({ userType: 'freelancer', firstName: 'Free', lastName: 'Agent' });
    agency = await createUser({ userType: 'agency', firstName: 'Agency', lastName: 'Partner' });
    admin = await createUser({ userType: 'admin', firstName: 'Ada', lastName: 'Admin' });
  });

  it('creates a pending connection when roles allow it', async () => {
    const pending = await connectionService.requestConnection(freelancer.id, agency.id);
    expect(pending.status).toBe('pending');
    expect(pending.requester.id).toBe(freelancer.id);
    expect(pending.addressee.id).toBe(agency.id);
  });

  it('blocks restricted role pairings', async () => {
    await expect(connectionService.requestConnection(admin.id, freelancer.id)).rejects.toThrow('role');
  });
});
