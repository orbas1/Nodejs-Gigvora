import request from 'supertest';
import app from '../src/app.js';
import { __resetMentorshipState } from '../src/services/mentorshipService.js';

const mentorHeaders = {
  'x-workspace-roles': 'mentor',
  'x-user-id': '99',
};

describe('Mentorship routes', () => {
  beforeEach(() => {
    __resetMentorshipState();
  });

  it('rejects access without mentor role', async () => {
    const response = await request(app).get('/api/mentors/dashboard');
    expect(response.status).toBe(403);
    expect(response.body?.message).toMatch(/mentor access required/i);
  });

  it('returns a mentor dashboard snapshot', async () => {
    const response = await request(app).get('/api/mentors/dashboard').set(mentorHeaders);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      stats: expect.any(Object),
      conversion: expect.any(Array),
      availability: expect.any(Array),
      packages: expect.any(Array),
      bookings: expect.any(Array),
      finance: expect.any(Object),
      metadata: expect.any(Object),
    });
    expect(response.body.availability.length).toBeGreaterThan(0);
    expect(response.body.packages.length).toBeGreaterThan(0);
    expect(response.body.stats.activeMentees).toBeGreaterThanOrEqual(0);
    expect(response.body.metadata.lookbackDays).toBeGreaterThanOrEqual(7);
  });

  it('updates availability with validation', async () => {
    const slots = [
      {
        day: 'Monday',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        format: 'Office hours',
        capacity: 5,
      },
      {
        day: 'Wednesday',
        start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
        format: '1:1 session',
        capacity: 1,
      },
    ];

    const saveResponse = await request(app)
      .post('/api/mentors/availability')
      .set(mentorHeaders)
      .send({ slots });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.availability).toHaveLength(2);

    const dashboardResponse = await request(app).get('/api/mentors/dashboard').set(mentorHeaders);
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.availability).toHaveLength(2);
  });

  it('prevents overlapping availability', async () => {
    const now = Date.now();
    const slots = [
      {
        day: 'Tuesday',
        start: new Date(now + 4 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(now + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        format: 'Clinic',
        capacity: 3,
      },
      {
        day: 'Tuesday',
        start: new Date(now + 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        end: new Date(now + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        format: 'Clinic',
        capacity: 3,
      },
    ];

    const response = await request(app)
      .post('/api/mentors/availability')
      .set(mentorHeaders)
      .send({ slots });

    expect(response.status).toBe(422);
    expect(response.body.message).toMatch(/overlaps/i);
  });

  it('validates mentorship packages', async () => {
    const packages = [
      {
        name: 'Strategy intensive',
        description: 'Two focused sessions on positioning and pricing.',
        sessions: 2,
        price: 1500,
        currency: '£',
        format: 'Hybrid',
        outcome: 'Pricing experiments roadmap',
      },
    ];

    const saveResponse = await request(app)
      .post('/api/mentors/packages')
      .set(mentorHeaders)
      .send({ packages });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.packages).toHaveLength(1);

    const invalidResponse = await request(app)
      .post('/api/mentors/packages')
      .set(mentorHeaders)
      .send({ packages: [{ name: '', description: '', sessions: 0, price: -10 }] });

    expect(invalidResponse.status).toBe(422);
    expect(invalidResponse.body.message).toMatch(/package 1/i);
  });

  it('updates mentor profile details', async () => {
    const response = await request(app)
      .post('/api/mentors/profile')
      .set(mentorHeaders)
      .send({
        name: 'Jordan Patel',
        email: 'jordan.patel@gigvora.com',
        headline: 'Product strategy mentor & former CPO',
        timezone: 'GMT',
        expertise: ['Product strategy', 'Leadership coaching'],
        availabilityNotes: 'Monday and Wednesday afternoons for deep dives.',
        sessionFee: { amount: 220, currency: '£' },
      });

    expect(response.status).toBe(201);
    expect(response.body.profile).toMatchObject({
      name: 'Jordan Patel',
      email: 'jordan.patel@gigvora.com',
      timezone: 'GMT',
      sessionFee: expect.objectContaining({ amount: 220 }),
    });

    const dashboardResponse = await request(app).get('/api/mentors/dashboard').set(mentorHeaders);
    expect(dashboardResponse.body.profile.name).toBe('Jordan Patel');
  });

  it('creates, updates, and deletes mentorship bookings', async () => {
    const createResponse = await request(app)
      .post('/api/mentors/bookings')
      .set(mentorHeaders)
      .send({
        mentee: 'New Mentee',
        role: 'Senior Designer',
        package: 'Leadership accelerator',
        focus: 'Confidence in exec reviews',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Scheduled',
        price: 950,
        currency: '£',
        paymentStatus: 'Pending',
        channel: 'Explorer',
        segment: 'pending',
      });

    expect(createResponse.status).toBe(201);
    const createdBooking = createResponse.body.booking;
    expect(createdBooking).toMatchObject({ mentee: 'New Mentee', price: 950, status: 'Scheduled' });
    expect(createResponse.body.dashboard.bookings).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdBooking.id })]),
    );

    const updateResponse = await request(app)
      .put(`/api/mentors/bookings/${createdBooking.id}`)
      .set(mentorHeaders)
      .send({ paymentStatus: 'Paid', status: 'Completed' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.booking).toMatchObject({ paymentStatus: 'Paid', status: 'Completed' });

    const deleteResponse = await request(app)
      .delete(`/api/mentors/bookings/${createdBooking.id}`)
      .set(mentorHeaders);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.dashboard.bookings).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdBooking.id })]),
    );
  });

  it('manages finance invoices with validation', async () => {
    const createResponse = await request(app)
      .post('/api/mentors/finance/invoices')
      .set(mentorHeaders)
      .send({
        mentee: 'Corporate Labs',
        package: 'Leadership accelerator',
        amount: 3600,
        currency: '£',
        status: 'Sent',
        issuedOn: new Date().toISOString(),
        dueOn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Annual mentorship package invoice.',
      });

    expect(createResponse.status).toBe(201);
    const invoiceId = createResponse.body.invoice.id;
    expect(createResponse.body.dashboard.finance.summary.outstandingInvoices).toBeGreaterThan(0);

    const updateResponse = await request(app)
      .put(`/api/mentors/finance/invoices/${invoiceId}`)
      .set(mentorHeaders)
      .send({ status: 'Paid', paidOn: new Date().toISOString() });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.invoice.status).toBe('Paid');
    expect(updateResponse.body.dashboard.finance.summary.paidInvoices).toBeGreaterThan(0);

    const deleteResponse = await request(app)
      .delete(`/api/mentors/finance/invoices/${invoiceId}`)
      .set(mentorHeaders);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.dashboard.finance.invoices).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: invoiceId })]),
    );

    const invalidResponse = await request(app)
      .post('/api/mentors/finance/invoices')
      .set(mentorHeaders)
      .send({ mentee: '', amount: -10 });

    expect(invalidResponse.status).toBe(422);
  });

  it('manages finance payouts', async () => {
    const createResponse = await request(app)
      .post('/api/mentors/finance/payouts')
      .set(mentorHeaders)
      .send({
        amount: 1800,
        currency: '£',
        status: 'Processing',
        initiatedOn: new Date().toISOString(),
        expectedOn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        method: 'Stripe Express',
        destination: 'GB33-STER-1234',
      });

    expect(createResponse.status).toBe(201);
    const payoutId = createResponse.body.payout.id;

    const updateResponse = await request(app)
      .put(`/api/mentors/finance/payouts/${payoutId}`)
      .set(mentorHeaders)
      .send({ status: 'Paid', paidOn: new Date().toISOString() });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.payout.status).toBe('Paid');

    const deleteResponse = await request(app)
      .delete(`/api/mentors/finance/payouts/${payoutId}`)
      .set(mentorHeaders);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.dashboard.finance.payouts).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: payoutId })]),
    );
  });
});
