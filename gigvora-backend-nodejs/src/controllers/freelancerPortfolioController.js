import freelancerPortfolioService from '../services/freelancerPortfolioService.js';

export async function listPortfolio(req, res) {
  const data = await freelancerPortfolioService.getPortfolio(req.params.userId, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(data);
}

export async function createPortfolioItem(req, res) {
  const item = await freelancerPortfolioService.createPortfolioItem(req.params.userId, req.body ?? {});
  res.status(201).json(item);
}

export async function updatePortfolioItem(req, res) {
  const item = await freelancerPortfolioService.updatePortfolioItem(
    req.params.userId,
    req.params.portfolioId,
    req.body ?? {},
  );
  res.json(item);
}

export async function deletePortfolioItem(req, res) {
  await freelancerPortfolioService.deletePortfolioItem(req.params.userId, req.params.portfolioId);
  res.status(204).send();
}

export async function createPortfolioAsset(req, res) {
  const asset = await freelancerPortfolioService.createPortfolioAsset(
    req.params.userId,
    req.params.portfolioId,
    req.body ?? {},
  );
  res.status(201).json(asset);
}

export async function updatePortfolioAsset(req, res) {
  const asset = await freelancerPortfolioService.updatePortfolioAsset(
    req.params.userId,
    req.params.portfolioId,
    req.params.assetId,
    req.body ?? {},
  );
  res.json(asset);
}

export async function deletePortfolioAsset(req, res) {
  await freelancerPortfolioService.deletePortfolioAsset(req.params.userId, req.params.portfolioId, req.params.assetId);
  res.status(204).send();
}

export async function updatePortfolioSettings(req, res) {
  const settings = await freelancerPortfolioService.updatePortfolioSettings(req.params.userId, req.body ?? {});
  res.json(settings);
}

export default {
  listPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  createPortfolioAsset,
  updatePortfolioAsset,
  deletePortfolioAsset,
  updatePortfolioSettings,
};
