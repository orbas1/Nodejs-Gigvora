import {
  listAgencies,
  getAgency,
  createAgency,
  updateAgency,
  archiveAgency,
} from '../services/adminAgencyManagementService.js';

function resolveActorId(req) {
  const candidate = req.user?.id ?? req.auth?.userId;
  if (candidate == null) {
    return null;
  }
  const parsed = Number.parseInt(`${candidate}`, 10);
  return Number.isFinite(parsed) ? parsed : candidate;
}

export async function index(req, res) {
  const payload = await listAgencies(req.query ?? {});
  res.json(payload);
}

export async function show(req, res) {
  const agency = await getAgency(req.params.agencyId);
  res.json(agency);
}

export async function store(req, res) {
  const actorId = resolveActorId(req);
  const agency = await createAgency(req.body ?? {}, { actorId });
  res.status(201).json(agency);
}

export async function update(req, res) {
  const agency = await updateAgency(req.params.agencyId, req.body ?? {});
  res.json(agency);
}

export async function destroy(req, res) {
  const actorId = resolveActorId(req);
  const agency = await archiveAgency(req.params.agencyId, { actorId });
  res.json(agency);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
};

