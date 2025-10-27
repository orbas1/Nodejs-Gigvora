import { beforeEach, describe, expect, it } from '@jest/globals';
import sequelize from '../../src/models/sequelizeClient.js';
import { getNavigationChrome } from '../../src/services/navigationChromeService.js';
import navigationChromeSeed from '../../database/seeders/20250215121000-navigation-chrome-seed.cjs';

const queryInterface = sequelize.getQueryInterface();

describe('navigationChromeService', () => {
  beforeEach(async () => {
    await navigationChromeSeed.up(queryInterface);
  });

  it('returns hydrated locales, personas, and footer metadata from the database', async () => {
    const chrome = await getNavigationChrome();

    expect(Array.isArray(chrome.locales)).toBe(true);
    expect(chrome.locales).not.toHaveLength(0);
    const arabic = chrome.locales.find((locale) => locale.code === 'ar');
    expect(arabic).toBeDefined();
    expect(arabic.metadata.supportChannel).toBe('Dubai studio • Slack #loc-ar');
    expect(Array.isArray(arabic.metadata.playbooks)).toBe(true);
    expect(arabic.metadata.playbooks).toContain('RTL layout QA');

    expect(Array.isArray(chrome.personas)).toBe(true);
    const mentor = chrome.personas.find((persona) => persona.key === 'mentor');
    expect(mentor).toBeDefined();
    expect(mentor.playbooks).toContain('Session preparation');
    expect(mentor.lastReviewedAt).toBe('2024-05-06T17:40:00.000Z');
    expect(mentor.metadata.supportLead).toBe('Mentor enablement');

    expect(chrome.footer).toBeDefined();
    expect(Array.isArray(chrome.footer.dataResidency)).toBe(true);
    expect(chrome.footer.dataResidency).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ region: 'EU', city: 'Frankfurt, DE', status: 'Primary' }),
      ]),
    );
    expect(chrome.footer.statusPage).toBeDefined();
    expect(chrome.footer.statusPage.state).toBe('ready');
    expect(chrome.footer.statusPage.incidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'nav-20240518', resolvedAt: '2024-05-18T16:45:00.000Z' }),
      ]),
    );
  });

  it('can omit footer payloads when includeFooter is false', async () => {
    const chrome = await getNavigationChrome({ includeFooter: false });
    expect(chrome.footer).toBeNull();
    expect(chrome.locales.length).toBeGreaterThan(0);
  });
});
