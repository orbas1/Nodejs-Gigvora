export * from '../../node_modules/zod/index.js';

import zodDefault, * as zodModule from '../../node_modules/zod/index.js';

const exportedZ = zodModule?.z ?? zodDefault;
const exportedZodError = zodModule?.ZodError ?? zodDefault.ZodError;

export const z = exportedZ;
export const ZodError = exportedZodError;

const defaultExport = { ...zodModule, z: exportedZ, ZodError: exportedZodError };

export default defaultExport;
