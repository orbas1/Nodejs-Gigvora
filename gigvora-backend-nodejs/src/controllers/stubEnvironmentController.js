import { getStubEnvironmentCatalog } from '../services/stubEnvironmentService.js';

export async function listStubEnvironments(request, response, next) {
  try {
    const catalog = await getStubEnvironmentCatalog({ includeHealth: true });
    response.json(catalog);
  } catch (error) {
    next(error);
  }
}

export default {
  listStubEnvironments,
};
