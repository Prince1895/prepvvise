# Technical Assessment Module — Work Log & 5-Module Implementation Idea

> Purpose: track Technical module work in small % steps, and explain how all 5 modules map to UI + backend + admin.
> Rule for this log: every real step updates `Progress`. If I hallucinate / block / guess, I must log it under `Hallucination / Blocker Log` with reason + fix, so you can see why time was spent.

## Progress: 35% (planning + backend rule + admin guard done, UI polish + verification left)

| Date (UTC) | % | What was done | Files touched | Status |
|---|---|---|---|---|
| 2026-09-20 | 10% | Audited repo (Next 16, Drizzle/Neon, Better-Auth, Groq->Gemini->offline, questions.kind+content+options). Wrote this worklog + 5-module idea + Technical strict-rule plan. | docs/technical-assessment-worklog.md (new) | DONE |
| 2026-09-20 | 35% | Backend Technical MCQ-only rule: TECHNICAL_TOPICS/RULES + validateTechnicalQuestion + getModuleQuestionRules; admin API enforces on create/bulk/update with clear 400; admin UI locks kind=mcq for technical sets + client pre-check (4 options, 1 correct, topic). tsc --noEmit passes. | lib/content/module-content.ts, app/api/admin/route.ts, app/admin/page.tsx | DONE |
| 2026-09-20 | -- | Next: admin panel Technical guard (lock kind, topic field, 4 options + exactly 1 correct) | app/admin/page.tsx | TODO |
| 2026-09-20 | -- | Next: Technical UI polish (topic chip, single-choice only, review) | app/page.tsx (TechnicalAssessment) | TODO |
| 2026-09-20 | -- | Next: verify tsc --noEmit + build + seed validation | -- | TODO |

> Update rule: never jump >20% in one edit. Each code change bumps % and adds a row above.

## Hallucination / Blocker Log (why time is spent)

| Date | What I guessed / got wrong | Why | Fix / extra time |
|---|---|---|---|
| 2026-09-20 | No hallucination yet — audit used real files. | -- | -- |

- If you see a row here, that step took longer because I guessed instead of reading code. Call it out.
## 1. The 5-module strict-rule idea (implement one by one)

Core principle already in this codebase — keep it, don't rebuild:

- assessment_modules.slug = identity (english, technical, debugging, coding, cognitive).
- practice_sets = sets inside a module (Set 01..20 + mock/daily).
- questions (prompt, kind, content:jsonb, explanation) + question_options = used ONLY by english, technical, cognitive.
- coding_problems (statement, starterCode, buggyCode, testCases, hidden tests never sent to client) = used ONLY by debugging, coding (AI coding).
- kind + content JSON is the per-module style gate. Backend validates it. Admin UI locks it. Frontend renders only that style.

Strict map you asked for:

| # | Module slug | Set style | Storage | kind allowed | Renderer | AI rule |
|---|---|---|---|---|---|---|
| 1 | english | SVAR-style: Listening / Speaking / Reading / Writing | questions + speaking_submissions | reading, listening, speaking, writing | Passage view / audio player (transcript hidden till submit) / mic recorder / rubric writing box | AI scores speaking/writing via Groq, never MCQ scoring |
| 2 | technical | MCQ only (this task) | questions + question_options (4 options, exactly 1 correct) | mcq only | Single-choice list + topic chip + timed attempt + review with correctOptionId only after submit | No AI coach inside attempt; AI analysis only after submit |
| 3 | debugging | DSA bug-fix problems | coding_problems with non-empty buggyCode | -- (no questions) | Buggy code viewer + editor + Run (visible tests) + Submit (visible+hidden) | AI assistance OFF |
| 4 | coding (AI coding) | DSA build-from-scratch + limited AI coach | coding_problems with starterCode, empty buggyCode | -- | Editor + AI coach panel (advice-only system prompt, blocks "write full code") | Groq prompt: hints/edge-cases/complexity only, refuse direct solution |
| 5 | cognitive | Motion / Grid / Logical / Behaviour challenges | questions | motion, grid, logic, behavioral | Motion tracker canvas / grid memory / pattern / scenario cards; grid allows multi-select, others single-choice | No AI coach |

One-by-one order (so UI/backend/admin never break together):

