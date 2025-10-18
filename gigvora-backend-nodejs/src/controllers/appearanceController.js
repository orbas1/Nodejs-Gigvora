import {
  getAppearanceSummary,
  createTheme,
  updateTheme,
  setDefaultTheme,
  deleteTheme,
  createAsset,
  updateAsset,
  deleteAsset,
  createLayout,
  updateLayout,
  publishLayout,
  deleteLayout,
} from '../services/appearanceManagementService.js';

function getActorId(req) {
  return req?.user?.id ?? null;
}

export async function summary(req, res) {
  const snapshot = await getAppearanceSummary();
  res.json(snapshot);
}

export async function createThemeHandler(req, res) {
  const theme = await createTheme(req.body ?? {}, { actorId: getActorId(req) });
  res.status(201).json(theme);
}

export async function updateThemeHandler(req, res) {
  const { themeId } = req.params;
  const theme = await updateTheme(themeId, req.body ?? {}, { actorId: getActorId(req) });
  res.json(theme);
}

export async function setDefaultThemeHandler(req, res) {
  const { themeId } = req.params;
  const theme = await setDefaultTheme(themeId, { actorId: getActorId(req) });
  res.json(theme);
}

export async function deleteThemeHandler(req, res) {
  const { themeId } = req.params;
  const response = await deleteTheme(themeId);
  res.json(response);
}

export async function createAssetHandler(req, res) {
  const asset = await createAsset(req.body ?? {}, { actorId: getActorId(req) });
  res.status(201).json(asset);
}

export async function updateAssetHandler(req, res) {
  const { assetId } = req.params;
  const asset = await updateAsset(assetId, req.body ?? {}, { actorId: getActorId(req) });
  res.json(asset);
}

export async function deleteAssetHandler(req, res) {
  const { assetId } = req.params;
  const response = await deleteAsset(assetId);
  res.json(response);
}

export async function createLayoutHandler(req, res) {
  const layout = await createLayout(req.body ?? {}, { actorId: getActorId(req) });
  res.status(201).json(layout);
}

export async function updateLayoutHandler(req, res) {
  const { layoutId } = req.params;
  const layout = await updateLayout(layoutId, req.body ?? {}, { actorId: getActorId(req) });
  res.json(layout);
}

export async function publishLayoutHandler(req, res) {
  const { layoutId } = req.params;
  const layout = await publishLayout(layoutId, req.body ?? {}, { actorId: getActorId(req) });
  res.json(layout);
}

export async function deleteLayoutHandler(req, res) {
  const { layoutId } = req.params;
  const response = await deleteLayout(layoutId);
  res.json(response);
}

export default {
  summary,
  createTheme: createThemeHandler,
  updateTheme: updateThemeHandler,
  setDefaultTheme: setDefaultThemeHandler,
  deleteTheme: deleteThemeHandler,
  createAsset: createAssetHandler,
  updateAsset: updateAssetHandler,
  deleteAsset: deleteAssetHandler,
  createLayout: createLayoutHandler,
  updateLayout: updateLayoutHandler,
  publishLayout: publishLayoutHandler,
  deleteLayout: deleteLayoutHandler,
};
