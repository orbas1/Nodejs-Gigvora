import {
  listMobileApps,
  createMobileApp,
  updateMobileApp,
  createMobileAppVersion,
  updateMobileAppVersion,
  createMobileAppFeature,
  updateMobileAppFeature,
  deleteMobileAppFeature,
} from '../services/mobileAppService.js';

function parseBoolean(value) {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const text = `${value}`.trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'on'].includes(text);
}

export async function indexMobileApps(req, res) {
  const { includeInactive } = req.query ?? {};
  const result = await listMobileApps({ includeInactive: parseBoolean(includeInactive) });
  res.json(result);
}

export async function postMobileApp(req, res) {
  const app = await createMobileApp(req.body ?? {});
  res.status(201).json({ app });
}

export async function putMobileApp(req, res) {
  const appId = Number.parseInt(req.params.appId, 10);
  const app = await updateMobileApp(appId, req.body ?? {});
  res.json({ app });
}

export async function postMobileAppVersion(req, res) {
  const appId = Number.parseInt(req.params.appId, 10);
  const version = await createMobileAppVersion(appId, req.body ?? {});
  res.status(201).json({ version });
}

export async function putMobileAppVersion(req, res) {
  const appId = Number.parseInt(req.params.appId, 10);
  const versionId = Number.parseInt(req.params.versionId, 10);
  const version = await updateMobileAppVersion(appId, versionId, req.body ?? {});
  res.json({ version });
}

export async function postMobileAppFeature(req, res) {
  const appId = Number.parseInt(req.params.appId, 10);
  const feature = await createMobileAppFeature(appId, req.body ?? {});
  res.status(201).json({ feature });
}

export async function putMobileAppFeature(req, res) {
  const appId = Number.parseInt(req.params.appId, 10);
  const featureId = Number.parseInt(req.params.featureId, 10);
  const feature = await updateMobileAppFeature(appId, featureId, req.body ?? {});
  res.json({ feature });
}

export async function destroyMobileAppFeature(req, res) {
  const appId = Number.parseInt(req.params.appId, 10);
  const featureId = Number.parseInt(req.params.featureId, 10);
  await deleteMobileAppFeature(appId, featureId);
  res.status(204).end();
}

export default {
  indexMobileApps,
  postMobileApp,
  putMobileApp,
  postMobileAppVersion,
  putMobileAppVersion,
  postMobileAppFeature,
  putMobileAppFeature,
  destroyMobileAppFeature,
};
