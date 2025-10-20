import { describe, expect, it } from '@jest/globals';
import {
  createCompany,
  listCompanies,
  updateCompany,
  archiveCompany,
  getCompany,
} from '../../src/services/adminCompanyManagementService.js';
import { User } from '../../src/models/index.js';

describe('adminCompanyManagementService', () => {
  it('creates companies and reports summary insights', async () => {
    const created = await createCompany({
      companyName: 'Skyline Robotics',
      description: 'Autonomous facade maintenance robots.',
      website: 'https://skyline.example.com',
      location: 'Toronto, Canada',
      tagline: 'Safer cities through automation.',
      ownerEmail: 'founder@skyline.example.com',
      ownerFirstName: 'Elena',
      ownerLastName: 'Park',
      password: 'SkylineSecurePass123!',
    });

    expect(created.companyName).toBe('Skyline Robotics');
    expect(created.owner.email).toBe('founder@skyline.example.com');

    const listing = await listCompanies();
    expect(listing.items).toHaveLength(1);
    expect(listing.summary.total).toBe(1);
    expect(listing.summary.withWebsite).toBe(1);
  });

  it('updates company contact and branding', async () => {
    const company = await createCompany({
      companyName: 'Northwind Trading',
      ownerEmail: 'owner@northwind.example.com',
      ownerFirstName: 'Michael',
      ownerLastName: 'Stone',
      password: 'NorthwindPassword!23',
    });

    const updated = await updateCompany(company.id, {
      companyName: 'Northwind International',
      logoUrl: 'https://cdn.example.com/logo.png',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      contactEmail: 'hq@northwind.example.com',
      contactPhone: '+1 555 987 6543',
      status: 'suspended',
      ownerPhone: '+1 555 200 3000',
      socialLinks: [{ label: 'LinkedIn', url: 'https://linkedin.com/company/northwind' }],
    });

    expect(updated.companyName).toBe('Northwind International');
    expect(updated.owner.status).toBe('suspended');
    expect(updated.contactEmail).toBe('hq@northwind.example.com');
    expect(updated.socialLinks[0].label).toBe('LinkedIn');

    const persisted = await getCompany(company.id);
    expect(persisted.owner.phoneNumber).toBe('+1 555 200 3000');
    expect(persisted.bannerUrl).toBe('https://cdn.example.com/banner.jpg');
  });

  it('archives companies and soft disables owner accounts', async () => {
    const company = await createCompany({
      companyName: 'Atlas Biotech',
      ownerEmail: 'ceo@atlas.example.com',
      ownerFirstName: 'Priya',
      ownerLastName: 'Mehta',
      password: 'AtlasBioStrongPwd1!',
    });

    const archived = await archiveCompany(company.id);
    expect(archived.owner.status).toBe('archived');

    const owner = await User.findByPk(archived.owner.id);
    expect(owner.status).toBe('archived');
  });
});

