# Kiki Paws — Technical Documentation

This document is a deep-dive companion to [README.md](./README.md). It covers architecture, data models, the full API surface, auth/authorization rules, and the mechanics of each key flow (payments, chat, reviews). Use the README for setup instructions; use this file to understand how the system actually works.

---

## 1. Architecture Overview

Kiki Paws is a single Next.js 16 (App Router) application — there is no separate backend service. Server logic lives in Route Handlers under `app/api/**/route.ts`, rendered pages live under `app/**/page.tsx`, and shared logic lives in `lib/`.

```
Browser
  │
  ├─ Clerk (auth UI + session) ──────────────┐
  │                                          │
  ▼                                          ▼
Next.js App Router (app/)             Clerk middleware (middleware.ts)
  │  - Server Components (data fetch)        gates every non-public route
  │  - Client Components (interactivity)
  │
  ▼
Route Handlers (app/api/**/route.ts)
  │  - auth() from @clerk/nextjs/server → Clerk user ID
  │  - connectDB() → Mongoose/MongoDB
  │  - business logic + validation
  │
  ├──► MongoDB Atlas (via Mongoose)
  ├──► Stripe (Checkout + Webhooks + Refunds)
  ├──► Resend (transactional email, optional)
  └──► UploadThing (image storage, optional)
```

**Key architectural decisions:**

- **Clerk is the identity provider; MongoDB is the system of record for app data.** Every Clerk user is mirrored into a local `User` document via [lib/actions/syncUser.ts](./lib/actions/syncUser.ts), keyed by `clerkId`. All foreign keys in the app (bookings, pets, messages, reviews) reference the local Mongo `_id`, not the Clerk ID directly.
- **No dedicated realtime infra.** Chat "real-time" is implemented with Server-Sent Events (SSE) backed by a 2-second poll loop against MongoDB inside the route handler (see §6.2) — there is no WebSocket server or pub/sub system.
- **Stripe Checkout (hosted), not Payment Intents/Elements.** The app redirects to Stripe's hosted checkout page rather than building a custom payment form.
- **Connection caching across hot reloads.** [lib/db.ts](./lib/db.ts) caches the Mongoose connection promise on `global` so Next.js dev-mode hot reloads don't open a new connection per reload.

---

## 2. Authentication & Authorization

### 2.1 Session-level (Clerk middleware)

[middleware.ts](./middleware.ts) runs on every request except static assets. Public routes are `/`, `/login(.*)`, `/signup(.*)`; everything else requires a valid Clerk session (`auth.protect()`), including all `/api/**` routes except where a handler explicitly allows unauthenticated GETs (e.g. `/api/sitters`, `/api/reviews` GET).

### 2.2 Route-handler level

Every protected route handler independently calls `const { userId } = await auth()` and returns `401` if absent, then looks up the local `User` document by `clerkId`. This means **Clerk ID and Mongo `User._id` are both checked at every layer** — middleware confirms the session exists, the handler confirms a corresponding `User` document exists.

### 2.3 Resource-level authorization rules

These are enforced in application code, not database rules — worth knowing when adding new endpoints:

| Action | Who can perform it |
|---|---|
| Accept / decline / mark active / complete a booking | Only the **sitter** on that booking (`app/api/bookings/[id]/route.ts`) |
| Cancel a booking | Only the **owner** on that booking |
| Request a refund | Only the **owner**, and only if `paymentStatus === 'paid'` and `status === 'cancelled'` |
| Create a Stripe Checkout session | Only the **owner**, and only if booking `status === 'accepted'` and not already paid |
| Send/read chat messages | Only the **owner or sitter** who are parties to that specific booking |
| Leave a review | Only the **owner**, only once per booking, only if `status === 'completed'` |
| View `/admin` stats | Only Clerk user IDs listed in `ADMIN_CLERK_IDS` (comma-separated env var) |
| Update `SitterProfile` | Only users with `role === 'sitter' \| 'both'` |

### 2.4 Admin access

There is no `isAdmin` flag on the `User` model — admin status is purely env-config-driven: `ADMIN_CLERK_IDS` is a comma-separated list of Clerk user IDs checked directly in [app/api/admin/stats/route.ts](./app/api/admin/stats/route.ts). To grant admin access, add a user's Clerk ID to that env var (no code or DB change needed).

