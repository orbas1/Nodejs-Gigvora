import {
  listContentSubmissions,
  getSubmission,
  updateSubmissionStatus,
  assignSubmission,
  recordModerationAction,
  listModerationActions,
} from '../services/contentGovernanceService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function resolveActor(req) {
  const actorId = resolveRequestUserId(req);
  return actorId ? { actorId } : {};
}

export async function queue(req, res) {
  const result = await listContentSubmissions(req.query ?? {});
  res.json(result);
}

export async function show(req, res) {
  const submission = await getSubmission(Number.parseInt(req.params.submissionId, 10));
  res.json(submission);
}

export async function update(req, res) {
  const submission = await updateSubmissionStatus(
    Number.parseInt(req.params.submissionId, 10),
    req.body ?? {},
    resolveActor(req),
  );
  res.json(submission);
}

export async function assign(req, res) {
  const submission = await assignSubmission(
    Number.parseInt(req.params.submissionId, 10),
    req.body ?? {},
    resolveActor(req),
  );
  res.json(submission);
}

export async function createAction(req, res) {
  const { submission, action } = await recordModerationAction(
    Number.parseInt(req.params.submissionId, 10),
    req.body ?? {},
    resolveActor(req),
  );
  res.status(201).json({ submission, action });
}

export async function actions(req, res) {
  const actions = await listModerationActions(Number.parseInt(req.params.submissionId, 10));
  res.json({ actions });
}

export default {
  queue,
  show,
  update,
  assign,
  createAction,
  actions,
};
