# PrepWise Backend Plan

## Phase 0 audit

PrepWise is currently a Next.js 16 App Router frontend prototype. The main application is implemented in `app/page.tsx` as a large client component. Assessment content, user identity, premium state, scores, attempts, and countdown timers are currently demo state in the browser.

Current backend surface:

- No `app/api` route handlers or server actions.
- No database, Drizzle schema, migrations, or database client.
- No Clerk integration or server-side user synchronization.
- No Zod validation layer.
- No Razorpay or Gemini integration.
- No environment template. Local environment files are ignored by `.gitignore`.
- `lib/utils.ts` contains only the existing UI class-name helper.

Existing constraints and conventions:

- Next.js App Router with TypeScript strict mode.
- Path alias `@/*` maps to the repository root.
- Package manager is declared as `pnpm@12.3.4`.
- The UI is intentionally contained in the existing `app/page.tsx` and `app/globals.css`; backend work should be additive and should not replace that surface.
- `next.config.mjs` currently ignores TypeScript build errors. This should be revisited during production-readiness work, but is outside Phase 0.

## Target architecture

Use the same Next.js repository as a modular monolith:

```text
Browser UI
  -> Next.js Route Handlers / Server Actions
      -> authentication and authorization helpers
      -> Zod request validation
      -> domain services
      -> Drizzle ORM
      -> Neon PostgreSQL
      -> external adapters (Clerk, Razorpay, Gemini)
```

Suggested backend directories:

- `app/api/**/route.ts`: thin HTTP handlers.
- `lib/db/`: Drizzle client, schema, migrations configuration, and transaction helpers.
- `lib/auth/`: Clerk-derived current-user helpers and authorization checks.
- `lib/validation/`: shared Zod schemas for route inputs.
- `lib/services/`: module, practice, attempt, scoring, entitlement, payment, and AI orchestration services.
- `lib/integrations/`: Razorpay and Gemini adapters with provider-specific code isolated from domain logic.
- `drizzle/`: generated SQL migrations.
- `.env.example`: documented variable names only, with no credentials.

Server authority rules:

- Derive the authenticated user from Clerk; never accept a client user ID as identity.
- Load premium entitlement from Neon PostgreSQL; never trust a client premium flag.
- Load question/set ownership and access from Neon PostgreSQL; never trust client scores, payment state, or attempt ownership.
- Store attempt `startedAt`, `expiresAt`, and `submittedAt` on the server. Reject writes after expiry and make submission idempotent.
- Validate all external input with Zod before service calls.
- Verify Razorpay webhook signatures and reconcile payment state from provider events.
- Keep Gemini calls server-side and apply rate limits, authorization, and input-size limits.

## V0 backend requirements reference

The following requirements were supplied by the V0 implementation report and are retained as the target contract for later phases.

### Authentication

- Use Clerk for the frontend provider, sign-in/sign-up UI, protected dashboard and assessment routes, middleware, and server-side `auth()` / `currentUser()` checks.
- Synchronize Clerk `user.created`, `user.updated`, and `user.deleted` events through a signed webhook or synchronization endpoint.
- Store an internal user record with `clerkUserId`, name, email, role, plan, and timestamps.
- Every user-owned query must be scoped by the authenticated Clerk user ID.

### Required API surface

```text
GET    /api/me
GET    /api/modules
GET    /api/modules/:moduleId/sets
GET    /api/sets/:setId
POST   /api/attempts
POST   /api/attempts/:attemptId/answers
POST   /api/attempts/:attemptId/submit
GET    /api/progress
POST   /api/payments/create-order
POST   /api/payments/verify
POST   /api/webhooks/clerk
POST   /api/webhooks/razorpay
POST   /api/ai/assist
```

Route handlers remain thin: authenticate, validate with Zod, call an authorized service, and return a stable response. Attempt IDs, set IDs, payment IDs, and other route parameters must be checked against the authenticated user's ownership or the relevant public catalog record.

### Payments and Premium

Use Razorpay Checkout with server-side validation and reconciliation:

- Validate the configured amount (`5900` paise), currency, order ID, payment ID, and signature.
- Persist orders, payment status, webhook events, and reconciliation metadata.
- Grant the single global PrepWise Premium entitlement only after verified payment or verified webhook confirmation.
- Make verification and webhook processing idempotent so retries cannot grant access twice.
- Model success, failed, cancelled, refunded, and disputed payment states.
- Keep `RAZORPAY_KEY_SECRET` and webhook secrets server-only.
  -> Neon PostgreSQL
### Security and auditability

