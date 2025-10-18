import userMentoringService from '../services/userMentoringService.js';

function resolveUserId(req) {
  return req.params.userId ?? req.params.id;
}

export async function getMentoringDashboard(req, res) {
  const userId = resolveUserId(req);
  const dashboard = await userMentoringService.getMentoringDashboard(userId, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(dashboard);
}

export async function createMentoringSession(req, res) {
  const userId = resolveUserId(req);
  const session = await userMentoringService.createMentoringSession(userId, req.body ?? {});
  res.status(201).json(session);
}

export async function updateMentoringSession(req, res) {
  const userId = resolveUserId(req);
  const session = await userMentoringService.updateMentoringSession(userId, req.params.sessionId, req.body ?? {});
  res.json(session);
}

export async function recordMentorshipPurchase(req, res) {
  const userId = resolveUserId(req);
  const order = await userMentoringService.recordMentorshipPurchase(userId, req.body ?? {});
  res.status(201).json(order);
}

export async function updateMentorshipPurchase(req, res) {
  const userId = resolveUserId(req);
  const order = await userMentoringService.updateMentorshipPurchase(userId, req.params.orderId, req.body ?? {});
  res.json(order);
}

export async function addFavouriteMentor(req, res) {
  const userId = resolveUserId(req);
  const favourite = await userMentoringService.addFavouriteMentor(userId, req.body ?? {});
  res.status(201).json(favourite);
}

export async function removeFavouriteMentor(req, res) {
  const userId = resolveUserId(req);
  const response = await userMentoringService.removeFavouriteMentor(userId, Number(req.params.mentorId));
  res.json(response);
}

export async function submitMentorReview(req, res) {
  const userId = resolveUserId(req);
  const review = await userMentoringService.submitMentorReview(userId, req.body ?? {});
  res.status(201).json(review);
}

export default {
  getMentoringDashboard,
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  submitMentorReview,
};
