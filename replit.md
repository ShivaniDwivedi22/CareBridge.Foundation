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

- **No Contact Before Payment** marketplace model enforced end-to-end
- Browse caregivers by category (Pet Care, Newborn, Postpartum, Elderly, Special Needs, Child Care, House Help, Kitchen & Food Help, Event Support, Travel & Medical Care)
- Caregiver profiles with ratings, reviews, hourly rate, verification badge, and trust signals
- Post care requests as a care seeker
- Register as a caregiver (7-step form with **TwoWeekPicker** availability, structured 3-reference rows, saves clerkId)
- **Dashboard with Seeker/Provider tabs** — "Seeking Care" mode filters own bookings; "Providing Care" mode fetches via API using caregiver clerkId
- **Clickable KPI tiles** on dashboard (filter view to Completed/In Progress/Pending, Payments Made navigates to history)
- Mini booking journey indicator (6-step progress bar) on each booking row
- **Self-review prevention** on caregiver profile (hides Write Review button if caregiver.clerkId === user.id)
- **Post-request auto-suggest** headline from selected category
- **Review CTA** for completed bookings
- **Post-payment success page** at `/payments/success` — shows "Shukriya!" celebration, phone contact reveal, 6-step journey
- Checkout redirects to `/payments/success` after confirmed payment
- In-platform messaging (conversations + threads)
- **Admin panel** — caregiver approval/rejection with reason dialog, in-app notifications on approve/reject, 7-card analytics, review moderation, refunds, Disputed Services tab
- Payments (Stripe): create PaymentIntent, confirm payment, receipts, 15% platform commission
- Cancellation & Refunds: tiered policy (48h+ = 100%, 24–48h = 50%, <24h = 0%), admin override
- Geo-location search (Nominatim)
- Clerk authentication (custom UI, proxy path `/__clerk`)
- Branded 404 page with Care Bridge identity

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
