import * as adminProfileService from '../services/adminProfileService.js';

export async function listProfiles(req, res) {
  const payload = await adminProfileService.listProfiles(req.query ?? {});
  res.json(payload);
}

export async function getProfile(req, res) {
  const payload = await adminProfileService.getProfile(req.params.profileId);
  res.json(payload);
}

export async function createProfile(req, res) {
  const payload = await adminProfileService.createProfile(req.body ?? {}, req.user ?? {});
  res.status(201).json(payload);
}

export async function updateProfile(req, res) {
  const payload = await adminProfileService.updateProfile(
    req.params.profileId,
    req.body ?? {},
    req.user ?? {},
  );
  res.json(payload);
}

export async function createReference(req, res) {
  const payload = await adminProfileService.createReference(
    req.params.profileId,
    req.body ?? {},
    req.user ?? {},
  );
  res.status(201).json(payload);
}

export async function updateReference(req, res) {
  const payload = await adminProfileService.updateReference(
    req.params.profileId,
    req.params.referenceId,
    req.body ?? {},
    req.user ?? {},
  );
  res.json(payload);
}

export async function deleteReference(req, res) {
  const payload = await adminProfileService.deleteReference(
    req.params.profileId,
    req.params.referenceId,
  );
  res.json(payload);
}

export async function createNote(req, res) {
  const payload = await adminProfileService.createNote(
    req.params.profileId,
    req.body ?? {},
    req.user ?? {},
  );
  res.status(201).json(payload);
}

export async function updateNote(req, res) {
  const payload = await adminProfileService.updateNote(
    req.params.profileId,
    req.params.noteId,
    req.body ?? {},
    req.user ?? {},
  );
  res.json(payload);
}

export async function deleteNote(req, res) {
  const payload = await adminProfileService.deleteNote(req.params.profileId, req.params.noteId);
  res.json(payload);
}

export default {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  createReference,
  updateReference,
  deleteReference,
  createNote,
  updateNote,
  deleteNote,
};
