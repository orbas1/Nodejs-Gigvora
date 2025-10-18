import * as userNetworkingService from '../services/userNetworkingService.js';

export async function getOverview(req, res) {
  const overview = await userNetworkingService.getOverview(req.params.id);
  res.json(overview);
}

export async function listBookings(req, res) {
  const { limit } = req.query;
  const bookings = await userNetworkingService.listBookings(req.params.id, { limit });
  res.json({ data: bookings });
}

export async function createBooking(req, res) {
  const booking = await userNetworkingService.createBooking(req.params.id, req.body ?? {});
  res.status(201).json(booking);
}

export async function updateBooking(req, res) {
  const booking = await userNetworkingService.updateBooking(req.params.id, req.params.bookingId, req.body ?? {});
  res.json(booking);
}

export async function listPurchases(req, res) {
  const { limit } = req.query;
  const purchases = await userNetworkingService.listPurchases(req.params.id, { limit });
  res.json({ data: purchases });
}

export async function createPurchase(req, res) {
  const purchase = await userNetworkingService.createPurchase(req.params.id, req.body ?? {});
  res.status(201).json(purchase);
}

export async function updatePurchase(req, res) {
  const purchase = await userNetworkingService.updatePurchase(req.params.id, req.params.orderId, req.body ?? {});
  res.json(purchase);
}

export async function listConnections(req, res) {
  const { limit } = req.query;
  const connections = await userNetworkingService.listConnections(req.params.id, { limit });
  res.json({ data: connections });
}

export async function createConnection(req, res) {
  const connection = await userNetworkingService.createConnection(req.params.id, req.body ?? {});
  res.status(201).json(connection);
}

export async function updateConnection(req, res) {
  const connection = await userNetworkingService.updateConnection(
    req.params.id,
    req.params.connectionId,
    req.body ?? {},
  );
  res.json(connection);
}

export default {
  getOverview,
  listBookings,
  createBooking,
  updateBooking,
  listPurchases,
  createPurchase,
  updatePurchase,
  listConnections,
  createConnection,
  updateConnection,
};
