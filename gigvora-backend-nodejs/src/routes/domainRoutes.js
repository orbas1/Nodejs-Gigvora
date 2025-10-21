import { Router } from 'express';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import domainIntrospectionService from '../services/domainIntrospectionService.js';

const router = Router();
const DOMAIN_ROLES = ['admin', 'developer', 'platform_ops'];

router.use(authenticateRequest());
router.use(requireRoles(...DOMAIN_ROLES));

router.get('/registry', (req, res, next) => {
  try {
    const registry = domainIntrospectionService.listContexts();
    res.json({ contexts: registry, generatedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

router.get('/governance', async (req, res, next) => {
  try {
    const contexts = await domainIntrospectionService.listGovernanceSummaries();
    res.json({ contexts, generatedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

router.get('/:contextName/governance', async (req, res, next) => {
  try {
    const detail = await domainIntrospectionService.getContextGovernance(req.params.contextName);
    res.json(detail);
  } catch (error) {
    next(error);
  }
});

router.get('/:contextName/models/:modelName', (req, res, next) => {
  try {
    const model = domainIntrospectionService.getModelDetail(req.params.contextName, req.params.modelName);
    res.json(model);
  } catch (error) {
    next(error);
  }
});

router.get('/:contextName', (req, res, next) => {
  try {
    const detail = domainIntrospectionService.getContextDetail(req.params.contextName);
    res.json(detail);
  } catch (error) {
    next(error);
  }
});

export default router;
