import { Router } from 'express';
import domainIntrospectionService from '../services/domainIntrospectionService.js';

const router = Router();

router.get('/registry', (req, res, next) => {
  try {
    const registry = domainIntrospectionService.listContexts();
    res.json({ contexts: registry, generatedAt: new Date().toISOString() });
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

router.get('/:contextName/models/:modelName', (req, res, next) => {
  try {
    const model = domainIntrospectionService.getModelDetail(req.params.contextName, req.params.modelName);
    res.json(model);
  } catch (error) {
    next(error);
  }
});

export default router;
