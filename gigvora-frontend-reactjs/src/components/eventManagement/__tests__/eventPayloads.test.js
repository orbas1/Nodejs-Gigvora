import {
  buildEventPayload,
  buildTaskPayload,
  buildGuestPayload,
  buildBudgetPayload,
  buildAgendaPayload,
  buildAssetPayload,
  buildChecklistPayload,
} from '../eventPayloads.js';

vi.useFakeTimers().setSystemTime(new Date('2024-04-01T00:00:00Z'));

describe('eventPayloads', () => {
  it('normalises event values', () => {
    const payload = buildEventPayload({
      title: 'Launch',
      description: '',
      location: 'HQ',
      status: 'planned',
      format: 'virtual',
      visibility: 'invite_only',
      startAt: '2024-05-01T10:00',
      endAt: '',
      timezone: '',
      capacity: '200',
      registrationUrl: '',
    });

    expect(payload).toMatchObject({
      title: 'Launch',
      description: null,
      location: 'HQ',
      status: 'planned',
      format: 'virtual',
      visibility: 'invite_only',
      startAt: new Date('2024-05-01T10:00').toISOString(),
      endAt: null,
      timezone: expect.any(String),
      capacity: 200,
      registrationUrl: null,
    });
  });

  it('coerces related payload helpers', () => {
    expect(
      buildTaskPayload({
        title: 'Book venue',
        status: 'todo',
        priority: 'high',
        ownerName: '',
        dueAt: '2024-05-01T10:00',
        notes: '',
      }),
    ).toMatchObject({
      title: 'Book venue',
      status: 'todo',
      priority: 'high',
      ownerName: null,
      dueAt: new Date('2024-05-01T10:00').toISOString(),
      notes: null,
    });

    expect(
      buildGuestPayload({
        fullName: 'Ada Lovelace',
        email: '',
        company: 'Analytical Engines',
        role: '',
        ticketType: '',
        status: 'invited',
        seatsReserved: '3',
      }),
    ).toEqual({
      fullName: 'Ada Lovelace',
      email: null,
      company: 'Analytical Engines',
      role: null,
      ticketType: null,
      status: 'invited',
      seatsReserved: 3,
    });

    expect(
      buildBudgetPayload({
        category: 'Catering',
        vendorName: 'Taste Inc',
        description: '',
        amountPlanned: '1500',
        amountActual: '',
        currency: '',
        status: 'planned',
        notes: '',
      }),
    ).toEqual({
      category: 'Catering',
      vendorName: 'Taste Inc',
      description: null,
      amountPlanned: 1500,
      amountActual: null,
      currency: 'USD',
      status: 'planned',
      notes: null,
    });

    expect(
      buildAgendaPayload({
        title: 'Opening',
        description: '',
        startAt: '2024-05-01T10:00',
        endAt: '2024-05-01T10:30',
        ownerName: '',
      }),
    ).toEqual({
      title: 'Opening',
      description: null,
      startAt: new Date('2024-05-01T10:00').toISOString(),
      endAt: new Date('2024-05-01T10:30').toISOString(),
      ownerName: null,
    });

    expect(
      buildAssetPayload({
        name: 'Press kit',
        url: 'https://example.com',
        assetType: 'document',
        visibility: 'shared',
        thumbnailUrl: '',
      }),
    ).toEqual({
      name: 'Press kit',
      url: 'https://example.com',
      assetType: 'document',
      visibility: 'shared',
      thumbnailUrl: null,
    });

    expect(
      buildChecklistPayload({
        label: 'Send invites',
        ownerName: '',
        dueAt: '2024-05-01T10:00',
        isComplete: '',
      }),
    ).toEqual({
      label: 'Send invites',
      ownerName: null,
      dueAt: new Date('2024-05-01T10:00').toISOString(),
      isComplete: false,
    });
  });
});
