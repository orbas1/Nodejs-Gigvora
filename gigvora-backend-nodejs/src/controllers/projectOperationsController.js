import {
  getProjectOperations,
  updateProjectOperations,
  addProjectTask,
  updateProjectTask,
  removeProjectTask,
} from '../services/projectOperationsService.js';

function parseNumber(value) {
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function show(req, res) {
  const { projectId } = req.params;
  const operations = await getProjectOperations(projectId);
  res.json(operations);
}

export async function upsert(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const operations = await updateProjectOperations(projectId, payload);
  res.json(operations);
}

export async function addTask(req, res) {
  const { projectId } = req.params;
  const payload = {
    ...req.body,
    progressPercent: parseNumber(req.body?.progressPercent),
    workloadHours: parseNumber(req.body?.workloadHours),
  };
  const operations = await addProjectTask(projectId, payload);
  res.status(201).json(operations);
}

export async function updateTask(req, res) {
  const { projectId, taskId } = req.params;
  const payload = {
    ...req.body,
    progressPercent: parseNumber(req.body?.progressPercent),
    workloadHours: parseNumber(req.body?.workloadHours),
  };
  const task = await updateProjectTask(projectId, taskId, payload);
  res.json(task);
}

export async function removeTask(req, res) {
  const { projectId, taskId } = req.params;
  const result = await removeProjectTask(projectId, taskId);
  res.json(result);
}

export default {
  show,
  upsert,
  addTask,
  updateTask,
  removeTask,
};
