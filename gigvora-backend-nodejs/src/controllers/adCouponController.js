import { listCoupons, createCoupon, updateCoupon, getCoupon } from '../services/adCouponService.js';

function parseBoolean(value, defaultValue = true) {
  if (value == null) {
    return defaultValue;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

function parseDate(value) {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

export async function index(req, res) {
  const { status, surfaces, includePlacements } = req.query ?? {};
  const include = parseBoolean(includePlacements, true);
  const now = parseDate(req.query?.now);
  const coupons = await listCoupons({ status, surfaces, includePlacements: include, now });
  res.json({ coupons });
}

export async function show(req, res) {
  const { couponId } = req.params;
  const includePlacements = parseBoolean(req.query?.includePlacements, true);
  const coupon = await getCoupon(couponId, { includePlacements });
  res.json(coupon);
}

export async function store(req, res) {
  const actorId = req.user?.id ?? null;
  const coupon = await createCoupon(req.body ?? {}, { actorId });
  res.status(201).json(coupon);
}

export async function update(req, res) {
  const { couponId } = req.params;
  const actorId = req.user?.id ?? null;
  const coupon = await updateCoupon(couponId, req.body ?? {}, { actorId });
  res.json(coupon);
}

export default {
  index,
  show,
  store,
  update,
};
