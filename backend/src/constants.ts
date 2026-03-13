// Reserved subdomains — blocked at profile creation (Task 6)
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'admin',
  'dashboard',
  'mail',
  'dev',
  'staging',
  'blog',
  'help',
  'support',
  'status',
  'static',
  'assets',
] as const;

export type ReservedSubdomain = (typeof RESERVED_SUBDOMAINS)[number];
