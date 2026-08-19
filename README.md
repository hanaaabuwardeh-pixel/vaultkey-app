# VaultKey

VaultKey is a verified, below-market opportunity marketplace for residential, multifamily, commercial, land, and business assets.

## Applications

- `apps/mobile` — Expo React Native app for buyers, sellers, and agents.
- `apps/admin` — Next.js review and operations portal.
- `packages/shared` — shared domain types and design tokens.
- `supabase` — database migrations and backend configuration.

## Local development

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and add the Supabase public credentials.
3. Run `npm install`.
4. Run `npm run mobile` or `npm run admin`.

Never commit service-role keys, database passwords, Apple credentials, or Google credentials.
