import {
  getCreationStudioOverview,
  getCreationStudioSnapshot,
  createCreationItem,
  updateCreationItem,
  deleteCreationItem,
} from '../services/agencyCreationStudioService.js';
import {
  buildAgencyActorContext,
  ensurePlainObject,
  mergeDefined,
  toOptionalPositiveInteger,
  toOptionalString,
  toPositiveInteger,
} from '../utils/controllerUtils.js';

function normaliseFilters(query = {}) {
  const agencyProfileId = toOptionalPositiveInteger(query.agencyProfileId, {
    fieldName: 'agencyProfileId',
    required: false,
  });
  const targetType = toOptionalString(query.targetType, { fieldName: 'targetType', maxLength: 80, lowercase: true });
  const status = toOptionalString(query.status, { fieldName: 'status', maxLength: 40, lowercase: true });
  const search = toOptionalString(query.search, { fieldName: 'search', maxLength: 200 });
  const page = toOptionalPositiveInteger(query.page, { fieldName: 'page', required: false });
  const pageSize = toOptionalPositiveInteger(query.pageSize, { fieldName: 'pageSize', required: false });
  return mergeDefined({}, { agencyProfileId, targetType, status, search, page, pageSize });
}

export async function overview(req, res) {
  const actor = buildAgencyActorContext(req);
  const params = normaliseFilters(req.query ?? {});
  const result = await getCreationStudioOverview(params, actor);
  res.json(result);
}

export async function snapshot(req, res) {
  const actor = buildAgencyActorContext(req);
  const params = normaliseFilters(req.query ?? {});
  const result = await getCreationStudioSnapshot(params, actor);
  res.json(result);
}

export async function store(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const result = await createCreationItem(payload, actor);
  res.status(201).json(result);
}

export async function update(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const itemId = toPositiveInteger(req.params?.itemId, { fieldName: 'itemId' });
  const result = await updateCreationItem(itemId, payload, actor);
  res.json(result);
}

export async function destroy(req, res) {
  const actor = buildAgencyActorContext(req);
  const itemId = toPositiveInteger(req.params?.itemId, { fieldName: 'itemId' });
  const result = await deleteCreationItem(itemId, actor);
  res.status(200).json(result);
}

export default {
  overview,
  snapshot,
  store,
  update,
  destroy,
};
