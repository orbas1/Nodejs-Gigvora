export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  address: string | null;
  location: string | null;
  geoLocation: {
    lat?: number;
    lng?: number;
    raw?: unknown;
  } | null;
  age: number | null;
  userType: "user" | "company" | "freelancer" | "agency" | "admin";
  twoFactorEnabled: boolean;
  twoFactorMethod: "email" | "app" | "sms";
  lastLoginAt: string | null;
  googleId: string | null;
  memberships: string[];
  primaryDashboard: string;
}