---

## 3. Data Models

All models are Mongoose schemas under `lib/models/`, each with Mongoose-managed `createdAt`/`updatedAt` timestamps.

### User (`lib/models/User.ts`)
Mirrors a Clerk identity into the app's own collection.

| Field | Type | Notes |
|---|---|---|
| `clerkId` | string | unique — links to Clerk |
| `email` | string | unique |
| `firstName`, `lastName` | string | defaults to `''`, populated from Clerk on first sync |
| `photo` | string | Clerk avatar URL |
| `role` | `'owner' \| 'sitter' \| 'both'` | default `'owner'`, set during onboarding |
| `phone`, `location` | string? | optional |
| `onboarded` | boolean | gates onboarding redirect (see §7.3) |

### SitterProfile (`lib/models/SitterProfile.ts`)
One-to-one with a `User` (`userId` is `unique`). Only exists for sitter/both-role users.

| Field | Type | Notes |
|---|---|---|
| `bio`, `experience`, `location` | string | free text |
| `services` | `('sitting'\|'walking'\|'boarding'\|'dropin'\|'grooming')[]` | multi-select |
| `hourlyRate` | number | drives price calculation, see §7.1 |
| `averageRating`, `reviewCount` | number | denormalized, recalculated on every new review |
| `profilePhoto` | string? | UploadThing URL |
| `availability` | object of 7 days (`mon`…`sun`) | each day: `{ available: boolean, from: 'HH:MM', to: 'HH:MM' }` |

### Pet (`lib/models/Pet.ts`)
Belongs to an owner `User`. Fields: `name`, `breed`, `age` (number), `size` (`small\|medium\|large\|xlarge`), `notes?`, `photo?`.

### Booking (`lib/models/Booking.ts`)
The central entity linking an owner, sitter, sitter profile, and pet.

| Field | Type | Notes |
|---|---|---|
| `ownerId`, `sitterId` | ObjectId → User | |
| `sitterProfileId` | ObjectId → SitterProfile | |
| `petId` | ObjectId → Pet | |
| `service` | enum (same 5 values as `SitterProfile.services`) | |
| `startDate`, `endDate` | Date | |
| `totalPrice` | number | computed once at creation, see §7.1 |
| `status` | `pending → accepted → active → completed`, or `declined`/`cancelled` | state machine, see §3.1 below |
| `paymentStatus` | `unpaid → paid → refunded` | independent of `status` |
| `stripeSessionId` | string? | set when Checkout session is created; used by webhook + refund lookup |
| `reviewed` | boolean | set `true` after a review is created, prevents double reviews |
| `notes` | string? | owner-supplied at booking time |

**3.1 Booking status state machine:**

```
pending ──accept(sitter)──► accepted ──[payment webhook]──► active ──complete(sitter)──► completed
   │                            │
   └──decline(sitter)──► declined    └──cancel(owner)──► cancelled ──[refund if paid]
```
Note: only the sitter can move a booking through `accepted → active → completed`; only the owner can `cancel`. The transition to `active` is driven by the Stripe webhook, not a direct PATCH call — see §7.1.

