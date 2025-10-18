import * as identityVerificationService from '../services/adminIdentityVerificationService.js';

function resolveActorContext(req) {
  const actorId = req.user?.id ?? null;
  const actorRole = Array.isArray(req.user?.roles)
    ? req.user.roles.find((role) => typeof role === 'string') ?? 'admin'
    : req.user?.role ?? req.user?.userType ?? 'admin';
  return { actorId, actorRole: typeof actorRole === 'string' ? actorRole : 'admin' };
}

export async function overview(req, res) {
  const payload = await identityVerificationService.getIdentityVerificationOverview(req.query ?? {});
  res.json(payload);
}

export async function index(req, res) {
  const result = await identityVerificationService.listIdentityVerifications(req.query ?? {});
  res.json(result);
}

export async function show(req, res) {
  const { verificationId } = req.params ?? {};
  const record = await identityVerificationService.getIdentityVerificationById(verificationId);
  res.json(record);
}

export async function store(req, res) {
  const context = resolveActorContext(req);
  const record = await identityVerificationService.createIdentityVerification(req.body ?? {}, context);
  res.status(201).json(record);
}

export async function update(req, res) {
  const { verificationId } = req.params ?? {};
  const context = resolveActorContext(req);
  const record = await identityVerificationService.updateIdentityVerification(verificationId, req.body ?? {}, context);
  res.json(record);
}

export async function createEvent(req, res) {
  const { verificationId } = req.params ?? {};
  const context = resolveActorContext(req);
  const event = await identityVerificationService.createIdentityVerificationEvent(verificationId, req.body ?? {}, context);
  res.status(201).json(event);
}

export async function fetchSettings(req, res) {
  const settings = await identityVerificationService.getIdentityVerificationSettings();
  res.json(settings);
}

export async function updateSettings(req, res) {
  const settings = await identityVerificationService.updateIdentityVerificationSettings(req.body ?? {});
  res.json(settings);
}

export default {
  overview,
  index,
  show,
  store,
  update,
  createEvent,
  fetchSettings,
  updateSettings,
};
