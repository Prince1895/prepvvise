import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const userRole = pgEnum('user_role', ['student', 'admin'])
export const userPlan = pgEnum('user_plan', ['free', 'premium'])
export const practiceSetAccess = pgEnum('practice_set_access', ['free', 'premium'])
export const practiceSetType = pgEnum('practice_set_type', ['focused', 'mixed', 'mock', 'daily'])
export const practiceSetStatus = pgEnum('practice_set_status', ['draft', 'published'])
export const attemptStatus = pgEnum('attempt_status', ['in_progress', 'submitted', 'expired'])
export const subscriptionStatus = pgEnum('subscription_status', ['created', 'active', 'cancelled', 'paused', 'expired'])
export const paymentStatus = pgEnum('payment_status', ['created', 'authorized', 'captured', 'failed', 'cancelled', 'refunded', 'disputed'])
export const codingSubmissionStatus = pgEnum('coding_submission_status', ['queued', 'running', 'passed', 'failed', 'error', 'timed_out'])
export const speakingSubmissionStatus = pgEnum('speaking_submission_status', ['recorded', 'analyzed', 'error'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull(),
  name: text('name'),
  email: text('email'),
  role: userRole('role').default('student').notNull(),
  plan: userPlan('plan').default('free').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('users_clerk_user_id_idx').on(table.clerkUserId),
  index('users_email_idx').on(table.email),
])

export const assessmentModules = pgTable('assessment_modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(20).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('assessment_modules_slug_idx').on(table.slug),
])

export const moduleLearningSections = pgTable('module_learning_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => assessmentModules.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  structuredContent: jsonb('structured_content').$type<Record<string, unknown>>().default({}).notNull(),
  durationMinutes: integer('duration_minutes').default(8).notNull(),
  access: practiceSetAccess('access').default('free').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('module_learning_sections_module_position_idx').on(table.moduleId, table.position),
  index('module_learning_sections_module_id_idx').on(table.moduleId),
])

export const practiceSets = pgTable('practice_sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => assessmentModules.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  name: text('name').notNull(),
  access: practiceSetAccess('access').default('free').notNull(),
  type: practiceSetType('type').notNull(),
  // Attempt policy: NULL means unlimited. Never encode unlimited as a huge number.
  attemptLimit: integer('attempt_limit'),
  status: practiceSetStatus('status').default('published').notNull(),
  category: text('category'),
  difficulty: text('difficulty'),
  // Per-set duration override; NULL falls back to the module duration.
  durationMinutes: integer('duration_minutes'),
  totalMarks: integer('total_marks'),
  // Daily assessments: the calendar day this set is offered (type = 'daily').
  availableDate: date('available_date'),
  ...timestamps,
}, (table) => [
  uniqueIndex('practice_sets_module_number_idx').on(table.moduleId, table.setNumber),
  index('practice_sets_module_id_idx').on(table.moduleId),
  index('practice_sets_type_idx').on(table.type),
  index('practice_sets_available_date_idx').on(table.availableDate),
])

// Admin-configurable plan quotas. NULL limits mean unlimited access.
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: userPlan('slug').notNull(),
  displayName: text('display_name').notNull(),
  practiceSetAccessLimit: integer('practice_set_access_limit'),
  mockAccessLimit: integer('mock_access_limit'),
  dailyAccessLimit: integer('daily_access_limit'),
  unlimitedAttempts: boolean('unlimited_attempts').default(false).notNull(),
  aiAnalysis: boolean('ai_analysis').default(false).notNull(),
  aiAnalysisDailyLimit: integer('ai_analysis_daily_limit'),
  aiCoachDailyLimit: integer('ai_coach_daily_limit'),
  pricePaise: integer('price_paise').default(0).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('subscription_plans_slug_idx').on(table.slug),
])

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  practiceSetId: uuid('practice_set_id').notNull().references(() => practiceSets.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  prompt: text('prompt').notNull(),
  kind: text('kind').notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().default({}).notNull(),
  explanation: text('explanation'),
  ...timestamps,
}, (table) => [
  uniqueIndex('questions_set_position_idx').on(table.practiceSetId, table.position),
  index('questions_practice_set_id_idx').on(table.practiceSetId),
])

export const questionOptions = pgTable('question_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  isCorrect: boolean('is_correct').default(false).notNull(),
}, (table) => [
  uniqueIndex('question_options_question_position_idx').on(table.questionId, table.position),
  index('question_options_question_id_idx').on(table.questionId),
])

export const assessmentAttempts = pgTable('assessment_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  practiceSetId: uuid('practice_set_id').notNull().references(() => practiceSets.id),
  status: attemptStatus('status').default('in_progress').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  score: integer('score'),
  result: jsonb('result').$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  index('assessment_attempts_user_id_idx').on(table.userId),
  index('assessment_attempts_practice_set_id_idx').on(table.practiceSetId),
  index('assessment_attempts_user_status_idx').on(table.userId, table.status),
])

export const attemptAnswers = pgTable('attempt_answers', {
  attemptId: uuid('attempt_id').notNull().references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id),
  answer: jsonb('answer').$type<Record<string, unknown>>().notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.attemptId, table.questionId] }),
  index('attempt_answers_question_id_idx').on(table.questionId),
])

export const codingSubmissions = pgTable('coding_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id').notNull().references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  sourceCode: text('source_code').notNull(),
  status: codingSubmissionStatus('status').default('queued').notNull(),
  providerJobId: text('provider_job_id'),
  testResult: jsonb('test_result').$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  uniqueIndex('coding_submissions_provider_job_id_idx').on(table.providerJobId),
  index('coding_submissions_attempt_id_idx').on(table.attemptId),
  index('coding_submissions_user_id_idx').on(table.userId),
])

