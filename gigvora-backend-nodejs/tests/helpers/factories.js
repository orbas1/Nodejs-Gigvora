import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from '../../src/models/index.js';

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

export default {
  createUser,
};
