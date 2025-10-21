import { describe, beforeEach, it, expect } from '@jest/globals';
import {
  CompanyProfile,
  CompanyProfileFollower,
  CompanyProfileConnection,
  Profile,
  User,
} from '../../src/models/index.js';
import companyProfileService from '../../src/services/companyProfileService.js';

describe('companyProfileService', () => {
  let owner;
  let companyProfile;
  let followerUser;
  let targetUser;
  let targetCompanyProfile;

  beforeEach(async () => {
    owner = await User.create({
      firstName: 'Owner',
      lastName: 'Profile',
      email: `owner-profile-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'company',
    });
    await Profile.create({ userId: owner.id, headline: 'Hiring lead' });
    companyProfile = await CompanyProfile.create({ userId: owner.id, companyName: 'Profile Corp' });

    followerUser = await User.create({
      firstName: 'Follower',
      lastName: 'Member',
      email: `follower-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'user',
    });
    await Profile.create({ userId: followerUser.id, headline: 'Product designer' });

    targetUser = await User.create({
      firstName: 'Partner',
      lastName: 'Lead',
      email: `partner-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'company',
    });
    await Profile.create({ userId: targetUser.id, headline: 'Operations lead' });
    targetCompanyProfile = await CompanyProfile.create({ userId: targetUser.id, companyName: 'Partner Ltd' });
  });

  it('updates company details, manages followers, and connections', async () => {
    const updatedProfile = await companyProfileService.updateCompanyProfileDetails(owner.id, {
      companyName: 'Profile Corp International',
      tagline: 'Building future of work',
      description: 'We enable companies to launch collaborative experiences.',
      website: 'https://profile.example.com',
      location: 'London',
      contactEmail: 'hello@profile.example.com',
      socialLinks: [{ label: 'LinkedIn', url: 'https://linkedin.com/company/profile-corp' }],
    });

    expect(updatedProfile.companyName).toBe('Profile Corp International');
    expect(updatedProfile.locationDetails?.name).toBe('London');
    expect(updatedProfile.socialLinks[0]).toMatchObject({ label: 'LinkedIn' });

    const follower = await companyProfileService.addFollower({
      userId: owner.id,
      followerId: followerUser.id,
      status: 'active',
      notificationsEnabled: false,
    });

    expect(follower.status).toBe('active');
    expect(follower.notificationsEnabled).toBe(false);
    expect(follower.follower?.profile?.headline).toBe('Product designer');

    const connection = await companyProfileService.createConnection({
      userId: owner.id,
      targetUserId: targetUser.id,
      relationshipType: 'partner',
      status: 'pending',
      contactEmail: 'ops@partner.test',
      notes: 'Discuss quarterly initiative',
    });

    expect(connection.target?.id).toBe(targetUser.id);
    expect(connection.targetCompanyProfile?.id).toBe(targetCompanyProfile.id);

    const activated = await companyProfileService.updateConnection({
      userId: owner.id,
      connectionId: connection.id,
      status: 'active',
      notes: 'Kickoff scheduled',
    });

    expect(activated.status).toBe('active');
    expect(activated.notes).toBe('Kickoff scheduled');

    const followerCount = await CompanyProfileFollower.count({ where: { companyProfileId: companyProfile.id } });
    const connectionCount = await CompanyProfileConnection.count({ where: { companyProfileId: companyProfile.id } });

    expect(followerCount).toBe(1);
    expect(connectionCount).toBe(1);
  });
});