export const userProgress = pgTable('user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => assessmentModules.id, { onDelete: 'cascade' }),
  attemptsCount: integer('attempts_count').default(0).notNull(),
  bestScore: integer('best_score'),
  completedSets: integer('completed_sets').default(0).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('user_progress_user_module_idx').on(table.userId, table.moduleId),
  index('user_progress_user_id_idx').on(table.userId),
])

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerSubscriptionId: text('provider_subscription_id'),
  status: subscriptionStatus('status').default('created').notNull(),
  currentPeriodEndsAt: timestamp('current_period_ends_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex('subscriptions_provider_id_idx').on(table.provider, table.providerSubscriptionId),
  index('subscriptions_user_id_idx').on(table.userId),
])

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  provider: text('provider').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  providerOrderId: text('provider_order_id'),
  providerPaymentId: text('provider_payment_id'),
  amountPaise: integer('amount_paise').notNull(),
  currency: text('currency').notNull(),
  status: paymentStatus('status').default('created').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('payments_idempotency_key_idx').on(table.idempotencyKey),
  uniqueIndex('payments_provider_order_id_idx').on(table.provider, table.providerOrderId),
  uniqueIndex('payments_provider_payment_id_idx').on(table.provider, table.providerPaymentId),
  index('payments_user_id_idx').on(table.userId),
])

export const aiUsage = pgTable('ai_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feature: text('feature').notNull(),
  requestCount: integer('request_count').default(0).notNull(),
  inputTokens: integer('input_tokens').default(0).notNull(),
  outputTokens: integer('output_tokens').default(0).notNull(),
  usageDate: timestamp('usage_date', { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('ai_usage_user_feature_date_idx').on(table.userId, table.feature, table.usageDate),
  index('ai_usage_user_id_idx').on(table.userId),
])

export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  attemptId: uuid('attempt_id').notNull().references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
  feature: text('feature').notNull(),
  summary: text('summary').notNull(),
  strengths: jsonb('strengths').$type<string[]>().default([]).notNull(),
  focusAreas: jsonb('focus_areas').$type<string[]>().default([]).notNull(),
  recommendations: jsonb('recommendations').$type<string[]>().default([]).notNull(),
  inputTokens: integer('input_tokens').default(0).notNull(),
  outputTokens: integer('output_tokens').default(0).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('ai_analyses_attempt_feature_idx').on(table.attemptId, table.feature),
  index('ai_analyses_user_id_idx').on(table.userId),
])

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex('webhook_events_provider_event_id_idx').on(table.provider, table.eventId),
])

export const adminOffers = pgTable('admin_offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  amountPaise: integer('amount_paise').notNull(),
  currency: text('currency').default('INR').notNull(),
  active: boolean('active').default(true).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index('admin_offers_active_idx').on(table.active),
])

// Typing practice results. WPM/accuracy are recomputed server-side from the
// submitted key counts so clients cannot inflate their scores.
export const typingResults = pgTable('typing_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => assessmentModules.id, { onDelete: 'set null' }),
  durationSeconds: integer('duration_seconds').notNull(),
  typedCharacters: integer('typed_characters').notNull(),
  correctCharacters: integer('correct_characters').notNull(),
  wpm: integer('wpm').notNull(),
  accuracy: integer('accuracy').notNull(),
  ...timestamps,
}, (table) => [
  index('typing_results_user_id_idx').on(table.userId),
  index('typing_results_wpm_idx').on(table.wpm),
])

// Speaking practice: user-recorded audio for a speaking question, with
// server-side feedback. audioDataUrl keeps recording inline (data: URL).
export const speakingSubmissions = pgTable('speaking_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  attemptId: uuid('attempt_id').references(() => assessmentAttempts.id, { onDelete: 'set null' }),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'set null' }),
  prompt: text('prompt').notNull(),
  audioDataUrl: text('audio_data_url'),
  audioMimeType: text('audio_mime_type'),
  durationSeconds: integer('duration_seconds').default(0).notNull(),
  transcript: text('transcript'),
  status: speakingSubmissionStatus('status').default('recorded').notNull(),
  feedback: jsonb('feedback').$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  index('speaking_submissions_user_id_idx').on(table.userId),
  index('speaking_submissions_attempt_id_idx').on(table.attemptId),
])

// Coding problem bank used by Debugging and AI-Assisted Coding modules.
// testCases: [{ name, stdin, expectedOutput, hidden }] — execution happens
// through the isolated runner; expected outputs are never sent to the client.
export const codingProblems = pgTable('coding_problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').references(() => assessmentModules.id, { onDelete: 'set null' }),
  practiceSetId: uuid('practice_set_id').references(() => practiceSets.id, { onDelete: 'set null' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  statement: text('statement').notNull(),
  difficulty: text('difficulty').default('medium').notNull(),
  languages: jsonb('languages').$type<string[]>().default([]).notNull(),
  starterCode: jsonb('starter_code').$type<Record<string, string>>().default({}).notNull(),
  buggyCode: jsonb('buggy_code').$type<Record<string, string>>().default({}).notNull(),
  testCases: jsonb('test_cases').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  explanation: text('explanation'),
  position: integer('position').default(1).notNull(),
  marks: integer('marks').default(10).notNull(),
  topic: text('topic'),
  ...timestamps,
}, (table) => [
  uniqueIndex('coding_problems_slug_idx').on(table.slug),
  index('coding_problems_practice_set_id_idx').on(table.practiceSetId),
  index('coding_problems_module_id_idx').on(table.moduleId),
])