import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
import { appCache } from '../src/utils/cache.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';

if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
}

let coreModelsLoaded = false;

async function loadCoreModels() {
  if (coreModelsLoaded) {
    return;
  }

  await import('../src/models/index.js');
  coreModelsLoaded = true;
}

const DEFAULT_TEST_DEPENDENCIES = ['database', 'paymentsCore', 'complianceProviders'];

async function primeDependencyHealth() {
  DEFAULT_TEST_DEPENDENCIES.forEach((dependency) => {
    markDependencyHealthy(dependency, { source: 'test_harness' });
  });

  const PlatformSettingModel = sequelize.models?.PlatformSetting;
  if (!PlatformSettingModel) {
    return;
  }

  const defaults = {
    key: 'platform',
    value: {
      payments: {
        provider: 'stripe',
        stripe: {
          publishableKey: 'pk_test_dummy',
          secretKey: 'sk_test_dummy',
          webhookSecret: 'whsec_dummy',
        },
        escrow_com: {
          apiKey: 'escrow_test_key',
          apiSecret: 'escrow_test_secret',
          sandbox: true,
        },
      },
      storage: {
        provider: 'cloudflare_r2',
        cloudflare_r2: {
          accountId: 'r2_test_account',
          accessKeyId: 'r2_access',
          secretAccessKey: 'r2_secret',
          bucket: 'r2-bucket',
          endpoint: 'https://r2.example.com',
          publicBaseUrl: 'https://cdn.example.com',
        },
      },
    },
  };

  const [setting] = await PlatformSettingModel.findOrCreate({
    where: { key: defaults.key },
    defaults,
  });

  const currentValue = setting.value ?? {};
  const mergedValue = {
    ...currentValue,
    payments: {
      ...defaults.value.payments,
      ...(currentValue.payments ?? {}),
      stripe: {
        ...defaults.value.payments.stripe,
        ...(currentValue.payments?.stripe ?? {}),
      },
      escrow_com: {
        ...defaults.value.payments.escrow_com,
        ...(currentValue.payments?.escrow_com ?? {}),
      },
    },
    storage: {
      ...defaults.value.storage,
      ...(currentValue.storage ?? {}),
      cloudflare_r2: {
        ...defaults.value.storage.cloudflare_r2,
        ...(currentValue.storage?.cloudflare_r2 ?? {}),
      },
    },
  };

  await setting.update({ value: mergedValue });
}

jest.setTimeout(30000);

beforeAll(async () => {
  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    await primeDependencyHealth();
    return;
  }

  await loadCoreModels();
  await sequelize.sync({ force: true });
  await primeDependencyHealth();
});

beforeEach(async () => {
  appCache.store?.clear?.();

  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    await primeDependencyHealth();
    return;
  }

  await loadCoreModels();
  await sequelize.sync({ force: true });
  await primeDependencyHealth();
});

afterAll(async () => {
  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    return;
  }

  await sequelize.close();
});