1. Technical (now) — smallest blast radius: only validation + admin lock + UI topic chip. No schema change.
2. English SVAR — add speaking to englishContentSchema, listening transcript-hiding, speaking mic API already exists (speaking_submissions).
3. Debugging — link coding_problems.practiceSetId to debugging sets, hide AI button when moduleSlug==='debugging'.
4. AI Coding advice-only guard — change lib/ai/groq.ts SYSTEM prompt + aiAssistSchema.request blocklist (write full code, give solution -> return hint instead).
5. Cognitive — four renderers switched on kind; scoring handles multi_select for grid.

Each module ships as: (a) backend validator -> (b) admin guard -> (c) frontend renderer -> (d) seed 2-3 sample sets -> (e) tsc + build + manual free/premium test.

## 2. Technical module — strict rules (what "MCQ only" means in code)

- questions.kind MUST be mcq. Anything else rejected with 400.
- questions.content MUST be { topic: string(non-empty), answerType: "single_choice" }. Topic from fixed list: AI Fundamentals, Generative AI, LLM Concepts, Prompt Engineering, Responsible AI, AI Applications, Workplace Situations, Technical Decision Making, etc.
- question_options MUST be exactly 4 rows, labels A,B,C,D, values non-empty unique, exactly 1 isCorrect=true.
- Answer payload MUST be { optionId: uuid }. Scoring = exact match on isCorrect option. isCorrect never sent in GET /api/sets/[setId]; only in scored result.review after submit.
- Timer authoritative: assessmentAttempts.startedAt/expiresAt, reject late saveAnswer/submit.
- Admin cannot create non-MCQ in a Technical set (backend 400 + UI lock). UI cannot render anything but single-choice.



## 3. Changes per layer (Technical, step by step)

Backend (lib/content/module-content.ts, app/api/admin/route.ts, lib/db/seed.ts):
- Add TECHNICAL_TOPICS, TECHNICAL_RULES, validateTechnicalQuestion(kind, content, options) + getModuleQuestionRules(slug).
- POST /api/admin (create-question, bulk-create-questions, update-question): lookup set->module slug; if technical, enforce MCQ-only, else 400 with clear message.
- seed.ts: keep validateModuleQuestionContent throw; starter technical questions already MCQ — no data migration needed.
- No DB migration (no schema change).

Admin panel (app/admin/page.tsx):
- When selected set's module is technical: kind field locked to mcq, content placeholder forces topic+single_choice, help shows "Technical: MCQ only - 4 options - exactly 1 correct".
- Client pre-check: block save if options !==4 or correctCount !==1, show message before POST.
- Non-technical modules unchanged.

UI (app/page.tsx -> TechnicalAssessment):
- Already backend-driven (set -> attempt -> answers -> submit -> review). Keep.
- Add: topic chip (content.topic), "Single choice - MCQ only" label, 4-option radio list, authoritative countdown from expiresAt, review shows correct/incorrect only after submit.
- No AI coach button inside Technical attempt. AI analysis only via post-submit POST /api/ai/analyze (already quota-guarded).

## 4. How to verify Technical (definition of done)
- [ ] Admin: create kind=listening in Technical set -> 400 "Technical module only allows kind=mcq".
- [ ] Admin: create MCQ with 3 options or 2 correct -> 400.
- [ ] Admin: create valid MCQ (4 options, 1 correct, topic) -> 200, appears in set.
- [ ] Student: GET technical set has no isCorrect.
- [ ] Student: full attempt -> submit -> score, topicBreakdown, review.correctOptionId correct.
- [ ] tsc --noEmit + build pass.
- [ ] Free user sees Sets 01-02, premium locked; premium sees all.

## 5. Next modules (not started — placeholders)
- English SVAR: backend speaking kind + transcript hiding + mic upload; admin speaking-form; UI recorder.
- Debugging: coding_problems linked to debugging sets; UI bug-view + run/submit; admin buggyCode+tests form; AI off.
- AI Coding: advice-only SYSTEM prompt + refusal for "write code for me"; UI coach panel with quota display.
- Cognitive: motion/grid/logic/behavioral renderers + multi_select scoring for grid; admin challenge-type picker.

---
_Maintained by agent. Update % + Hallucination log on every step. Do not delete old rows._
