import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  firstName: z.string().max(120).nullable(),
  lastName: z.string().max(120).nullable(),
  name: z.string(),
  address: z.string().max(255).nullable(),
  location: z.string().max(255).nullable(),
  geoLocation: z
    .object({ lat: z.number(), lng: z.number() })
    .extend({ raw: z.any().optional() })
    .partial()
    .nullable(),
  age: z.number().int().min(13).nullable(),
  userType: z.enum(['user', 'company', 'freelancer', 'agency', 'admin']),
  twoFactorEnabled: z.boolean(),
  twoFactorMethod: z.enum(['email', 'app', 'sms']),
  lastLoginAt: z.string().datetime().nullable(),
  googleId: z.string().nullable(),
  appleId: z.string().nullable(),
  linkedinId: z.string().nullable(),
  memberships: z.array(z.string()),
  primaryDashboard: z.string(),
});

export default authUserSchema;
