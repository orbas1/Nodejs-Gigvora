import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, sequelize } from '../models/index.js';
import { normalizeLocationPayload } from '../utils/location.js';
import twoFactorService from './twoFactorService.js';
import { resolveAccessTokenSecret, resolveRefreshTokenSecret } from '../utils/jwtSecrets.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';

async function register(data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await sequelize.transaction(async (trx) => {
    const locationPayload = normalizeLocationPayload({
      location: data.location ?? data.address,
      geoLocation: data.geoLocation,
    });
    const createdUser = await User.create(
      {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        location: locationPayload.location,
        geoLocation: locationPayload.geoLocation,
        age: data.age,
        userType: data.userType,
      },
      { transaction: trx },
    );

    return createdUser;
  });

  await twoFactorService.sendToken(user.email);

  return user;
}

async function login(email, password, options = {}) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  if (options.requireAdmin && user.userType !== 'admin') {
    throw Object.assign(new Error('Admin access required'), { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  await twoFactorService.sendToken(user.email);

  return { message: '2FA code sent to email' };
}

async function verifyTwoFactor(email, code) {
  const token = await twoFactorService.verifyToken(email, code);
  if (!token) {
    throw Object.assign(new Error('Invalid or expired code'), { status: 401 });
  }

  const user = await User.findOne({ where: { email } });
  const payload = { id: user.id, type: user.userType };
  const accessToken = jwt.sign(payload, resolveAccessTokenSecret(), { expiresIn: TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, resolveRefreshTokenSecret(), { expiresIn: '7d' });

  return { accessToken, refreshToken, user };
}

export default { register, login, verifyTwoFactor };
