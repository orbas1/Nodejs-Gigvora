import * as volunteeringService from '../services/adminVolunteeringService.js';

export async function insights(req, res) {
  const snapshot = await volunteeringService.getVolunteeringInsights();
  res.json(snapshot);
}

export async function listPrograms(req, res) {
  const result = await volunteeringService.listPrograms(req.query);
  res.json(result);
}

export async function createProgram(req, res) {
  const program = await volunteeringService.createProgram(req.body);
  res.status(201).json(program);
}

export async function getProgram(req, res) {
  const program = await volunteeringService.getProgram(Number(req.params.programId));
  res.json(program);
}

export async function updateProgram(req, res) {
  const program = await volunteeringService.updateProgram(Number(req.params.programId), req.body);
  res.json(program);
}

export async function deleteProgram(req, res) {
  await volunteeringService.deleteProgram(Number(req.params.programId));
  res.status(204).send();
}

export async function listRoles(req, res) {
  const result = await volunteeringService.listRoles(req.query);
  res.json(result);
}

export async function getRole(req, res) {
  const role = await volunteeringService.getRole(Number(req.params.roleId));
  res.json(role);
}

export async function createRole(req, res) {
  const role = await volunteeringService.createRole(req.body);
  res.status(201).json(role);
}

export async function updateRole(req, res) {
  const role = await volunteeringService.updateRole(Number(req.params.roleId), req.body);
  res.json(role);
}

export async function deleteRole(req, res) {
  await volunteeringService.deleteRole(Number(req.params.roleId));
  res.status(204).send();
}

export async function publishRole(req, res) {
  const role = await volunteeringService.publishRole(Number(req.params.roleId));
  res.json(role);
}

export async function listShifts(req, res) {
  const shifts = await volunteeringService.listShifts(Number(req.params.roleId), req.query);
  res.json(shifts);
}

export async function createShift(req, res) {
  const shift = await volunteeringService.createShift(Number(req.params.roleId), req.body);
  res.status(201).json(shift);
}

export async function updateShift(req, res) {
  const shift = await volunteeringService.updateShift(Number(req.params.roleId), Number(req.params.shiftId), req.body);
  res.json(shift);
}

export async function deleteShift(req, res) {
  await volunteeringService.deleteShift(Number(req.params.roleId), Number(req.params.shiftId));
  res.status(204).send();
}

export async function listAssignments(req, res) {
  const assignments = await volunteeringService.listAssignments(Number(req.params.shiftId));
  res.json(assignments);
}

export async function createAssignment(req, res) {
  const assignment = await volunteeringService.createAssignment(Number(req.params.shiftId), req.body);
  res.status(201).json(assignment);
}

export async function updateAssignment(req, res) {
  const assignment = await volunteeringService.updateAssignment(
    Number(req.params.shiftId),
    Number(req.params.assignmentId),
    req.body,
  );
  res.json(assignment);
}

export async function deleteAssignment(req, res) {
  await volunteeringService.deleteAssignment(Number(req.params.shiftId), Number(req.params.assignmentId));
  res.status(204).send();
}
