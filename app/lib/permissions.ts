import type { Role } from './definitions';

// Single source of truth for who can do what. The proxy (route guard),
// server actions and UI all ask `can()`, so a rule only changes in one place.
const PERMISSIONS = {
  'invoices:read': ['admin', 'viewer'],
  'invoices:write': ['admin'],
  'customers:read': ['admin', 'viewer'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

// Routes that need more than "signed in". Checked in order; first match wins.
export const PROTECTED_ROUTES: { pattern: RegExp; permission: Permission }[] = [
  { pattern: /^\/dashboard\/invoices\/create\/?$/, permission: 'invoices:write' },
  { pattern: /^\/dashboard\/invoices\/[^/]+\/edit\/?$/, permission: 'invoices:write' },
];

export function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'viewer';
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  viewer: 'Viewer',
};
