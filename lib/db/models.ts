import mongoose, { Schema, Document, Model } from 'mongoose'
import { randomUUID } from 'node:crypto'

function generateUUID() {
  return randomUUID()
}

// 1. User Schema
export interface IUser extends Document {
  id: string
  clerkUserId: string
  name?: string | null
  email?: string | null
  role: 'student' | 'admin'
  plan: 'free' | 'premium'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String as any, default: generateUUID },
    clerkUserId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: null },
    email: { type: String, default: null, index: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

UserSchema.virtual('id').get(function () {
  return this._id
})

// 2. Assessment Module Schema
export interface IAssessmentModule extends Document {
  id: string
  slug: string
  name: string
  description?: string | null
  durationMinutes: number
  createdAt: Date
  updatedAt: Date
}

const AssessmentModuleSchema = new Schema<IAssessmentModule>(
  {
    _id: { type: String as any, default: generateUUID },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    durationMinutes: { type: Number, default: 20 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

AssessmentModuleSchema.virtual('id').get(function () {
  return this._id
})

// 3. Module Learning Section Schema
export interface IModuleLearningSection extends Document {
  id: string
  moduleId: string
  position: number
  title: string
  summary: string
  content: string
  structuredContent: Record<string, unknown>
  durationMinutes: number
  access: 'free' | 'premium'
  createdAt: Date
  updatedAt: Date
}

const ModuleLearningSectionSchema = new Schema<IModuleLearningSection>(
  {
    _id: { type: String as any, default: generateUUID },
    moduleId: { type: String, required: true, index: true },
    position: { type: Number, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    structuredContent: { type: Schema.Types.Mixed, default: {} },
    durationMinutes: { type: Number, default: 8 },
    access: { type: String, enum: ['free', 'premium'], default: 'free' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

ModuleLearningSectionSchema.virtual('id').get(function () {
  return this._id
})

// 4. Practice Set Schema
export interface IPracticeSet extends Document {
  id: string
  moduleId: string
  setNumber: number
  name: string
  access: 'free' | 'premium'
  type: 'focused' | 'mixed' | 'mock' | 'daily'
  attemptLimit?: number | null
  status: 'draft' | 'published'
  category?: string | null
  difficulty?: string | null
  durationMinutes?: number | null
  totalMarks?: number | null
  availableDate?: string | null
  createdAt: Date
  updatedAt: Date
}

const PracticeSetSchema = new Schema<IPracticeSet>(
  {
    _id: { type: String as any, default: generateUUID },
    moduleId: { type: String, required: true, index: true },
    setNumber: { type: Number, required: true },
    name: { type: String, required: true },
    access: { type: String, enum: ['free', 'premium'], default: 'free' },
    type: { type: String, enum: ['focused', 'mixed', 'mock', 'daily'], required: true, index: true },
    attemptLimit: { type: Number, default: null },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    category: { type: String, default: null },
    difficulty: { type: String, default: null },
    durationMinutes: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    availableDate: { type: String, default: null, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

PracticeSetSchema.virtual('id').get(function () {
  return this._id
})

// 5. Subscription Plan Schema
export interface ISubscriptionPlan extends Document {
  id: string
  slug: 'free' | 'premium'
  displayName: string
  practiceSetAccessLimit?: number | null
  mockAccessLimit?: number | null
  dailyAccessLimit?: number | null
  unlimitedAttempts: boolean
  aiAnalysis: boolean
  aiAnalysisDailyLimit?: number | null
  aiCoachDailyLimit?: number | null
  pricePaise: number
  createdAt: Date
  updatedAt: Date
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    _id: { type: String as any, default: generateUUID },
    slug: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    practiceSetAccessLimit: { type: Number, default: null },
    mockAccessLimit: { type: Number, default: null },
    dailyAccessLimit: { type: Number, default: null },
    unlimitedAttempts: { type: Boolean, default: false },
    aiAnalysis: { type: Boolean, default: false },
    aiAnalysisDailyLimit: { type: Number, default: null },
    aiCoachDailyLimit: { type: Number, default: null },
    pricePaise: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

SubscriptionPlanSchema.virtual('id').get(function () {
  return this._id
})

// 6. Question Schema
export interface IQuestion extends Document {
  id: string
  practiceSetId: string
  position: number
  prompt: string
  kind: string
  content: Record<string, unknown>
  explanation?: string | null
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema<IQuestion>(
  {
    _id: { type: String as any, default: generateUUID },
    practiceSetId: { type: String, required: true, index: true },
    position: { type: Number, required: true },
    prompt: { type: String, required: true },
    kind: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    explanation: { type: String, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

QuestionSchema.virtual('id').get(function () {
  return this._id
})

// 7. Question Option Schema
export interface IQuestionOption extends Document {
  id: string
  questionId: string
  position: number
  label: string
  value: string
  isCorrect: boolean
}

const QuestionOptionSchema = new Schema<IQuestionOption>(
  {
    _id: { type: String as any, default: generateUUID },
    questionId: { type: String, required: true, index: true },
    position: { type: Number, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

QuestionOptionSchema.virtual('id').get(function () {
  return this._id
})

// 8. Assessment Attempt Schema
export interface IAssessmentAttempt extends Document {
  id: string
  userId: string
  practiceSetId: string
  status: 'in_progress' | 'submitted' | 'expired'
  startedAt: Date
  expiresAt: Date
  submittedAt?: Date | null
  score?: number | null
  result?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    practiceSetId: { type: String, required: true, index: true },
    status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress', index: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    score: { type: Number, default: null },
    result: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

AssessmentAttemptSchema.virtual('id').get(function () {
  return this._id
})

// 9. Attempt Answer Schema
export interface IAttemptAnswer extends Document {
  attemptId: string
  questionId: string
  answer: Record<string, unknown>
  answeredAt: Date
  createdAt: Date
  updatedAt: Date
}

const AttemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    _id: { type: String as any, default: generateUUID },
    attemptId: { type: String, required: true, index: true },
    questionId: { type: String, required: true, index: true },
    answer: { type: Schema.Types.Mixed, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

AttemptAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true })

// 10. Coding Submission Schema
export interface ICodingSubmission extends Document {
  id: string
  attemptId: string
  userId: string
  language: string
  sourceCode: string
  status: 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'timed_out'
  providerJobId?: string | null
  testResult?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

const CodingSubmissionSchema = new Schema<ICodingSubmission>(
  {
    _id: { type: String as any, default: generateUUID },
    attemptId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    status: { type: String, enum: ['queued', 'running', 'passed', 'failed', 'error', 'timed_out'], default: 'queued' },
    providerJobId: { type: String, default: null, index: true },
    testResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

CodingSubmissionSchema.virtual('id').get(function () {
  return this._id
})

// 11. User Progress Schema
export interface IUserProgress extends Document {
  id: string
  userId: string
  moduleId: string
  attemptsCount: number
  bestScore?: number | null
  completedSets: number
  createdAt: Date
  updatedAt: Date
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    moduleId: { type: String, required: true, index: true },
    attemptsCount: { type: Number, default: 0 },
    bestScore: { type: Number, default: null },
    completedSets: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

UserProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true })
UserProgressSchema.virtual('id').get(function () {
  return this._id
})

// 12. Subscription Schema
export interface ISubscription extends Document {
  id: string
  userId: string
  provider: string
  providerSubscriptionId?: string | null
  status: 'created' | 'active' | 'cancelled' | 'paused' | 'expired'
  currentPeriodEndsAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    providerSubscriptionId: { type: String, default: null, index: true },
    status: { type: String, enum: ['created', 'active', 'cancelled', 'paused', 'expired'], default: 'created' },
    currentPeriodEndsAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

SubscriptionSchema.virtual('id').get(function () {
  return this._id
})

// 13. Payment Schema
export interface IPayment extends Document {
  id: string
  userId: string
  subscriptionId?: string | null
  provider: string
  idempotencyKey: string
  providerOrderId?: string | null
  providerPaymentId?: string | null
  amountPaise: number
  currency: string
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded' | 'disputed'
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    subscriptionId: { type: String, default: null },
    provider: { type: String, required: true },
    idempotencyKey: { type: String, required: true, unique: true },
    providerOrderId: { type: String, default: null, index: true },
    providerPaymentId: { type: String, default: null, index: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'cancelled', 'refunded', 'disputed'], default: 'created' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

PaymentSchema.virtual('id').get(function () {
  return this._id
})

// 14. AI Usage Schema
export interface IAIUsage extends Document {
  id: string
  userId: string
  feature: string
  questionId?: string | null
  provider?: string | null
  turnsUsed: number
  requestCount: number
  inputTokens: number
  outputTokens: number
  usageDate: Date
  createdAt: Date
  updatedAt: Date
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    feature: { type: String, required: true },
    questionId: { type: String, default: null, index: true },
    provider: { type: String, default: 'groq' },
    turnsUsed: { type: Number, default: 0 },
    requestCount: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    usageDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

AIUsageSchema.virtual('id').get(function () {
  return this._id
})

// 15. AI Analysis Schema
export interface IAIAnalysis extends Document {
  id: string
  userId: string
  attemptId: string
  feature: string
  summary: string
  strengths: string[]
  focusAreas: string[]
  recommendations: string[]
  inputTokens: number
  outputTokens: number
  createdAt: Date
  updatedAt: Date
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    attemptId: { type: String, required: true, index: true },
    feature: { type: String, required: true },
    summary: { type: String, required: true },
    strengths: { type: [String], default: [] },
    focusAreas: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

AIAnalysisSchema.virtual('id').get(function () {
  return this._id
})

// 16. Webhook Event Schema
export interface IWebhookEvent extends Document {
  id: string
  provider: string
  eventId: string
  eventType: string
  payload: Record<string, unknown>
  processedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    _id: { type: String as any, default: generateUUID },
    provider: { type: String, required: true },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true })
WebhookEventSchema.virtual('id').get(function () {
  return this._id
})

// 17. Admin Offer Schema
export interface IAdminOffer extends Document {
  id: string
  name: string
  description?: string | null
  amountPaise: number
  currency: string
  active: boolean
  startsAt?: Date | null
  endsAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const AdminOfferSchema = new Schema<IAdminOffer>(
  {
    _id: { type: String as any, default: generateUUID },
    name: { type: String, required: true },
    description: { type: String, default: null },
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    active: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

AdminOfferSchema.virtual('id').get(function () {
  return this._id
})

// 18. Typing Result Schema
export interface ITypingResult extends Document {
  id: string
  userId: string
  moduleId?: string | null
  durationSeconds: number
  typedCharacters: number
  correctCharacters: number
  wpm: number
  accuracy: number
  createdAt: Date
  updatedAt: Date
}

const TypingResultSchema = new Schema<ITypingResult>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    moduleId: { type: String, default: null },
    durationSeconds: { type: Number, required: true },
    typedCharacters: { type: Number, required: true },
    correctCharacters: { type: Number, required: true },
    wpm: { type: Number, required: true, index: true },
    accuracy: { type: Number, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

TypingResultSchema.virtual('id').get(function () {
  return this._id
})

// 19. Speaking Submission Schema
export interface ISpeakingSubmission extends Document {
  id: string
  userId: string
  attemptId?: string | null
  questionId?: string | null
  prompt: string
  audioDataUrl?: string | null
  audioMimeType?: string | null
  durationSeconds: number
  transcript?: string | null
  status: 'recorded' | 'analyzed' | 'error'
  feedback?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

const SpeakingSubmissionSchema = new Schema<ISpeakingSubmission>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    attemptId: { type: String, default: null, index: true },
    questionId: { type: String, default: null },
    prompt: { type: String, required: true },
    audioDataUrl: { type: String, default: null },
    audioMimeType: { type: String, default: null },
    durationSeconds: { type: Number, default: 0 },
    transcript: { type: String, default: null },
    status: { type: String, enum: ['recorded', 'analyzed', 'error'], default: 'recorded' },
    feedback: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

SpeakingSubmissionSchema.virtual('id').get(function () {
  return this._id
})

// 20. Coding Problem Schema
export interface ICodingProblem extends Document {
  id: string
  moduleId?: string | null
  practiceSetId?: string | null
  slug: string
  title: string
  statement: string
  difficulty: string
  languages: string[]
  starterCode: Record<string, string>
  buggyCode: Record<string, string>
  testCases: Array<Record<string, unknown>>
  explanation?: string | null
  position: number
  marks: number
  topic?: string | null
  functionSignature?: string | null
  constraints?: string | null
  aiConfig?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

const CodingProblemSchema = new Schema<ICodingProblem>(
  {
    _id: { type: String as any, default: generateUUID },
    moduleId: { type: String, default: null, index: true },
    practiceSetId: { type: String, default: null, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    statement: { type: String, required: true },
    difficulty: { type: String, default: 'medium' },
    languages: { type: [String], default: [] },
    starterCode: { type: Schema.Types.Mixed, default: {} },
    buggyCode: { type: Schema.Types.Mixed, default: {} },
    testCases: { type: [Schema.Types.Mixed] as any, default: [] },
    explanation: { type: String, default: null },
    position: { type: Number, default: 1 },
    marks: { type: Number, default: 10 },
    topic: { type: String, default: null },
    functionSignature: { type: String, default: null },
    constraints: { type: String, default: null },
    aiConfig: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

CodingProblemSchema.virtual('id').get(function () {
  return this._id
})

// 21. Writing Submission Schema
export interface IWritingSubmission extends Document {
  id: string
  userId: string
  attemptId?: string | null
  practiceSetId: string
  essayResponse: string
  articleResponse: string
  essayWordCount: number
  articleWordCount: number
  status: 'submitted' | 'evaluated' | 'error'
  evaluation?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

const WritingSubmissionSchema = new Schema<IWritingSubmission>(
  {
    _id: { type: String as any, default: generateUUID },
    userId: { type: String, required: true, index: true },
    attemptId: { type: String, default: null, index: true },
    practiceSetId: { type: String, required: true, index: true },
    essayResponse: { type: String, default: '' },
    articleResponse: { type: String, default: '' },
    essayWordCount: { type: Number, default: 0 },
    articleWordCount: { type: Number, default: 0 },
    status: { type: String, enum: ['submitted', 'evaluated', 'error'], default: 'submitted' },
    evaluation: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

WritingSubmissionSchema.virtual('id').get(function () {
  return this._id
})

// Model Exports
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const AssessmentModule: Model<IAssessmentModule> = mongoose.models.AssessmentModule || mongoose.model<IAssessmentModule>('AssessmentModule', AssessmentModuleSchema)
export const ModuleLearningSection: Model<IModuleLearningSection> = mongoose.models.ModuleLearningSection || mongoose.model<IModuleLearningSection>('ModuleLearningSection', ModuleLearningSectionSchema)
export const PracticeSet: Model<IPracticeSet> = mongoose.models.PracticeSet || mongoose.model<IPracticeSet>('PracticeSet', PracticeSetSchema)
export const SubscriptionPlan: Model<ISubscriptionPlan> = mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema)
export const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema)
export const QuestionOption: Model<IQuestionOption> = mongoose.models.QuestionOption || mongoose.model<IQuestionOption>('QuestionOption', QuestionOptionSchema)
export const AssessmentAttempt: Model<IAssessmentAttempt> = mongoose.models.AssessmentAttempt || mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema)
export const AttemptAnswer: Model<IAttemptAnswer> = mongoose.models.AttemptAnswer || mongoose.model<IAttemptAnswer>('AttemptAnswer', AttemptAnswerSchema)
export const CodingSubmission: Model<ICodingSubmission> = mongoose.models.CodingSubmission || mongoose.model<ICodingSubmission>('CodingSubmission', CodingSubmissionSchema)
export const UserProgress: Model<IUserProgress> = mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema)
export const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema)
export const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)
export const AIUsage: Model<IAIUsage> = mongoose.models.AIUsage || mongoose.model<IAIUsage>('AIUsage', AIUsageSchema)
export const AIAnalysis: Model<IAIAnalysis> = mongoose.models.AIAnalysis || mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema)
export const WebhookEvent: Model<IWebhookEvent> = mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema)
export const AdminOffer: Model<IAdminOffer> = mongoose.models.AdminOffer || mongoose.model<IAdminOffer>('AdminOffer', AdminOfferSchema)
export const TypingResult: Model<ITypingResult> = mongoose.models.TypingResult || mongoose.model<ITypingResult>('TypingResult', TypingResultSchema)
export const SpeakingSubmission: Model<ISpeakingSubmission> = mongoose.models.SpeakingSubmission || mongoose.model<ISpeakingSubmission>('SpeakingSubmission', SpeakingSubmissionSchema)
export const CodingProblem: Model<ICodingProblem> = mongoose.models.CodingProblem || mongoose.model<ICodingProblem>('CodingProblem', CodingProblemSchema)
export const WritingSubmission: Model<IWritingSubmission> = mongoose.models.WritingSubmission || mongoose.model<IWritingSubmission>('WritingSubmission', WritingSubmissionSchema)