### Message (`lib/models/Message.ts`)
Belongs to a `Booking`. Fields: `senderId` (User), `text`, `readBy` (array of User ObjectIds who've seen it). Indexed on `{ bookingId: 1, createdAt: -1 }` for fast per-booking, latest-first queries.

### Review (`lib/models/Review.ts`)
One-per-booking (`bookingId` is `unique`). Fields: `reviewerId` (always the owner), `sitterId`, `sitterProfileId`, `rating` (1–5), `comment?` (max 500 chars). Indexed on `sitterProfileId` and `sitterId` for profile-page lookups.

---

## 4. API Reference

All endpoints are under `/api`. Unless noted, request/response bodies are JSON. `401` = not authenticated (no Clerk session or no matching `User`), `403` = authenticated but not authorized for this resource, `404` = resource not found.

### Bookings
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bookings` | required | Returns `{ asOwner: Booking[], asSitter: Booking[] }` for the current user, each populated with counterpart name/photo and pet name/breed. |
| `POST` | `/api/bookings` | required (owner) | Body: `{ sitterProfileId, petId, service, startDate, endDate, notes? }`. Computes `totalPrice = hourlyRate * 8 * days` (see §7.1), creates booking with `status: 'pending'`, fires `sendBookingRequestEmail`. Returns `201` + booking. |
| `PATCH` | `/api/bookings/[id]` | required | Body: `{ status }`. Sitter can set `accepted\|declined\|active\|completed`; owner can set `cancelled`. Fires status-change email for `accepted\|declined\|cancelled`. |
| `POST` | `/api/bookings/[id]/refund` | required (owner) | No body. Requires `paymentStatus: 'paid'` and `status: 'cancelled'`. Calls `stripe.refunds.create` against the Checkout session's PaymentIntent, sets `paymentStatus: 'refunded'`. |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/checkout` | required (owner) | Body: `{ bookingId }`. Requires booking `status: 'accepted'` and not already paid. Creates a Stripe Checkout session (single line item = `totalPrice` in cents), stores `stripeSessionId` on the booking, returns `{ url }` to redirect the browser to. |
| `POST` | `/api/webhook/stripe` | Stripe signature (`STRIPE_WEBHOOK_SECRET`) | Verifies signature via `stripe.webhooks.constructEvent`. On `checkout.session.completed`, sets `paymentStatus: 'paid'`, `status: 'active'`, and sends the payment-confirmed email to both parties. Body parsing is disabled (`bodyParser: false`) since Stripe requires the raw request body for signature verification. |

### Messaging
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/[bookingId]` | required, must be a party to the booking | Returns `{ messages, currentUserId }`, sorted oldest-first. As a side effect, marks all messages from the other party as read (`$addToSet` into `readBy`). |
| `POST` | `/api/messages/[bookingId]` | required, must be a party to the booking | Body: `{ text }`. Rejects empty/whitespace text. Creates and returns the populated message. |
| `GET` | `/api/messages/sse?bookingId=...` | required, must be a party to the booking | Opens a `text/event-stream` response. Polls Mongo every 2s for messages newer than the last check; sends `{type:'messages',data:[...]}` or `{type:'heartbeat'}`. Cleans up its interval on client disconnect (`req.signal` abort). `dynamic = 'force-dynamic'` to prevent caching. |
| `GET` | `/api/messages/unread` | required | Returns `{ count }` — total unread messages across every booking (owner or sitter side) for the current user. Used by the dashboard's polling badge. |

### Pets
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/pets` | required | All pets belonging to the current user. |
| `POST` | `/api/pets` | required | Body: `{ name, breed, age, size, notes? }`. |
| `PATCH` | `/api/pets/[id]` | required, must own the pet | Partial update — body is passed through directly to `findOneAndUpdate`. |
| `DELETE` | `/api/pets/[id]` | required, must own the pet | |

### Sitters & Profiles
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sitters?service=&search=&page=` | public | Paginated (6/page) browse list. `search` matches sitter first/last name or location via case-insensitive regex against `User`, then filters `SitterProfile` by matching `userId`s. Sorted by `averageRating` desc, then `createdAt` desc. |
| `GET` | `/api/sitters/[id]` | public | `id` is the **SitterProfile** `_id`. Returns `{ profile, reviews }` for that sitter's public page. |
| `GET` / `PATCH` | `/api/sitter-profile` | required | Current user's own profile. `PATCH` requires `role` of `sitter`/`both`; upserts (`upsert: true`) so first-time saves work without a pre-existing document. |
| `GET` | `/api/sitter-profile/earnings` | required | Sums `totalPrice` across all `paymentStatus: 'paid'` bookings where the user is the sitter; also buckets totals by month (`byMonth`) for the earnings dashboard chart. |

### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews?sitterProfileId=...` | public | All reviews for a sitter profile, newest first. |
| `POST` | `/api/reviews` | required (owner) | Body: `{ bookingId, rating (1-5 int), comment? }`. Requires booking `status: 'completed'`, requester is the booking's owner, and not already reviewed. Recalculates and persists the sitter's `averageRating`/`reviewCount` synchronously in the same request. |

### Onboarding & Profile
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/onboarding` | required | Body: `{ role, location, phone, bio, services, hourlyRate, experience }`. Sets `User.onboarded = true`; if role is sitter/both, upserts a `SitterProfile` too. |
| `PATCH` | `/api/user` | required | Updates `firstName, lastName, phone, location, role` on the current `User`. |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Clerk ID must be in `ADMIN_CLERK_IDS` | Returns aggregate `stats` (user/sitter/booking counts, total paid revenue, review count) plus the 10 most recent bookings and users. |

### Misc
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/seed` | none, but **blocked when `NODE_ENV === 'production'`** | Idempotently creates 4 hardcoded test sitters (skips any whose `clerkId` already exists). Same data as `scripts/seed.mjs`/`scripts/seed-sitters.ts` but callable over HTTP. |
| `GET`/`POST` | `/api/uploadthing` | Clerk session required (checked in the file router middleware) | UploadThing's route handler for `petPhoto` and `sitterPhoto` upload endpoints (4MB max, 1 file). |

---

## 5. Environment Variables Reference

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Yes | Clerk auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` / `..._SIGN_IN_FALLBACK_REDIRECT_URL` / `..._SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Clerk redirect routing |
| `MONGODB_URI` | Yes | Mongoose connection string. Must resolve via DNS if using `mongodb+srv://` — see troubleshooting note below. |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Yes (for payments to complete) | Verifies webhook signatures; without it, `/api/webhook/stripe` returns `500` and bookings never flip to `active`/`paid` |
| `RESEND_API_KEY` | No | Email sending. All `lib/email.ts` functions no-op (return early) if unset — **the `Resend` client itself is also constructed lazily (`null` if unset)** to avoid a hard crash on import. |
| `UPLOADTHING_TOKEN` | No | Required only if users need to upload pet/profile photos |
| `ADMIN_CLERK_IDS` | No | Comma-separated Clerk user IDs granted access to `/admin` and `/api/admin/stats` |
| `NEXT_PUBLIC_APP_URL` | No (defaults to `http://localhost:3000`) | Used to build Stripe success/cancel redirect URLs and email links |

**Troubleshooting `mongodb+srv://` DNS errors:** If you see `querySrv ENOTFOUND _mongodb._tcp....mongodb.net`, your network's DNS resolver (often a home router) is failing to resolve the SRV record — the cluster itself is usually fine. Fixes: switch to a public DNS resolver (1.1.1.1/8.8.8.8), or replace the URI with the non-SRV form listing the three shard hosts directly (`mongodb://user:pass@shard-00,shard-01,shard-02/?replicaSet=...&authSource=admin`), which skips SRV lookups entirely.

---

## 6. Key Mechanics

### 6.1 Booking price calculation
`totalPrice` is computed once, at booking creation time, in [app/api/bookings/route.ts](./app/api/bookings/route.ts):
```
days = ceil((endDate - startDate) / 1 day), minimum 1
totalPrice = sitterProfile.hourlyRate * 8 * days
```
This assumes an implicit 8-hour "day" of service. It is **not** recalculated later — if the sitter's `hourlyRate` changes after a booking is created, existing bookings keep their original price.

### 6.2 Real-time chat (SSE)
There is no WebSocket/pub-sub layer. `/api/messages/sse` opens a long-lived HTTP response and, inside a `setInterval(…, 2000)`, queries MongoDB for messages newer than the last check. The client (`ChatDrawer.tsx`) consumes this as an `EventSource`. The unread-count badge on the dashboard (`components/UnreadBadge.tsx`) polls `/api/messages/unread` independently every 30 seconds — it is not pushed via SSE.

### 6.3 Payment lifecycle
1. Owner calls `POST /api/checkout` with an `accepted` booking → Stripe Checkout session created, `stripeSessionId` saved, browser redirected to Stripe's hosted page.
2. User pays on Stripe's page.
3. Stripe calls `POST /api/webhook/stripe` (must be reachable — via `stripe listen` locally or a real webhook endpoint in prod). This is the **only** path that flips `paymentStatus → paid` and `status → active`. If the webhook never fires (e.g. `STRIPE_WEBHOOK_SECRET` misconfigured, or `stripe listen` not running locally), a paid Stripe session will exist but the booking stays `accepted`/`unpaid` forever.
4. Refunds are separate: only allowed on bookings that are both `paid` and `cancelled`, and only initiated by the owner via `POST /api/bookings/[id]/refund`, which looks up the original PaymentIntent from the stored `stripeSessionId`.

### 6.4 Review → rating recalculation
Creating a review is synchronous end-to-end: validate → create `Review` → set `Booking.reviewed = true` → refetch **all** reviews for that `sitterProfileId` → recompute `averageRating` (rounded to 1 decimal) and `reviewCount` → persist onto `SitterProfile`. There's no incremental/cached counter — every new review re-averages the full set.

### 6.5 Mongo connection caching (`lib/db.ts`)
The Mongoose connection promise is cached on `global` so repeated dev-mode hot reloads reuse the same connection rather than opening a new one each time. `connectDB()` clears the cached promise on connection failure so a later call can retry — a bare connection failure only needs the underlying cause fixed (e.g. bad URI, DNS) and the next request will attempt to reconnect instead of being stuck replaying the same rejected promise forever.

---

## 7. Frontend Structure

### Pages
- `app/page.tsx` + `HomeClient.tsx` — marketing homepage (server shell + animated client component).
- `app/sitters/page.tsx` — public sitter browse/search/pagination; `app/sitters/[id]/page.tsx` — public sitter profile with `BookingModal.tsx` for creating a booking.
- `app/onboarding/` — post-signup role selection + initial profile setup (`OnboardingForm.tsx`), gated by `User.onboarded`.
- `app/dashboard/` — authenticated area:
  - `bookings/` — booking list (both roles), `ChatDrawer.tsx` (SSE chat UI), `ReviewModal.tsx`.
  - `pets/` — pet CRUD UI.
  - `earnings/` — sitter-only earnings dashboard (monthly bar breakdown + transaction table).
  - `sitter-profile/` — sitter-only profile/availability editor (`SitterProfileForm.tsx`).
  - `profile/` — shared account settings (`ProfileForm.tsx`).
- `app/admin/page.tsx` — admin stats dashboard, gated client-side by the same `ADMIN_CLERK_IDS` check the API enforces.
- `app/privacy/`, `app/terms/` — static legal pages.

### Shared components (`components/`)
- `ImageUpload.tsx` — wraps UploadThing's upload button for pet/sitter photos.
- `StarRating.tsx` — dual-mode (interactive input vs. read-only display) star widget.
- `UnreadBadge.tsx` — polls `/api/messages/unread` every 30s.

---

## 8. Testing

```bash
npm test          # run once
npm run test:watch
```

Jest + React Testing Library, 32 tests across 3 suites (see `__tests__/`):
- `components/StarRating.test.tsx` (7) — rendering, click/hover interactivity, accessibility roles.
- `components/ReviewModal.test.tsx` (7) — form submission, validation, character counter, cancel behavior.
- `api/reviews.test.ts` (18) — auth requirements, booking-status/ownership validation, duplicate-review prevention, average rating recalculation.

There is no test coverage yet for bookings, payments, messaging, or the admin API — worth prioritizing if extending this suite, since those are the highest-risk flows (money and authorization logic).

---

## 9. Utility Scripts (`scripts/`)

| Script | Purpose |
|---|---|
| `seed.mjs` | Seeds 4 test sitter profiles directly against MongoDB (same data as `POST /api/seed`). Run with `node scripts/seed.mjs`. |
| `seed-sitters.ts` | TypeScript variant of the above. |
| `accept-booking.mjs` | Finds the most recent `pending` booking and flips it to `accepted` — useful for skipping the manual accept step while testing the payment flow locally. |

---

## 10. Deployment Notes

Designed for Vercel. Beyond setting all env vars from §5 in the Vercel dashboard:
- The Stripe webhook must point at the deployed domain (`https://your-domain.com/api/webhook/stripe`) with its own production `STRIPE_WEBHOOK_SECRET` — the value used for local `stripe listen` testing will not work in production.
- `POST /api/seed` is automatically disabled when `NODE_ENV === 'production'`, so it's safe to leave deployed without exposing a way to inject fake users into a live database.
- If `MONGODB_URI` uses `mongodb+srv://` and you hit `ENOTFOUND` for the SRV record from a serverless environment, consider the non-SRV connection string form described in §5.
