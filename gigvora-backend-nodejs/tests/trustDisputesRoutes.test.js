process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/index.js';
import './setupTestEnv.js';

describe('Trust dispute routes', () => {
  it('supports full dispute lifecycle', async () => {
    const customer = await User.create({ email: 'customer@gigvora.test', firstName: 'Case', lastName: 'Customer' });
    const provider = await User.create({ email: 'provider@gigvora.test', firstName: 'Case', lastName: 'Provider' });

    const accountResponse = await request(app)
      .post('/api/trust/escrow/accounts')
      .send({ userId: provider.id, provider: 'escrow_com', currencyCode: 'USD' });
    expect(accountResponse.status).toBe(201);
    const accountId = accountResponse.body.account.id;

    const transactionResponse = await request(app)
      .post('/api/trust/escrow/transactions')
      .send({
        accountId,
        reference: 'TX-1001',
        amount: 500,
        currencyCode: 'USD',
        initiatedById: customer.id,
        counterpartyId: provider.id,
        type: 'project',
      });
    expect(transactionResponse.status).toBe(201);
    const transactionId = transactionResponse.body.transaction.id;

    const disputeCreate = await request(app)
      .post('/api/trust/disputes')
      .send({
        escrowTransactionId: transactionId,
        openedById: customer.id,
        assignedToId: provider.id,
        priority: 'high',
        reasonCode: 'payment_issue',
        summary: 'Payment not released',
      });
    expect(disputeCreate.status).toBe(201);
    const disputeId = disputeCreate.body.dispute.id;

    const disputeDetail = await request(app).get(`/api/trust/disputes/${disputeId}`);
    expect(disputeDetail.status).toBe(200);
    expect(disputeDetail.body.dispute.id).toBe(disputeId);

    const eventResponse = await request(app)
      .post(`/api/trust/disputes/${disputeId}/events`)
      .send({ actionType: 'comment', actorId: provider.id, notes: 'Provider responded with evidence.' });
    expect(eventResponse.status).toBe(201);

    const updateResponse = await request(app)
      .patch(`/api/trust/disputes/${disputeId}`)
      .send({ status: 'under_review', resolutionNotes: 'Escrow investigating.' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.dispute.status).toBe('under_review');
  });
});