- Validate every request with Zod or equivalent server-side validation.
- Never trust client-provided user IDs, scores, prices, premium flags, payment status, or attempt ownership.
- Recalculate scores and result summaries on the server.
- Add rate limiting to authentication-related, payment, submission, and AI endpoints.
- Verify Clerk and Razorpay webhook signatures before parsing or applying events.
- Add audit records for payments, premium access changes, and assessment submissions.
- Configure CORS and security headers for the deployed application.

### AI and code execution

- Keep Gemini credentials and calls on the server behind an authorized route such as `POST /api/ai/assist`.
- Send only the problem, current code, selected context, and relevant test output to the model.
- Track per-user AI usage and tokens in `ai_usage`, with enforceable limits.
- Execute submitted code in an isolated execution service or container, never inside the Next.js process.
- Apply CPU, memory, execution-time, and network restrictions.
- Store coding submissions and test results separately from official assessment scores.

### Required environment documentation

The eventual `.env.example` must document variable names only, including:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
DATABASE_URL=
GEMINI_API_KEY=
```

The Gemini variable is included for the later AI phases; it must not be added to client-exposed configuration.

## Planned data model

The exact columns will be finalized in Phase 1, but the ownership boundaries are:

- `users`: internal user record keyed to a unique Clerk user ID, with role, plan, and timestamps.
- `assessment_modules`: English, Technical, Debugging, AI Coding, and Cognitive.
- `practice_sets`: 20 sets per module, with free/premium access and focused/mixed classification.
- `questions`: module-specific question metadata and versioned content references.
- `assessment_attempts`: user, set/module, status, server timestamps, timer data, and final score summary.
- `attempt_answers`: attempt-owned responses, with module-specific answer payloads and timestamps.
- `coding_submissions`: source, language, execution status, and isolated test-run references, separate from official scores.
- `user_progress`: durable progress, history, and best-score aggregates.
- `subscriptions`: one global PrepWise Premium subscription independent of module.
- `payments`: Razorpay orders, payments, lifecycle status, and reconciliation metadata.
- `ai_usage`: per-user request, token, and usage-limit accounting.
- `question_options` and execution/test metadata: supporting records for MCQ, debugging, and coding content.
- `webhook_events` and audit records: signature-verified idempotency and security-relevant history.

Use foreign keys, unique constraints, indexes for user/attempt lookups, and enums or constrained text values for lifecycle states. Monetary values should be stored as integer paise, so the ₹59 price is represented as `5900` and never as a floating-point value.

## Phase sequence and boundaries

1. **Phase 0:** repository audit and this plan. No runtime behavior changes.
2. **Phase 1:** install only the required database foundation, add Drizzle configuration/client/schema foundation, migrations setup, `.env.example`, and a documented database connection check. No Clerk, payments, Gemini, or UI integration.
3. **Phase 2:** Clerk middleware/server helpers and safe user upsert synchronization.
4. **Phase 3:** module, practice-set, question, and access metadata APIs/services.
5. **Phase 4:** attempt lifecycle, server-authoritative timers, answers, expiry, and idempotent submission.
6. **Phase 5:** scoring, progress aggregation, and attempt history.
7. **Phase 6:** Razorpay order creation, verified webhooks, subscription state, and global entitlement checks.
8. **Phase 7:** English, Technical, and Cognitive content/assessment integration.
9. **Phase 8:** isolated code execution boundary for Debugging submissions.
10. **Phase 9:** AI Coding workspace persistence, Gemini adapter, and structured prompting.
11. **Phase 10:** AI analysis and recommendation generation with durable, authorized records.
12. **Phase 11:** incremental frontend integration, replacing demo state one workflow at a time.
13. **Phase 12:** security review, integration tests, rate limits, observability, deployment checks, and removal of unsafe build/typecheck exceptions.

## Phase 1 implementation plan

When explicitly requested, Phase 1 should:

1. Confirm the Neon pooled connection strategy and deployment runtime.
2. Add the minimum Drizzle/Neon packages and scripts using the repository package manager.
3. Add `lib/db/client.ts` with server-only database access.
4. Add the initial schema foundation for users, modules, practice sets, questions, attempts, answers, entitlements, payments, and webhook idempotency.
5. Add Drizzle migration configuration and generate the initial migration without inserting production data.
6. Add `.env.example` with a non-secret `DATABASE_URL` placeholder and any required Drizzle configuration.
7. Run the available type/build checks and a database-independent schema/configuration verification.

Phase 1 must not add Clerk routes, payment endpoints, Gemini calls, code execution, client-side API wiring, or UI redesign.

## Verification strategy

Every phase should run the narrowest relevant checks first, then the available project build. The current repository has `build`, `dev`, and `start` scripts only. The declared package manager is not currently available in the audit environment, so dependency installation and package-based checks must be performed once `pnpm` is available. No secrets should be committed; local values belong in an ignored `.env.local` file based on `.gitignore`.