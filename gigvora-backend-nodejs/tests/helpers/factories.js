import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User, ProviderWorkspace, FreelancerProfile } from '../../src/models/index.js';

export async function createUser(overrides = {}) {
  const rawPassword = overrides.password ?? 'Password123!';
  const hashedPassword = overrides.hashedPassword ?? (await bcrypt.hash(rawPassword, 10));

  return User.create({
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    email: overrides.email ?? `user+${crypto.randomUUID()}@example.com`,
    password: hashedPassword,
    address: overrides.address ?? null,
    age: overrides.age ?? 30,
    userType: overrides.userType ?? 'user',
  });
}

export async function createProviderWorkspace(overrides = {}) {
  const owner =
    overrides.owner ?? (overrides.ownerId ? null : await createUser({ userType: 'agency' }));
  const ownerId = overrides.ownerId ?? owner?.id;
  if (!ownerId) {
    throw new Error('ownerId is required to create a provider workspace.');
  }

  return ProviderWorkspace.create({
    ownerId,
    name: overrides.name ?? `Agency ${crypto.randomUUID().slice(0, 8)}`,
    slug: overrides.slug ?? `agency-${crypto.randomUUID()}`,
    type: overrides.type ?? 'agency',
    timezone: overrides.timezone ?? 'UTC',
    defaultCurrency: overrides.defaultCurrency ?? 'USD',
    intakeEmail: overrides.intakeEmail ?? null,
    isActive: overrides.isActive ?? true,
    settings: overrides.settings ?? null,
  });
}

export async function createFreelancerProfile(overrides = {}) {
  const freelancer =
    overrides.user ?? (overrides.userId ? null : await createUser({ userType: 'freelancer' }));
  const userId = overrides.userId ?? freelancer?.id;

  if (!userId) {
    throw new Error('userId is required to create a freelancer profile.');
  }

  return FreelancerProfile.create({
    userId,
    title: overrides.title ?? 'Independent specialist',
    hourlyRate: overrides.hourlyRate ?? 150,
    availability: overrides.availability ?? 'available',
  });
}

export default {
  createUser,
  createProviderWorkspace,
  createFreelancerProfile,
};
