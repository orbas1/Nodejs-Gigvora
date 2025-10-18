import {
  listIdentityVerifications,
  getIdentityVerification,
  createIdentityVerification,
  updateIdentityVerification,
} from '../services/companyIdentityVerificationService.js';

export async function index(req, res) {
  const result = await listIdentityVerifications(req.query);
  res.json(result);
}

export async function show(req, res) {
  const { verificationId } = req.params;
  const result = await getIdentityVerification(verificationId, req.query);
  res.json(result);
}

export async function store(req, res) {
  const record = await createIdentityVerification(req.body);
  res.status(201).json(record);
}

export async function update(req, res) {
  const { verificationId } = req.params;
  const record = await updateIdentityVerification(verificationId, req.body);
  res.json(record);
}

export default {
  index,
  show,
  store,
  update,
};
