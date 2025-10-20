import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  archiveCompany,
} from '../services/adminCompanyManagementService.js';

function resolveActorId(req) {
  const candidate = req.user?.id ?? req.auth?.userId;
  if (candidate == null) {
    return null;
  }
  const parsed = Number.parseInt(`${candidate}`, 10);
  return Number.isFinite(parsed) ? parsed : candidate;
}

export async function index(req, res) {
  const payload = await listCompanies(req.query ?? {});
  res.json(payload);
}

export async function show(req, res) {
  const company = await getCompany(req.params.companyId);
  res.json(company);
}

export async function store(req, res) {
  const actorId = resolveActorId(req);
  const company = await createCompany(req.body ?? {}, { actorId });
  res.status(201).json(company);
}

export async function update(req, res) {
  const company = await updateCompany(req.params.companyId, req.body ?? {});
  res.json(company);
}

export async function destroy(req, res) {
  const actorId = resolveActorId(req);
  const company = await archiveCompany(req.params.companyId, { actorId });
  res.json(company);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
};

