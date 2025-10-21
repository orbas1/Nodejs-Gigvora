import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  archiveCompany,
} from '../services/adminCompanyManagementService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

export async function index(req, res) {
  const payload = await listCompanies(req.query ?? {});
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference }, 'Admin companies listed');
  res.json(payload);
}

export async function show(req, res) {
  const companyId = coercePositiveInteger(req.params.companyId, 'companyId');
  const company = await getCompany(companyId);
  res.json(company);
}

export async function store(req, res) {
  const actor = extractAdminActor(req);
  const company = await createCompany(req.body ?? {}, { actorId: actor.actorId ?? null });
  logger.info({ actor: actor.reference, companyId: company?.id }, 'Admin company created');
  res.status(201).json(company);
}

export async function update(req, res) {
  const companyId = coercePositiveInteger(req.params.companyId, 'companyId');
  const company = await updateCompany(companyId, req.body ?? {});
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, companyId }, 'Admin company updated');
  res.json(company);
}

export async function destroy(req, res) {
  const companyId = coercePositiveInteger(req.params.companyId, 'companyId');
  const actor = extractAdminActor(req);
  const company = await archiveCompany(companyId, { actorId: actor.actorId ?? null });
  logger.info({ actor: actor.reference, companyId }, 'Admin company archived');
  res.json(company);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
};

