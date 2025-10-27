import { resolvePlatformContinuityBootstrap } from '../services/platformContinuityService.js';

export async function bootstrap(req, res) {
  const { includeRoutes, includeComponents, mode, accent, density } = req.query ?? {};

  const { bootstrap, metadata } = resolvePlatformContinuityBootstrap({
    actor: req.user ?? null,
    includeRoutes,
    includeComponents,
    themeOverrides: { mode, accent, density },
  });

  res.json({ bootstrap, metadata });
}

export default {
  bootstrap,
};
