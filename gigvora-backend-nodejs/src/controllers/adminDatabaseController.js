import {
  listDatabaseConnections,
  getDatabaseConnection,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
} from '../services/databaseSettingsService.js';
import logger from '../utils/logger.js';
import { extractAdminActor } from '../utils/adminRequestContext.js';

export async function index(req, res) {
  const actor = extractAdminActor(req);
  const result = await listDatabaseConnections(req.query ?? {});
  logger.info({ actor: actor.reference }, 'Admin database connections listed');
  res.json(result);
}

export async function show(req, res) {
  const { connectionId } = req.params;
  const includeSecret = Boolean(req.query?.includeSecret);
  const actor = extractAdminActor(req);
  const connection = await getDatabaseConnection(Number(connectionId), { includeSecret });
  logger.info({ actor: actor.reference, connectionId: Number(connectionId) }, 'Admin database connection fetched');
  res.json(connection);
}

export async function store(req, res) {
  const actor = extractAdminActor(req);
  const connection = await createDatabaseConnection(req.body ?? {}, { actor: actor.reference });
  logger.info({ actor: actor.reference, connectionId: connection?.id }, 'Admin database connection created');
  res.status(201).json(connection);
}

export async function update(req, res) {
  const actor = extractAdminActor(req);
  const { connectionId } = req.params;
  const connection = await updateDatabaseConnection(Number(connectionId), req.body ?? {}, { actor: actor.reference });
  logger.info({ actor: actor.reference, connectionId: Number(connectionId) }, 'Admin database connection updated');
  res.json(connection);
}

export async function destroy(req, res) {
  const actor = extractAdminActor(req);
  const { connectionId } = req.params;
  await deleteDatabaseConnection(Number(connectionId), { actor: actor.reference });
  logger.info({ actor: actor.reference, connectionId: Number(connectionId) }, 'Admin database connection deleted');
  res.status(204).end();
}

export async function test(req, res) {
  const actor = extractAdminActor(req);
  const result = await testDatabaseConnection(req.body ?? {}, { actor: actor.reference });
  logger.info({ actor: actor.reference }, 'Admin database connection test executed');
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
