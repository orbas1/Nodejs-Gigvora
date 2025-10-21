import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const adCouponServiceModuleUrl = new URL('../../src/services/adCouponService.js', import.meta.url);

const listCoupons = jest.fn().mockResolvedValue([{ id: 'coupon-1' }]);
const getCoupon = jest.fn().mockResolvedValue({ id: 'coupon-1' });
const createCoupon = jest.fn().mockResolvedValue({ id: 'coupon-2' });
const updateCoupon = jest.fn().mockResolvedValue({ id: 'coupon-3' });

jest.unstable_mockModule(adCouponServiceModuleUrl.pathname, () => ({
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
}));

const controllerModuleUrl = new URL('../../src/controllers/adCouponController.js', import.meta.url);
const { index, show, store, update } = await import(controllerModuleUrl.pathname);

describe('adCouponController', () => {
  beforeEach(() => {
    listCoupons.mockClear();
    getCoupon.mockClear();
    createCoupon.mockClear();
    updateCoupon.mockClear();
  });

  test('index forwards filters and include flag', async () => {
    const res = { json: jest.fn() };
    const req = {
      query: {
        status: 'active',
        surfaces: 'global_dashboard,agency_dashboard',
        includePlacements: 'false',
        now: '2023-11-20T10:00:00Z',
      },
    };

    await index(req, res);

    expect(listCoupons).toHaveBeenCalledWith({
      status: 'active',
      surfaces: 'global_dashboard,agency_dashboard',
      includePlacements: false,
      now: new Date('2023-11-20T10:00:00Z'),
    });
    expect(res.json).toHaveBeenCalledWith({ coupons: [{ id: 'coupon-1' }] });
  });

  test('show loads coupon with placement flag defaulting to true', async () => {
    const res = { json: jest.fn() };
    const req = { params: { couponId: 'coupon-1' }, query: {} };

    await show(req, res);

    expect(getCoupon).toHaveBeenCalledWith('coupon-1', { includePlacements: true });
    expect(res.json).toHaveBeenCalledWith({ id: 'coupon-1' });
  });

  test('store passes actor id and body payload', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { user: { id: 99 }, body: { code: 'GIG-50' } };

    await store(req, res);

    expect(createCoupon).toHaveBeenCalledWith({ code: 'GIG-50' }, { actorId: 99 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'coupon-2' });
  });

  test('update forwards actor context and payload', async () => {
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const req = { params: { couponId: 'coupon-3' }, user: { id: 'admin-1' }, body: { status: 'paused' } };

    await update(req, res);

    expect(updateCoupon).toHaveBeenCalledWith('coupon-3', { status: 'paused' }, { actorId: 'admin-1' });
  });
});
