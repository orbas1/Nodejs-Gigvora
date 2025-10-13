import { CompanyProfile, AgencyProfile } from '../models/index.js';
import { normalizeLocationPayload } from '../utils/location.js';
import authService from '../services/authService.js';

export async function registerUser(req, res) {
  const user = await authService.register({ ...req.body, userType: 'user' });
  res.status(201).json(user);
}

export async function registerCompany(req, res) {
  const user = await authService.register({ ...req.body, userType: 'company' });
  const locationPayload = normalizeLocationPayload({
    location: req.body.location,
    geoLocation: req.body.geoLocation,
  });
  await CompanyProfile.create({
    userId: user.id,
    companyName: req.body.companyName,
    description: req.body.description || '',
    website: req.body.website || '',
    location: locationPayload.location,
    geoLocation: locationPayload.geoLocation,
  });
  res.status(201).json(user);
}

export async function registerAgency(req, res) {
  const user = await authService.register({ ...req.body, userType: 'agency' });
  const locationPayload = normalizeLocationPayload({
    location: req.body.location,
    geoLocation: req.body.geoLocation,
  });
  await AgencyProfile.create({
    userId: user.id,
    agencyName: req.body.agencyName,
    focusArea: req.body.focusArea || '',
    website: req.body.website || '',
    location: locationPayload.location,
    geoLocation: locationPayload.geoLocation,
  });
  res.status(201).json(user);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const response = await authService.login(email, password);
  res.json(response);
}

export async function adminLogin(req, res) {
  const { email, password } = req.body;
  const response = await authService.login(email, password, { requireAdmin: true });
  res.json(response);
}

export async function verifyTwoFactor(req, res) {
  const { email, code } = req.body;
  const response = await authService.verifyTwoFactor(email, code);
  res.json(response);
}
