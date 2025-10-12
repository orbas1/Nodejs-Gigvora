import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const AUTH_HEADER_PREFIX = 'bearer';

export default async function authenticate(req, res, next) {
  try {
    const header = req.headers?.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const [scheme, token] = header.split(' ');
    if (!token || scheme?.toLowerCase() !== AUTH_HEADER_PREFIX) {
      return res.status(401).json({ message: 'Invalid authorization header.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User session could not be verified.' });
    }

    req.user = { id: user.id, type: user.userType };
    return next();
  } catch (error) {
    return next(error);
  }
}
