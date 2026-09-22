# Prepwise prompt.md Implementation Plan (additive, no regressions)

Goal: hardcoded demo -> dynamic production platform. Reuse UI/architecture.
Keys present: GROQ, OnlineCompiler. Google OAuth optional later.

## 0. Audited ground truth (2026-09-19)
- Next 16 App Router. `app/page.tsx` monolith UI, `app/admin/page.tsx` catalog/users/offers.
- Auth: Better-Auth email+Google, auto-provision in current-user.ts.
- DB Neon/Drizzle: users, modules (english/technical/cognitive), learning_sections,
  practice_sets (first2 free), questions/options, attempts/answers, progress,
  subscriptions/payments Razorpay 5900, ai_usage/analyses, coding_submissions.
- APIs: me, modules, sets, attempts(+history), answers/submit/submissions,
  progress, ai/assist+analyze, payments, admin(ADMIN_SECRET_KEY).
- AI now Gemini-only. Must become GROQ primary.
- Gaps: no debugging/ai_coding modules, no mocks/daily tables, no attempt_limit
  NULL=unlimited policy, no plans quota table, hardcoded stages/activity/scores,
  CSP microphone=() blocks speaking.

## Phases
### Phase 1 - Groq primary + fallback (no schema change)
- lib/ai/groq.ts + provider.ts (GROQ -> Gemini -> offline fallback).
- services/ai.ts + analysis.ts use router. Keep limits + ai_usage.
- .env.example documents GROQ_MODEL + ADMIN_SECRET_KEY.

### Phase 2 - Access model (NULL=unlimited)
- subscription_plans (free 2/2, premium NULL/NULL), practice_sets.attempt_limit NULL,
  status/difficulty/category. entitlements.ts canAccess/remainingAttempts.
- Admin: Free/Premium + Unlimited/Limited+X. Never 999999.

### Phase 3 - 5 modules + English L/S/R/W purity
- Seed debugging + ai_coding. English retagged listening/speaking/reading/writing.
- Extend content schemas. New GET /api/question-bank.

### Phase 4 - Mocks/Daily/History/Dashboard (server timers authoritative)
- mock_assessments + daily_assessments. POST /api/attempts accepts set|mock|daily.
- GET /api/dashboard, /api/performance/:id, history from DB. Hooks replace hardcoded
  stages/activity/scores, same CSS.

### Phase 5 - Speaking mic + Listening audio + Writing rubric
- Listening hides transcript until submit. Speaking MediaRecorder ->
  speaking_submissions + Groq feedback. Writing Groq-scored.

### Phase 6 - Debugging/Coding hardening
- langs c,cpp,java,python,javascript. coding_problems + 10 seeds.
- execution client normalizes onlinecompiler.io, 8s timeout, no token leak.

### Phase 7 - AI Coach + analysis quotas via plans.
### Phase 8 - Admin plans/mocks UI + verify (generate/migrate/seed/tsc).

Need from you later: GOOGLE_CLIENT_ID/SECRET only for Google login;
RAZORPAY_WEBHOOK_SECRET only for live webhooks. Nothing else.

Order now: 1) Groq router 2) entitlements+plans 3) debugging/ai_coding seeds
4) dashboard/history/performance APIs + frontend hook swap.
