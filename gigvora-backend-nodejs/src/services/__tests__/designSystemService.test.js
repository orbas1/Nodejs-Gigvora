import {
  configureDesignSystem,
  resetDesignSystem,
  getDesignSystemSnapshot,
  getRuntimeDesignTokens,
  getDesignSystemMetadata,
} from '../designSystemService.js';

describe('designSystemService', () => {
  afterEach(() => {
    resetDesignSystem();
  });

  it('returns a snapshot with default metadata and tokens', () => {
    const snapshot = getDesignSystemSnapshot();

    expect(snapshot.version).toEqual(expect.any(String));
    expect(snapshot.preferences.mode).toBe('light');
    expect(snapshot.tokens.runtime.colors.background).toBeDefined();
    expect(snapshot.componentTokens.version).toEqual(expect.any(String));
  });

  it('merges configured overrides into the snapshot', () => {
    configureDesignSystem({
      mode: 'dark',
      accent: 'violet',
      density: 'compact',
      componentTokens: { buttonSuite: { variants: { primary: { class: 'bg-indigo-600 text-white' } } } },
    });

    const snapshot = getDesignSystemSnapshot();

    expect(snapshot.preferences).toMatchObject({ mode: 'dark', accent: 'violet', density: 'compact' });
    expect(snapshot.tokens.runtime.colors.text).toContain('#');
    expect(snapshot.componentTokens.registry.buttonSuite.variants.primary.class).toContain('bg-indigo-600');
  });

  it('produces runtime tokens and metadata for analytics', () => {
    configureDesignSystem({ mode: 'dark' });

    const runtime = getRuntimeDesignTokens({ accent: 'emerald' });
    const metadata = getDesignSystemMetadata();

    expect(runtime.runtime.colors.accent).toContain('#');
    expect(runtime.metadata.version).toEqual(metadata.version);
    expect(metadata.analytics).toMatchObject({ modeCount: expect.any(Number) });
  });
});
