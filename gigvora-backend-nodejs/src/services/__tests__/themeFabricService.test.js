import { Sequelize, DataTypes } from 'sequelize';

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

const AppearanceTheme = testSequelize.define(
  'AppearanceTheme',
  {
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'draft' },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    tokens: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    accessibility: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  },
  { tableName: 'appearance_themes' },
);

AppearanceTheme.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id ?? null,
    slug: plain.slug,
    name: plain.name,
    status: plain.status,
    isDefault: Boolean(plain.isDefault),
    tokens: plain.tokens ?? {},
    accessibility: plain.accessibility ?? {},
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

const AppearanceComponentProfile = testSequelize.define(
  'AppearanceComponentProfile',
  {
    themeId: { type: DataTypes.INTEGER, allowNull: true },
    componentKey: { type: DataTypes.STRING(120), allowNull: false },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'active' },
    definition: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  },
  { tableName: 'appearance_component_profiles' },
);

AppearanceComponentProfile.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id ?? null,
    themeId: plain.themeId ?? null,
    componentKey: plain.componentKey,
    status: plain.status,
    definition: plain.definition ?? {},
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

const serviceModule = await import('../themeFabricService.js');
serviceModule.__setDependencies({
  models: { AppearanceTheme, AppearanceComponentProfile },
  logger: { child: () => ({ warn: () => {}, info: () => {} }) },
});

const { getThemeFabric, __resetDependencies } = serviceModule;

describe('themeFabricService', () => {
  beforeAll(async () => {
    await testSequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await AppearanceComponentProfile.destroy({ where: {} });
    await AppearanceTheme.destroy({ where: {} });
  });

  afterAll(async () => {
    await testSequelize.close();
    __resetDependencies();
  });

  test('returns baseline fabric when no theme configured', async () => {
    const fabric = await getThemeFabric();

    expect(fabric.version).toBe('fallback');
    expect(fabric.theme.accentPresets.azure).toBeDefined();
    expect(fabric.components.tokens).toEqual({});
  });

  test('hydrates theme tokens and component profiles', async () => {
    const theme = await AppearanceTheme.create({
      slug: 'gigvora-daybreak',
      name: 'Gigvora Daybreak',
      status: 'active',
      isDefault: true,
      tokens: {
        colors: {
          primary: '#2563EB',
          secondary: '#0EA5E9',
          accent: '#F97316',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          borderStrong: '#94A3B8',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
        },
        typography: {
          headingFamily: 'Inter',
          bodyFamily: 'Inter',
          monospaceFamily: 'JetBrains Mono',
          baseFontSize: 16,
          lineHeight: 1.6,
          headingWeight: 600,
          bodyWeight: 400,
        },
        layout: {
          borderRadius: 18,
          surfaceRadius: 30,
          sectionGutter: 80,
          cardSpacing: 22,
        },
        components: {
          shadowStrength: 0.22,
        },
        imagery: {
          heroBackground: 'gradient:indigo-cyan',
        },
      },
      accessibility: {
        minimumContrastRatio: 4.8,
        reducedMotion: true,
      },
    });

    await AppearanceComponentProfile.create({
      themeId: theme.id,
      componentKey: 'navigation.hero',
      status: 'active',
      definition: { radius: 'lg', blur: '40px' },
      metadata: { version: '2.4.1' },
    });

    const fabric = await getThemeFabric();

    expect(fabric.theme.slug).toBe('gigvora-daybreak');
    expect(fabric.theme.accentPresets['gigvora-daybreak'].accent).toBe('#F97316');
    expect(fabric.theme.radii.md).toContain('rem');
    expect(fabric.theme.typography.fontSans).toContain('Inter');
    expect(fabric.components.tokens['navigation.hero']).toMatchObject({ radius: 'lg' });
    expect(fabric.components.version).toBe('2.4.1');
    expect(fabric.metadata.themeId).toBe(theme.id);
  });

  test('allows excluding component profiles from response', async () => {
    await AppearanceTheme.create({
      slug: 'gigvora-nightfall',
      name: 'Gigvora Nightfall',
      status: 'active',
      isDefault: true,
      tokens: {},
      accessibility: {},
    });

    const fabric = await getThemeFabric({ includeComponentProfiles: false });
    expect(fabric.components.tokens).toEqual({});
  });
});
