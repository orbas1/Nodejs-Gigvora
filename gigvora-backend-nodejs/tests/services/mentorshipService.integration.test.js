import { describe, beforeAll, afterAll, beforeEach, it, expect, jest } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';

let ValidationError;

let mentorshipService;
let sequelize;

beforeAll(async () => {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });

  const jsonType = DataTypes.JSON;

  const MentorProfile = sequelize.define(
    'MentorProfile',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      headline: { type: DataTypes.STRING },
      bio: { type: DataTypes.TEXT },
      discipline: { type: DataTypes.STRING },
      availabilityStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'open' },
      availabilityNotes: { type: DataTypes.TEXT },
      responseTimeHours: { type: DataTypes.INTEGER },
      testimonials: { type: jsonType },
      packages: { type: jsonType },
      rating: { type: DataTypes.DECIMAL(3, 2) },
      reviewCount: { type: DataTypes.INTEGER },
    },
    { tableName: 'mentor_profiles' },
  );

  const MentorAvailabilitySlot = sequelize.define(
    'MentorAvailabilitySlot',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      dayOfWeek: { type: DataTypes.STRING, allowNull: false },
      startTime: { type: DataTypes.DATE, allowNull: false },
      endTime: { type: DataTypes.DATE, allowNull: false },
      format: { type: DataTypes.STRING, allowNull: false },
      capacity: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'mentor_availability_slots' },
  );

  MentorAvailabilitySlot.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      day: plain.dayOfWeek,
      start: plain.startTime.toISOString(),
      end: plain.endTime.toISOString(),
      format: plain.format,
      capacity: plain.capacity,
    };
  };

  const MentorPackage = sequelize.define(
    'MentorPackage',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      sessions: { type: DataTypes.INTEGER, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      format: { type: DataTypes.STRING, allowNull: false },
      outcome: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: 'mentor_packages' },
  );

  MentorPackage.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      description: plain.description,
      sessions: plain.sessions,
      price: Number(plain.price),
      currency: plain.currency,
      format: plain.format,
      outcome: plain.outcome,
    };
  };

  const MentorBooking = sequelize.define(
    'MentorBooking',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      menteeName: { type: DataTypes.STRING, allowNull: false },
      menteeRole: { type: DataTypes.STRING },
      packageName: { type: DataTypes.STRING },
      focus: { type: DataTypes.STRING },
      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      paymentStatus: { type: DataTypes.STRING, allowNull: false },
      channel: { type: DataTypes.STRING, allowNull: false },
      segment: { type: DataTypes.STRING, allowNull: false },
      conferenceLink: { type: DataTypes.STRING },
      notes: { type: DataTypes.TEXT },
    },
    { tableName: 'mentor_bookings' },
  );

  MentorBooking.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      mentee: plain.menteeName,
      role: plain.menteeRole,
      package: plain.packageName,
      focus: plain.focus,
      scheduledAt: plain.scheduledAt.toISOString(),
      status: plain.status,
      price: Number(plain.price),
      currency: plain.currency,
      paymentStatus: plain.paymentStatus,
      channel: plain.channel,
      segment: plain.segment,
      conferenceLink: plain.conferenceLink ?? null,
      notes: plain.notes ?? undefined,
    };
  };

  const MentorClient = sequelize.define(
    'MentorClient',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      company: { type: DataTypes.STRING },
      role: { type: DataTypes.STRING },
      status: { type: DataTypes.STRING, allowNull: false },
      tier: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      channel: { type: DataTypes.STRING, allowNull: false },
      tags: { type: jsonType },
      notes: { type: DataTypes.TEXT },
      onboardedAt: { type: DataTypes.DATE },
      lastSessionAt: { type: DataTypes.DATE },
      nextSessionAt: { type: DataTypes.DATE },
    },
    { tableName: 'mentor_clients' },
  );

  MentorClient.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      company: plain.company,
      role: plain.role,
      status: plain.status,
      tier: plain.tier,
      value: Number(plain.value),
      currency: plain.currency,
      channel: plain.channel,
      tags: Array.isArray(plain.tags) ? plain.tags : [],
      notes: plain.notes ?? '',
      onboardedAt: plain.onboardedAt ? plain.onboardedAt.toISOString() : null,
      lastSessionAt: plain.lastSessionAt ? plain.lastSessionAt.toISOString() : null,
      nextSessionAt: plain.nextSessionAt ? plain.nextSessionAt.toISOString() : null,
    };
  };

  const MentorEvent = sequelize.define(
    'MentorEvent',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      clientId: { type: DataTypes.INTEGER },
      title: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      startsAt: { type: DataTypes.DATE, allowNull: false },
      endsAt: { type: DataTypes.DATE, allowNull: false },
      location: { type: DataTypes.STRING },
      notes: { type: DataTypes.TEXT },
    },
    { tableName: 'mentor_events' },
  );

  MentorEvent.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      title: plain.title,
      type: plain.type,
      status: plain.status,
      startsAt: plain.startsAt.toISOString(),
      endsAt: plain.endsAt.toISOString(),
      location: plain.location ?? null,
      notes: plain.notes ?? '',
      clientId: plain.clientId ?? null,
    };
  };

  const MentorSupportTicket = sequelize.define(
    'MentorSupportTicket',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      subject: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      priority: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      reference: { type: DataTypes.STRING },
      notes: { type: DataTypes.TEXT },
      submittedAt: { type: DataTypes.DATE, allowNull: false },
      respondedAt: { type: DataTypes.DATE },
    },
    { tableName: 'mentor_support_tickets' },
  );

  MentorSupportTicket.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      subject: plain.subject,
      category: plain.category,
      priority: plain.priority,
      status: plain.status,
      reference: plain.reference ?? null,
      notes: plain.notes ?? '',
      submittedAt: plain.submittedAt.toISOString(),
      updatedAt: plain.respondedAt ? plain.respondedAt.toISOString() : null,
    };
  };

  const MentorMessage = sequelize.define(
    'MentorMessage',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      senderName: { type: DataTypes.STRING, allowNull: false },
      channel: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      subject: { type: DataTypes.STRING },
      preview: { type: DataTypes.STRING },
      tags: { type: jsonType },
      receivedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'mentor_messages' },
  );

  MentorMessage.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      from: plain.senderName,
      channel: plain.channel,
      status: plain.status,
      subject: plain.subject ?? null,
      preview: plain.preview ?? '',
      tags: Array.isArray(plain.tags) ? plain.tags : [],
      receivedAt: plain.receivedAt.toISOString(),
    };
  };

  const MentorVerification = sequelize.define(
    'MentorVerification',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      status: { type: DataTypes.STRING, allowNull: false },
      lastSubmittedAt: { type: DataTypes.DATE },
      notes: { type: DataTypes.TEXT },
    },
    { tableName: 'mentor_verifications' },
  );

  MentorVerification.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      mentorId: plain.mentorId,
      status: plain.status,
      lastSubmittedAt: plain.lastSubmittedAt ? plain.lastSubmittedAt.toISOString() : null,
      notes: plain.notes ?? null,
    };
  };

  const MentorVerificationDocument = sequelize.define(
    'MentorVerificationDocument',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      reference: { type: DataTypes.STRING },
      notes: { type: DataTypes.TEXT },
      storageKey: { type: DataTypes.STRING },
      fileName: { type: DataTypes.STRING },
      contentType: { type: DataTypes.STRING },
      fileSize: { type: DataTypes.INTEGER },
      submittedAt: { type: DataTypes.DATE, allowNull: false },
      storedAt: { type: DataTypes.DATE },
    },
    { tableName: 'mentor_verification_documents' },
  );

  MentorVerificationDocument.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      type: plain.type,
      status: plain.status,
      reference: plain.reference ?? null,
      notes: plain.notes ?? '',
      storageKey: plain.storageKey ?? null,
      fileName: plain.fileName ?? null,
      contentType: plain.contentType ?? null,
      fileSize: plain.fileSize ?? null,
      submittedAt: plain.submittedAt.toISOString(),
      storedAt: plain.storedAt ? plain.storedAt.toISOString() : null,
    };
  };

  const MentorWalletTransaction = sequelize.define(
    'MentorWalletTransaction',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      occurredAt: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'mentor_wallet_transactions' },
  );

  MentorWalletTransaction.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      type: plain.type,
      status: plain.status,
      amount: Number(plain.amount),
      currency: plain.currency,
      reference: plain.reference,
      description: plain.description ?? '',
      occurredAt: plain.occurredAt.toISOString(),
    };
  };

  const MentorInvoice = sequelize.define(
    'MentorInvoice',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false },
      menteeName: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      issuedOn: { type: DataTypes.DATE, allowNull: false },
      dueOn: { type: DataTypes.DATE },
      notes: { type: DataTypes.TEXT },
    },
    { tableName: 'mentor_invoices' },
  );

  MentorInvoice.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      reference: plain.reference,
      mentee: plain.menteeName,
      amount: Number(plain.amount),
      currency: plain.currency,
      status: plain.status,
      issuedOn: plain.issuedOn.toISOString(),
      dueOn: plain.dueOn ? plain.dueOn.toISOString() : null,
      notes: plain.notes ?? '',
    };
  };

  const MentorPayout = sequelize.define(
    'MentorPayout',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      scheduledFor: { type: DataTypes.DATE, allowNull: false },
      processedAt: { type: DataTypes.DATE },
      failureReason: { type: DataTypes.STRING },
      notes: { type: DataTypes.TEXT },
    },
    { tableName: 'mentor_payouts' },
  );

  MentorPayout.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      reference: plain.reference,
      amount: Number(plain.amount),
      currency: plain.currency,
      status: plain.status,
      scheduledFor: plain.scheduledFor.toISOString(),
      processedAt: plain.processedAt ? plain.processedAt.toISOString() : null,
      failureReason: plain.failureReason ?? null,
      notes: plain.notes ?? '',
    };
  };

  const User = sequelize.define(
    'User',
    {
      firstName: { type: DataTypes.STRING },
      lastName: { type: DataTypes.STRING },
    },
    { tableName: 'users' },
  );

  const MentorReview = sequelize.define(
    'MentorReview',
    {
      mentorId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      headline: { type: DataTypes.STRING },
      feedback: { type: DataTypes.TEXT },
      publishedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'mentor_reviews' },
  );

  MentorReview.belongsTo(User, { as: 'reviewer', foreignKey: 'userId' });

  MentorReview.prototype.toPublicObject = function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      rating: plain.rating,
      headline: plain.headline ?? null,
      feedback: plain.feedback ?? null,
      publishedAt: plain.publishedAt.toISOString(),
    };
  };

  const MentorVerificationStatuses = ['Not started', 'In review', 'Action required', 'Approved'];

  jest.unstable_mockModule('../../src/models/index.js', () => ({
    sequelize,
    MentorProfile,
    MentorAvailabilitySlot,
    MentorPackage,
    MentorBooking,
    MentorClient,
    MentorEvent,
    MentorSupportTicket,
    MentorMessage,
    MentorVerification,
    MentorVerificationDocument,
    MentorWalletTransaction,
    MentorInvoice,
    MentorPayout,
    MentorReview,
    MENTOR_AVAILABILITY_DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    MENTOR_BOOKING_STATUSES: ['Scheduled', 'Awaiting pre-work', 'Completed', 'Cancelled', 'Rescheduled'],
    MENTOR_PAYMENT_STATUSES: ['Paid', 'Pending', 'Refunded', 'Overdue'],
    MENTOR_CLIENT_STATUSES: ['Active', 'Onboarding', 'Paused', 'Graduated', 'Churned'],
    MENTOR_RELATIONSHIP_TIERS: ['Flagship', 'Growth', 'Trial', 'Past'],
    MENTOR_EVENT_TYPES: ['Session', 'Office hours', 'Workshop', 'Cohort'],
    MENTOR_EVENT_STATUSES: ['Scheduled', 'Completed', 'Cancelled', 'Awaiting prep'],
    MENTOR_SUPPORT_PRIORITIES: ['Low', 'Normal', 'High', 'Urgent'],
    MENTOR_SUPPORT_STATUSES: ['Open', 'Awaiting mentor', 'Awaiting support', 'Resolved'],
    MENTOR_MESSAGE_CHANNELS: ['Explorer', 'Email', 'Slack Connect', 'WhatsApp'],
    MENTOR_MESSAGE_STATUSES: ['Unread', 'Read', 'Archived'],
    MENTOR_DOCUMENT_TYPES: ['Passport', 'National ID', 'Driving licence', 'Business certificate'],
    MENTOR_VERIFICATION_STATUSES: MentorVerificationStatuses,
    MENTOR_WALLET_TRANSACTION_TYPES: ['Payout', 'Mentorship earning', 'Adjustment'],
    MENTOR_WALLET_TRANSACTION_STATUSES: ['Pending', 'Completed', 'Failed', 'Processing'],
    MENTOR_INVOICE_STATUSES: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    MENTOR_PAYOUT_STATUSES: ['Scheduled', 'Processing', 'Paid', 'Failed'],
  }));

  mentorshipService = await import('../../src/services/mentorshipService.js');
  ({ ValidationError } = await import('../../src/utils/errors.js'));
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

