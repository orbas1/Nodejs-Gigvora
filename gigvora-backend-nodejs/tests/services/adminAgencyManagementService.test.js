import { beforeAll, describe, expect, it } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';

let createAgency;
let listAgencies;
let updateAgency;
let archiveAgency;
let getAgency;
let AgencyProfile;
let User;

beforeAll(async () => {
  const service = await import('../../src/services/adminAgencyManagementService.js');
  createAgency = service.createAgency;
  listAgencies = service.listAgencies;
  updateAgency = service.updateAgency;
  archiveAgency = service.archiveAgency;
  getAgency = service.getAgency;

  const models = await import('../../src/models/adminManagementModels.js');
  AgencyProfile = models.AgencyProfile;
  User = models.User;
});

describe('adminAgencyManagementService', () => {
  it('creates agencies and surfaces summary metrics', async () => {
    const created = await createAgency({
      agencyName: 'Northern Lights Studio',
      focusArea: 'Creative campaigns',
      website: 'https://northern.example.com',
      location: 'Reykjavík, Iceland',
      tagline: 'Design with soul',
      services: ['Brand strategy', 'Motion graphics'],
      industries: ['Media'],
      clients: ['Aurora Group'],
      ownerEmail: 'studio.owner@example.com',
      ownerFirstName: 'Klara',
      ownerLastName: 'Sigurdardóttir',
      password: 'UltraSecurePassw0rd!',
    });

    expect(created.id).toBeTruthy();
    expect(created.owner.email).toBe('studio.owner@example.com');
    expect(created.services).toContain('Brand strategy');

    const list = await listAgencies();
    expect(list.items).toHaveLength(1);
    expect(list.summary.total).toBe(1);
    expect(list.summary.statuses.active).toBe(1);
    expect(list.summary.averageTeamSize).toBeNull();
  });

  it('updates agency profile and owner metadata', async () => {
    const agency = await createAgency({
      agencyName: 'Blueprint Ops',
      ownerEmail: 'ops@example.com',
      ownerFirstName: 'Mira',
      ownerLastName: 'Chen',
      password: 'AnotherSecurePass123!',
    });

    const updated = await updateAgency(agency.id, {
      agencyName: 'Blueprint Operations',
      status: 'suspended',
      followerPolicy: 'approval_required',
      teamSize: 42,
      ownerPhone: '+1 555 123 4567',
      primaryContactEmail: 'hello@blueprint.example.com',
      services: ['Automation'],
    });

    expect(updated.agencyName).toBe('Blueprint Operations');
    expect(updated.owner.status).toBe('suspended');
    expect(updated.followerPolicy).toBe('approval_required');
    expect(updated.teamSize).toBe(42);
    expect(updated.primaryContact.email).toBe('hello@blueprint.example.com');
    expect(updated.services).toEqual(['Automation']);

    const persisted = await getAgency(agency.id);
    expect(persisted.owner.phoneNumber).toBe('+1 555 123 4567');
  });

  it('archives agency and marks owner as archived', async () => {
    const agency = await createAgency({
      agencyName: 'Archive Labs',
      ownerEmail: 'archivist@example.com',
      ownerFirstName: 'Jonah',
      ownerLastName: 'Miles',
      password: 'SuperSecretArchive!',
    });

    const archived = await archiveAgency(agency.id);
    expect(archived.owner.status).toBe('archived');
    expect(archived.followerPolicy).toBe('closed');

    const owner = await User.findByPk(archived.owner.id);
    expect(owner.status).toBe('archived');
    const profile = await AgencyProfile.findByPk(archived.id);
    expect(profile.followerPolicy).toBe('closed');
  });
});

