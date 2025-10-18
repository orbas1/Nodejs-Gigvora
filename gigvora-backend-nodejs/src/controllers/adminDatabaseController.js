import {
  listDatabaseConnections,
  getDatabaseConnection,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
} from '../services/databaseSettingsService.js';

function resolveActor(req) {
  if (req?.user?.id != null) {
    return `user:${req.user.id}`;
  }
  return req?.user?.type ? `role:${req.user.type}` : 'system';
}

export async function index(req, res) {
  const result = await listDatabaseConnections(req.query ?? {});
  res.json(result);
}

export async function show(req, res) {
  const { connectionId } = req.params;
  const includeSecret = Boolean(req.query?.includeSecret);
  const connection = await getDatabaseConnection(Number(connectionId), { includeSecret });
  res.json(connection);
}

export async function store(req, res) {
  const actor = resolveActor(req);
  const connection = await createDatabaseConnection(req.body ?? {}, { actor });
  res.status(201).json(connection);
}

export async function update(req, res) {
  const actor = resolveActor(req);
  const { connectionId } = req.params;
  const connection = await updateDatabaseConnection(Number(connectionId), req.body ?? {}, { actor });
  res.json(connection);
}

export async function destroy(req, res) {
  const actor = resolveActor(req);
  const { connectionId } = req.params;
  await deleteDatabaseConnection(Number(connectionId), { actor });
  res.status(204).end();
}

export async function test(req, res) {
  const actor = resolveActor(req);
  const result = await testDatabaseConnection(req.body ?? {}, { actor });
  res.json(result);
}

export default {
  index,
  show,
  store,
  update,
  destroy,
  test,
};