const mentorId = 101;

async function seedMentorProfile() {
  await sequelize.models.MentorProfile.create({
    userId: mentorId,
    slug: 'mentor-demo',
    name: 'Integration Mentor',
    availabilityStatus: 'open',
    availabilityNotes: 'Demo availability',
  });
}

describe('mentorshipService integration', () => {
  it('persists mentorship operations and builds dashboard summary', async () => {
    await seedMentorProfile();

    await mentorshipService.updateMentorAvailability(mentorId, [
      {
        day: 'Tuesday',
        start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        format: '1:1 session',
        capacity: 1,
      },
    ]);

    await mentorshipService.updateMentorPackages(mentorId, [
      {
        name: 'Executive Sprint',
        description: 'Three session sprint focused on narrative and influence.',
        sessions: 3,
        price: 900,
        currency: 'GBP',
        format: 'Virtual',
        outcome: 'Board-ready narrative and coaching.',
      },
    ]);

    const booking = await mentorshipService.createMentorBooking(mentorId, {
      mentee: 'Jordan Client',
      role: 'Head of Product',
      package: 'Executive Sprint',
      focus: 'Storytelling',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'Scheduled',
      price: 900,
      currency: 'GBP',
      paymentStatus: 'Paid',
      channel: 'Explorer',
    });

    await mentorshipService.createMentorClient(mentorId, {
      name: 'Jordan Client',
      company: 'Northwind',
      status: 'Active',
      tier: 'Flagship',
      value: 900,
      currency: 'GBP',
      channel: 'Explorer',
      notes: 'Leading storytelling sprint.',
    });

    await mentorshipService.createMentorEvent(mentorId, {
      title: 'Storytelling workshop',
      type: 'Workshop',
      status: 'Scheduled',
      startsAt: booking.scheduledAt,
      endsAt: new Date(new Date(booking.scheduledAt).getTime() + 60 * 60 * 1000).toISOString(),
      location: 'Zoom',
    });

    await mentorshipService.createMentorSupportTicket(mentorId, {
      subject: 'Need invoice adjustment',
      priority: 'High',
      status: 'Open',
      submittedAt: new Date().toISOString(),
    });

    await mentorshipService.createMentorMessage(mentorId, {
      from: 'Jordan Client',
      channel: 'Email',
      status: 'Unread',
      subject: 'Prep material',
      receivedAt: new Date().toISOString(),
    });

    await mentorshipService.updateMentorVerificationStatus(mentorId, {
      status: 'In review',
      notes: 'Awaiting address verification.',
      lastSubmittedAt: new Date().toISOString(),
    });

    await mentorshipService.createMentorVerificationDocument(mentorId, {
      type: 'Passport',
      status: 'Approved',
      storageKey: 'identity/passport.pdf',
      submittedAt: new Date().toISOString(),
    });

    await mentorshipService.createMentorWalletTransaction(mentorId, {
      type: 'Mentorship earning',
      status: 'Completed',
      amount: 900,
      currency: 'GBP',
      reference: 'TXN-1',
      occurredAt: new Date().toISOString(),
    });

    await mentorshipService.createMentorInvoice(mentorId, {
      reference: 'INV-1',
      mentee: 'Northwind',
      amount: 900,
      currency: 'GBP',
      status: 'Sent',
      issuedOn: new Date().toISOString(),
    });

    await mentorshipService.createMentorPayout(mentorId, {
      reference: 'PAYOUT-1',
      amount: 450,
      currency: 'GBP',
      status: 'Scheduled',
      scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const dashboard = await mentorshipService.getMentorDashboard(mentorId, { lookbackDays: 30 });

    expect(dashboard.mentorId).toBe(mentorId);
    expect(dashboard.availability).toHaveLength(1);
    expect(dashboard.packages).toHaveLength(1);
    expect(dashboard.bookings).toHaveLength(1);
    expect(dashboard.clients).toHaveLength(1);
    expect(dashboard.calendar.events).toHaveLength(1);
    expect(dashboard.support.tickets).toHaveLength(1);
    expect(dashboard.inbox.messages).toHaveLength(1);
    expect(dashboard.verification.documents).toHaveLength(1);
    expect(dashboard.wallet.transactions).toHaveLength(1);
    expect(dashboard.invoices).toHaveLength(1);
    expect(dashboard.payouts).toHaveLength(1);
    expect(dashboard.stats.activeMentees).toBe(1);
    expect(dashboard.finance.recognisedRevenue).toBe(0);
    expect(dashboard.finance.outstandingInvoices).toBe(900);
    expect(dashboard.explorerPlacement).toMatchObject({ position: expect.any(String) });
  });

  it('rejects overlapping availability slots', async () => {
    await seedMentorProfile();

    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    await expect(
      mentorshipService.updateMentorAvailability(mentorId, [
        { day: 'Monday', start, end, format: '1:1 session', capacity: 1 },
        { day: 'Monday', start: new Date(Date.now() + 90 * 60 * 1000).toISOString(), end, format: 'Workshop', capacity: 5 },
      ]),
    ).rejects.toThrow(ValidationError);
  });

  it('validates booking pricing', async () => {
    await seedMentorProfile();

    await expect(
      mentorshipService.createMentorBooking(mentorId, {
        mentee: 'Invalid Price',
        role: 'Product Manager',
        package: 'Coaching',
        focus: 'Pricing check',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'Scheduled',
        price: -10,
        currency: 'GBP',
        paymentStatus: 'Pending',
        channel: 'Explorer',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('clears dependent mentor events when deleting a client', async () => {
    await seedMentorProfile();

    const client = await mentorshipService.createMentorClient(mentorId, {
      name: 'Cascade Client',
      company: 'Orbit Labs',
      status: 'Active',
      tier: 'Growth',
      value: 1200,
      currency: 'GBP',
      channel: 'Explorer',
    });

    const event = await mentorshipService.createMentorEvent(mentorId, {
      title: 'Cascade Workshop',
      type: 'Workshop',
      status: 'Scheduled',
      startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      clientId: client.id,
    });

    await mentorshipService.deleteMentorClient(mentorId, client.id);

    const persistedEvent = await sequelize.models.MentorEvent.findOne({ where: { id: event.id } });
    expect(persistedEvent).not.toBeNull();
    expect(persistedEvent.clientId).toBeNull();

    const dashboard = await mentorshipService.getMentorDashboard(mentorId, {});
    expect(dashboard.calendar.events[0].clientId).toBeNull();
  });
});
