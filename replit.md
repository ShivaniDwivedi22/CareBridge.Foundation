# Workspace

## Overview

CareConnect — a care-giving marketplace web app connecting caregivers to care seekers across categories like pet care, newborn care, postpartum care, elderly care, special needs care, and child care.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, wouter, Tailwind CSS, shadcn/ui, framer-motion

## Artifacts

- `careconnect` — React + Vite web app at `/` (main frontend)
- `api-server` — Express 5 API server at `/api`

## Key Features

- Browse caregivers by category (Pet Care, Newborn, Postpartum, Elderly, Special Needs, Child Care, House Help, Kitchen & Food Help, Event Support, Travel & Medical Care)
- Caregiver profiles with ratings, reviews, hourly rate, verification badge
- Post care requests as a care seeker
- Register as a caregiver (7-step form with AvailabilityPicker)
- Bookings management dashboard with Pay/Cancel actions
- Dashboard overview with stats and category breakdown
- In-platform messaging (conversations + threads)
- Admin panel (caregiver approval, review moderation, refunds & cancellations tab)
- Payments (Stripe): create PaymentIntent, confirm payment, receipts, 15% platform commission
- Cancellation & Refunds: tiered policy (48h+ = 100%, 24–48h = 50%, <24h = 0%), admin override
- Provider Earnings dashboard
- Geo-location search (Nominatim)
- Clerk authentication (custom UI, proxy path `/__clerk`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `categories` — care categories (pet-care, newborn-care, etc.)
- `caregivers` — caregiver profiles
- `care_requests` — care seeker job postings
- `bookings` — bookings between caregivers and care requests

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
