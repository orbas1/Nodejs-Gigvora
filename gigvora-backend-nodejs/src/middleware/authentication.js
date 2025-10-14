import buildAuthenticate, { requireRoles as requireRolesFromAuthenticate } from './authenticate.js';

export function authenticateRequest(options = {}) {
  return buildAuthenticate(options);
}

export function authenticate(options = {}) {
  return buildAuthenticate(options);
}

export const requireRoles = requireRolesFromAuthenticate;

export default buildAuthenticate;
