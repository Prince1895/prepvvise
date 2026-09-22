'use client'

import Script from 'next/script'
import { authClient } from '@/lib/auth-client'
import { useEffect, useMemo, useState } from 'react'
import { DebuggingLearnView } from '@/components/debugging/DebuggingLearnView'
import { AILiteracyLearnView } from '@/components/technical/AILiteracyLearnView'
import { AiCodingLearnView } from '@/components/ai-coding/AiCodingLearnView'
import { Stage, Topic, getHardcodedLearningSections } from '@/lib/content/technical-learning-content'
import {
  ArrowUpRight,
  AudioLines,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Flame,
  Gauge,
  Home,
  Languages,
  LibraryBig,
  LineChart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Search,
  Settings2,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserRound,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCode2,
  LockKeyhole,
  RotateCcw,
  Square,
  Terminal,
  BookOpen,
  FileText,
  Headphones,
  Mic,
  Volume2,
  VolumeX,
  Bookmark,
  Bell,
  X,
  Moon,
  Sun,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { testRunner } from '@/lib/execution/TestRunner'
import { executionManager } from '@/lib/execution/ExecutionManager'
import { AudioRecorder } from '@/components/english/AudioRecorder'
import { parseDialogueScript, getVoiceForSpeaker, createListeningAudioMetadata } from '@/lib/english/listening-audio'

// Static display configuration for the five assessment stages.
// Readiness percentages are resolved dynamically from the backend via
// /api/progress and /api/attempts — never hardcoded here.
const stages = [
  { id: 'english', number: '01', name: 'English', label: 'Communication', icon: Languages, progress: 0, meta: 'Grammar · Speaking', color: 'mint' },
  { id: 'technical', number: '02', name: 'Technical', label: 'Assessment', icon: Brain, progress: 0, meta: 'AI Literacy · Logic', color: 'peach' },
  { id: 'debugging', number: '03', name: 'Debugging', label: 'Code Lab', icon: Code2, progress: 0, meta: 'Loops · Runtime errors', color: 'lavender' },
  { id: 'coding', number: '04', name: 'AI Coding', label: 'Practice', icon: Sparkles, progress: 0, meta: 'Arrays · Algorithms', color: 'yellow' },
]

type BackendPracticeSet = {
  id: string
  setNumber: number
  name: string
  access: 'free' | 'premium'
  type: 'focused' | 'mixed'
  locked: boolean
  bestScore?: number | null
  attemptsCount?: number
  attemptsLimit?: number | null
  attemptsLeft?: number | null
}

type BackendLearnSection = {
  id: string
  position: number
  title: string
  summary: string
  content: string
  structuredContent?: Stage
  durationMinutes: number
  access: 'free' | 'premium'
}

type BackendModule = {
  id: string
  slug: string
  name: string
  description: string | null
  learningSections: BackendLearnSection[]
  practiceSets: BackendPracticeSet[]
}

type BackendProgress = {
  moduleId: string
  moduleSlug: string
  moduleName: string
  attemptsCount: number | null
  bestScore: number | null
  completedSets: number | null
}

type BackendAttempt = {
  id: string
  status: 'in_progress' | 'submitted' | 'expired'
  score: number | null
  startedAt: string | null
  expiresAt: string | null
  submittedAt: string | null
  practiceSetId: string
  practiceSetName: string
  setNumber: number
  moduleSlug: string
  moduleName: string
}

type BackendPlan = {
  slug: 'free' | 'premium'
  displayName: string
  pricePaise: number
  current: boolean
  practiceSetAccessLimit: number | null
  unlimitedAttempts: boolean
  aiAnalysis: boolean
  aiCoachDailyLimit: number | null
}



function StructuredTopicCard({ topic }: { topic: Topic }) {
  const examplesList = (topic.realWorldExamples || topic.examples || topic.applications || topic.useCases) as string[] | undefined
  const stepsList = (topic.howItWorks || topic.basicWorkflow || topic.workflow || topic.coreComponents || topic.majorComponents) as string[] | undefined
  const takeawaysList = (topic.importantPoints || (topic.importantPoint ? [topic.importantPoint] : undefined)) as string[] | undefined
  const pitfallsList = (topic.commonMistakes || topic.symptoms || topic.risks || topic.commonFailurePoints) as string[] | undefined
  const safeguardsList = (topic.solutions || topic.mitigation || topic.prevention || topic.controls) as string[] | undefined

  const questionsList: string[] = Array.isArray(topic.interviewQuestions)
    ? topic.interviewQuestions
    : topic.interviewQuestions
      ? [
          ...(topic.interviewQuestions.beginner ?? []),
          ...(topic.interviewQuestions.intermediate ?? []),
          ...(topic.interviewQuestions.advanced ?? []),
          ...(topic.interviewQuestions.scenario ?? []),
        ]
      : []

  return (
    <article className="topic-card" style={{ minHeight: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '14px' }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>{topic.title}</h3>
        <span className="topic-chip" style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.8 }}>{topic.id}</span>
      </div>

      {/* Definition Block */}
      {topic.definition && (
        <div style={{ borderLeft: '3px solid var(--ink)', background: 'var(--muted)', padding: '14px 18px', borderRadius: '0 8px 8px 0' }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
            Definition
          </span>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', fontWeight: '500', color: 'var(--foreground)' }}>
            {topic.definition}
          </p>
        </div>
      )}

      {/* Simple Explanation / Intuition */}
      {(topic.simpleExplanation || topic.intuition) && (
        <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--muted-foreground)' }}>
          <strong style={{ color: 'var(--foreground)', fontWeight: '600' }}>In simple terms:</strong> {topic.simpleExplanation || topic.intuition}
        </div>
      )}

      {/* Detailed Explanation */}
      {topic.detailedExplanation && (
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--foreground)' }}>
          {topic.detailedExplanation}
        </p>
      )}

      {/* Code Example */}
      {topic.codeExample && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            Code Example ({topic.codeExample.language})
          </h4>
          <pre style={{ background: 'var(--ink)', color: 'var(--background)', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: 0, fontFamily: 'monospace' }}>
            <code>{topic.codeExample.code}</code>
          </pre>
          {topic.codeExample.lineByLineExplanation && (
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {topic.codeExample.lineByLineExplanation.map((exp, idx) => (
                <li key={idx}>{exp}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Workflow / Steps */}
      {stepsList && stepsList.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            How it works & workflow
          </h4>
          <div style={{ display: 'grid', gap: '6px' }}>
            {stepsList.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontSize: '13px', lineHeight: '1.5' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', fontFamily: 'monospace', minWidth: '18px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Examples */}
      {examplesList && examplesList.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            Real-world examples & applications
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {examplesList.map((ex, idx) => (
              <div key={idx} style={{ background: 'var(--muted)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--coral)', fontWeight: 'bold' }}>•</span>
                <span>{ex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {takeawaysList && takeawaysList.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            Key takeaways
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6', display: 'grid', gap: '4px' }}>
            {takeawaysList.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Pitfalls / Risks */}
      {pitfallsList && pitfallsList.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            Common pitfalls & mistakes
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6', display: 'grid', gap: '4px' }}>
            {pitfallsList.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Solutions / Safeguards */}
      {safeguardsList && safeguardsList.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            Solutions & safeguards
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6', display: 'grid', gap: '4px' }}>
            {safeguardsList.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Engineering Scenario Block */}
      {topic.scenario && (
        <div style={{ background: 'var(--muted)', border: '1px solid var(--line)', padding: '14px 16px', borderRadius: '10px', fontSize: '13px' }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--foreground)' }}>
            🛠️ Engineering Scenario
          </p>
          <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>{topic.scenario.context}</p>
          <p style={{ margin: '0 0 6px 0', color: 'var(--muted-foreground)' }}><strong>Problem:</strong> {topic.scenario.problem}</p>
          <div style={{ borderLeft: '2px solid var(--ink)', paddingLeft: '10px' }}>
            <strong>Recommended Solution:</strong> {topic.scenario.recommendedApproach}
            <p style={{ margin: '4px 0 0 0', color: 'var(--muted-foreground)', fontSize: '12px' }}>{topic.scenario.reasoning}</p>
          </div>
        </div>
      )}

      {/* Exam Tip */}
      {topic.examTip && (
        <div style={{ borderLeft: '3px solid var(--ink)', padding: '10px 14px', background: 'var(--muted)', borderRadius: '0 6px 6px 0', fontSize: '13px', lineHeight: '1.5' }}>
          <strong>Exam Tip:</strong> {topic.examTip}
        </div>
      )}

      {/* Interview Questions */}
      {questionsList.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-foreground)' }}>
            Interview questions
          </h4>
          <div style={{ display: 'grid', gap: '6px' }}>
            {questionsList.map((q, idx) => (
              <div key={idx} style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--foreground)', background: 'var(--muted)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                "{q}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Concepts */}
      {topic.relatedConcepts && topic.relatedConcepts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '12px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
          <span style={{ color: 'var(--muted-foreground)', fontWeight: '600' }}>Related:</span>
          {topic.relatedConcepts.map((rc, idx) => (
            <span key={idx} className="topic-chip" style={{ fontSize: '11px', padding: '2px 8px' }}>{rc}</span>
          ))}
        </div>
      )}
    </article>
  )
}

function LearnSectionView({ sections, isPremium, onPremium }: { sections: BackendLearnSection[]; isPremium: boolean; onPremium: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  if (!sections.length) {
    return <section className="module-content"><p className="eyebrow text-muted-foreground">Learning path</p><h2 className="section-title">No learning content yet</h2><p className="module-description">Learning sub-modules for this module are managed from the codebase. Please check back soon.</p></section>
  }

  const open = sections.find((section) => section.id === openId)
  if (open) {
    const stage = open.structuredContent as Stage | undefined

    const filteredTopics = stage?.topics.filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.simpleExplanation && t.simpleExplanation.toLowerCase().includes(q)) ||
        (t.detailedExplanation && t.detailedExplanation.toLowerCase().includes(q))
      )
    }) ?? []

    return (
      <section className="module-content">
        <button className="back-link" onClick={() => { setOpenId(null); setSearchQuery('') }}><ChevronRight className="rotate-180" /> Learning path</button>
        <p className="eyebrow text-muted-foreground">
          Stage {String(open.position).padStart(2, '0')} {stage?.difficulty ? `· ${stage.difficulty}` : ''} · {open.durationMinutes} min read · Free access
        </p>
        <h2 className="section-title">{open.title}</h2>
        <p className="module-description">{open.summary}</p>

        {stage ? (
          <div style={{ marginTop: '20px' }}>
            {/* Quick terminology search inside stage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card)', border: '1px solid var(--line)', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px' }}>
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AI terms, definitions, algorithms, or examples in this stage..."
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--foreground)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ fontSize: '11px', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Clear</button>
              )}
            </div>

            {stage.learningObjectives && stage.learningObjectives.length > 0 && !searchQuery && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px' }}>
                <p className="eyebrow" style={{ marginBottom: '10px', fontSize: '11px', color: 'var(--foreground)', fontWeight: '700' }}>🎯 Learning Objectives</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                  {stage.learningObjectives.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      <Check style={{ width: '14px', height: '14px', color: 'oklch(0.60 0.15 160)', flexShrink: 0 }} />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredTopics.length > 0 ? (
                filteredTopics.map((topic) => (
                  <StructuredTopicCard key={topic.id} topic={topic} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic py-6">No terms matching "{searchQuery}" in this stage.</p>
              )}
            </div>

            {stage.stageRevision && !searchQuery && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', padding: '20px', borderRadius: '12px', marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>
                  ⚡ Stage {stage.id} Revision Sheet
                </h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>{stage.stageRevision.summary}</p>

                {stage.stageRevision.importantDefinitions && (
                  <div style={{ marginBottom: '12px' }}>
                    <p className="eyebrow" style={{ marginBottom: '6px', fontSize: '10px' }}>Key Definitions</p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', display: 'grid', gap: '4px' }}>
                      {stage.stageRevision.importantDefinitions.map((def, idx) => (
                        <li key={idx}>{def}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {stage.stageRevision.revisionPoints && (
                  <div>
                    <p className="eyebrow" style={{ marginBottom: '6px', fontSize: '10px' }}>Fast Revision Points</p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', display: 'grid', gap: '4px' }}>
                      {stage.stageRevision.revisionPoints.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <article className="topic-card" style={{ marginTop: '20px' }}><p style={{ whiteSpace: 'pre-wrap' }}>{open.content}</p></article>
        )}
      </section>
    )
  }

  const filteredSections = sections.filter((sec) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const stage = sec.structuredContent as Stage | undefined
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      (stage && stage.topics.some((t) => t.title.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)))
    )
  })

  return (
    <section className="module-content">
      <div style={{ marginBottom: '16px' }}>
        <p className="eyebrow text-muted-foreground">Structured AI Curriculum · Free Access for All</p>
        <h2 className="section-title">AI Literacy Academy</h2>
        <p className="module-description">Master AI concepts, nomenclature, terminologies, and real-world engineering examples from fundamentals to production systems.</p>
      </div>

      {/* Quick Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card)', border: '1px solid var(--line)', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px' }}>
        <Search className="size-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search any AI concept or term (e.g. RAG, Tokens, Overfitting, Hallucination, AI Agents, Fine-Tuning)..."
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--foreground)' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ fontSize: '11px', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Clear</button>
        )}
      </div>

      <div className="topic-grid">
        {filteredSections.map((section) => {
          return (
            <article className="topic-card" key={section.id}>
              <span className="stage-number">Stage {String(section.position).padStart(2, '0')}</span>
              <h3>{section.title}</h3>
              <p>{section.summary}</p>
              <div>
                <span>{section.durationMinutes} min read</span>
                <button onClick={() => setOpenId(section.id)}>Start Learning <ArrowUpRight /></button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ModuleView({ stage, backendModule, onBack, onTutor, onAssessment, onSet, isPremium, onPremium }: { stage: (typeof stages)[number]; backendModule?: BackendModule; onBack: () => void; onTutor: () => void; onAssessment: () => void; onSet: (set: { number: number; id: string; name: string }) => void; isPremium: boolean; onPremium: () => void }) {
  const [tab, setTab] = useState<'Learn' | 'Practice'>('Practice')
  const [filter, setFilter] = useState('All')
  if (stage.id === 'english') return <EnglishCommunicationModule onBack={onBack} isPremium={isPremium} onPremium={onPremium} />
  if (stage.id === 'debugging') return <DebuggingModule onBack={onBack} isPremium={isPremium} onPremium={onPremium} />
  if (stage.id === 'coding') return <AICodingModule onBack={onBack} isPremium={isPremium} onPremium={onPremium} />
  const learnSections = (backendModule?.learningSections && backendModule.learningSections.length > 0)
    ? backendModule.learningSections
    : getHardcodedLearningSections(stage.id)
  const availableSets = backendModule?.practiceSets?.map((set) => ({
    name: set.name,
    number: set.setNumber,
    id: set.id,
    free: set.access === 'free',
    bestScore: set.bestScore,
    attemptsCount: set.attemptsCount,
    attemptsLeft: set.attemptsLeft,
    locked: set.locked,
    score: set.bestScore !== null && set.bestScore !== undefined ? `${set.bestScore}%` : '—',
  })) ?? []
  const visibleSets = availableSets.filter((set) => filter === 'All' || filter === (set.free ? 'Free' : 'Premium'))
  return (
    <div className="module-page">
      <button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> Assessment journey</button>
      <div className={`module-hero stage-${stage.color}`}>
        <div className="module-hero-copy"><p className="eyebrow">{stage.name} module</p><h1 className="module-title">{stage.name} Assessment</h1><p className="module-subtitle">AI Literacy · Situational · Problem Solving</p><button className="primary-button" onClick={stage.id === 'english' ? onAssessment : onTutor}>{stage.id === 'english' ? 'Start assessment' : 'Ask AI coach'} <ArrowUpRight /></button></div>
        <div className="module-progress"><div className="flex items-baseline justify-between"><span className="eyebrow">{isPremium ? 'Premium unlocked' : 'Free plan'}</span><strong>{stage.progress}% ready</strong></div><p className="mt-2 text-xs text-muted-foreground">{isPremium ? `${availableSets.length} practice sets available` : 'Free tier sets available'}</p><div className="progress-track"><div style={{ width: `${stage.progress}%` }} /></div><div className="module-stats"><div><strong>{availableSets.length}</strong><span>sets</span></div><div><strong>Interactive</strong><span>MCQ</span></div><div><strong>Server-side</strong><span>Scored</span></div></div></div>
      </div>
      <div className="module-tabs">{(['Learn', 'Practice'] as const).map((item) => <button key={item} className={`module-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'Learn' && (
        stage.id === 'technical' ? (
          <AILiteracyLearnView />
        ) : (
          <LearnSectionView sections={learnSections} isPremium={isPremium} onPremium={onPremium} />
        )
      )}
      {tab === 'Practice' && (
        <section className="module-content">
          <div className="module-section-heading">
            <div>
              <p className="eyebrow text-muted-foreground">Practice</p>
              <h2 className="section-title">Practice sets</h2>
              <p className="module-description">{availableSets.length} sets available · Unlimited attempts</p>
            </div>
            <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter practice sets">
              <option>All</option>
              <option>Free</option>
              <option>Premium</option>
            </select>
          </div>
          <p className="practice-intro">Start with focused topic practice, then test yourself with mixed assessment sets.</p>
          {visibleSets.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">No practice sets available yet for this module. Use the Admin Panel to publish practice sets and questions.</p>
          ) : (
            <>
              {visibleSets.some((s) => s.number <= 10) && (
                <>
                  <h3 className="subsection-title">Focused practice <span>Sets 01–10</span></h3>
                  <div className="set-grid">{visibleSets.filter((set) => set.number <= 10).map((set) => <SetCard key={set.id || set.number} set={set} isPremium={isPremium} onPremium={onPremium} onStart={() => onSet(set)} />)}</div>
                </>
              )}
              {visibleSets.some((s) => s.number > 10) && (
                <>
                  <h3 className="subsection-title">Mixed practice <span>Sets 11–20</span></h3>
                  <div className="set-grid">{visibleSets.filter((set) => set.number > 10).map((set) => <SetCard key={set.id || set.number} set={set} isPremium={isPremium} onPremium={onPremium} onStart={() => onSet(set)} />)}</div>
                </>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}

function parseStatement(statement: string) {
  if (!statement) return { description: '', debugTask: '', bugCategory: '' }
  const parts = statement.split('\n\n')
  let description = parts[0] || statement
  let debugTask = ''
  let bugCategory = ''

  for (const part of parts) {
    if (part.includes('**Debug Task:**')) {
      debugTask = part.replace(/\*\*Debug Task:\*\*\s*/i, '').trim()
    } else if (part.includes('**Bug Category:**')) {
      bugCategory = part.replace(/\*\*Bug Category:\*\*\s*/i, '').trim()
    }
  }

  return { description, debugTask, bugCategory }
}

function countWordsInText(text: string): number {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

function EnglishCommunicationModule({ onBack, isPremium, onPremium }: { onBack: () => void; isPremium: boolean; onPremium: () => void }) {
  const [mainTab, setMainTab] = useState<'Listening & Speaking' | 'Reading' | 'Writing'>('Reading')

  // Reading state
  const [readingView, setReadingView] = useState<'sets' | 'details' | 'passage1' | 'questions1' | 'passage2' | 'questions2' | 'result'>('sets')
  const [readingSets, setReadingSets] = useState<any[]>([])
  const [selectedReadingSet, setSelectedReadingSet] = useState<any>(null)
  const [readingPassages, setReadingPassages] = useState<any[]>([])
  const [readingAttempt, setReadingAttempt] = useState<any>(null)
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({})
  const [readingSeconds, setReadingSeconds] = useState(20 * 60)
  const [readingResult, setReadingResult] = useState<any>(null)

  // Writing state
  const [writingView, setWritingView] = useState<'sets' | 'details' | 'workspace' | 'result'>('sets')
  const [writingSets, setWritingSets] = useState<any[]>([])
  const [selectedWritingSet, setSelectedWritingSet] = useState<any>(null)
  const [writingQuestions, setWritingQuestions] = useState<any>(null)
  const [writingAttempt, setWritingAttempt] = useState<any>(null)
  const [essayResponse, setEssayResponse] = useState('')
  const [articleResponse, setArticleResponse] = useState('')
  const [writingSeconds, setWritingSeconds] = useState(30 * 60)
  const [evaluatingWriting, setEvaluatingWriting] = useState(false)
  const [writingEvalResult, setWritingEvalResult] = useState<any>(null)

  // Listening & Speaking state
  const [lsSubTab, setLsSubTab] = useState<'Listening' | 'Speaking'>('Listening')
  const [listeningSets, setListeningSets] = useState<any[]>([])
  const [selectedListeningSet, setSelectedListeningSet] = useState<any>(null)
  const [listeningView, setListeningView] = useState<'sets' | 'details' | 'test' | 'result'>('sets')
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([])
  const [listeningAttempt, setListeningAttempt] = useState<any>(null)
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({})
  const [listeningSeconds, setListeningSeconds] = useState(20 * 60)
  const [listeningResult, setListeningResult] = useState<any>(null)
  const [playedAudioCounts, setPlayedAudioCounts] = useState<Record<string, number>>({})

  const [speakingSets, setSpeakingSets] = useState<any[]>([])
  const [selectedSpeakingSet, setSelectedSpeakingSet] = useState<any>(null)
  const [speakingView, setSpeakingView] = useState<'sets' | 'details' | 'test' | 'result'>('sets')
  const [speakingQuestions, setSpeakingQuestions] = useState<any[]>([])
  const [speakingAttempt, setSpeakingAttempt] = useState<any>(null)
  const [currentSpeakingIdx, setCurrentSpeakingIndex] = useState(0)
  const [prepSeconds, setPrepSeconds] = useState(30)
  const [prepActive, setPrepActive] = useState(false)

  const [loadingSets, setLoadingSets] = useState(true)
  const [error, setError] = useState('')
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([])

  // Pre-load available browser speech synthesis voices for natural human voice selection
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const populateVoices = () => {
      const avail = window.speechSynthesis.getVoices()
      if (avail && avail.length > 0) {
        setSpeechVoices(avail)
      }
    }

    populateVoices()
    window.speechSynthesis.onvoiceschanged = populateVoices
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Load Reading, Writing, Listening, and Speaking sets from database API
  useEffect(() => {
    async function loadSets() {
      setLoadingSets(true)
      try {
        const res = await fetch('/api/english/sets')
        if (res.ok) {
          const data = await res.json()
          setReadingSets(data.readingSets || [])
          setWritingSets(data.writingSets || [])
          setListeningSets(data.listeningSets || [])
          setSpeakingSets(data.speakingSets || [])
        } else {
          setError('Unable to load English Communication sets.')
        }
      } catch {
        setError('Unable to load English Communication sets.')
      } finally {
        setLoadingSets(false)
      }
    }
    loadSets()
  }, [])

  // Listening Timer
  useEffect(() => {
    if (listeningView !== 'test' || listeningSeconds <= 0) return
    const interval = window.setInterval(() => {
      setListeningSeconds((val) => {
        if (val <= 1) {
          submitListeningSet()
          return 0
        }
        return val - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [listeningView, listeningSeconds])

  // Preparation timer for speaking
  useEffect(() => {
    if (!prepActive || prepSeconds <= 0) return
    const interval = window.setInterval(() => setPrepSeconds((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [prepActive, prepSeconds])

  // LISTENING ACTIONS
  const openListeningSet = async (setItem: any) => {
    if (setItem.locked && !isPremium) {
      onPremium()
      return
    }
    setError('')
    setSelectedListeningSet(setItem)
    setListeningView('details')
    try {
      const res = await fetch(`/api/english/listening/${setItem.id}`)
      if (res.ok) {
        const data = await res.json()
        setListeningQuestions(data.questions || [])
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Unable to fetch Listening set details.')
      }
    } catch {
      setError('Unable to fetch Listening set details.')
    }
  }

  const startListeningSet = async () => {
    if (!selectedListeningSet) return
    setError('')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ practiceSetId: selectedListeningSet.id }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Unable to start Listening attempt.')
        return
      }
      const data = await res.json()
      setListeningAttempt(data)
      setListeningSeconds(20 * 60)
      setListeningAnswers({})
      setListeningView('test')
    } catch {
      setError('Unable to start Listening attempt.')
    }
  }

  const playAudioScript = (rawText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    // Parse multi-speaker dialogue turns or narrative passage
    const turns = parseDialogueScript(rawText)
    const availVoices = speechVoices.length > 0 ? speechVoices : window.speechSynthesis.getVoices()
    const speakerVoiceMap = new Map<string, SpeechSynthesisVoice>()

    const speakTurn = (index: number) => {
      if (index >= turns.length) return

      const turn = turns[index]
      const utterance = new SpeechSynthesisUtterance(turn.text)
      utterance.rate = 0.88  // soft, relaxed, easy pace
      utterance.pitch = 0.98 // soft, warm pitch
      utterance.volume = 0.92 // gentle, pleasant volume

      // Assign distinct, soft human-sounding voice per speaker
      const voice = getVoiceForSpeaker(turn.speaker, speakerVoiceMap, availVoices)
      if (voice) {
        utterance.voice = voice
      }

      utterance.onend = () => {
        setTimeout(() => {
          speakTurn(index + 1)
        }, 500)
      }

      utterance.onerror = () => {
        speakTurn(index + 1)
      }

      window.speechSynthesis.speak(utterance)
    }

    speakTurn(0)
  }

  const handleListenToScript = (qId: string, text: string) => {
    const currentCount = playedAudioCounts[qId] || 0
    if (currentCount >= 1) return // max 1 attempt
    setPlayedAudioCounts((prev) => ({ ...prev, [qId]: currentCount + 1 }))
    playAudioScript(text)
  }

  const submitListeningSet = async () => {
    if (!listeningAttempt) return
    setError('')
    try {
      let correctCount = 0
      let answeredCount = 0

      for (const q of listeningQuestions) {
        const selected = listeningAnswers[q.id]
        if (selected) {
          answeredCount++
          if (q.options?.find((o: any) => o.id === selected && o.isCorrect)) {
            correctCount++
          }
        }
      }

      const scorePct = Math.round((correctCount / (listeningQuestions.length || 1)) * 100)
      await fetch(`/api/attempts/${listeningAttempt.id}/submit`, { method: 'POST' })

      setListeningResult({
        totalQuestions: listeningQuestions.length,
        correctCount,
        incorrectCount: answeredCount - correctCount,
        unansweredCount: listeningQuestions.length - answeredCount,
        scorePct,
      })
      setListeningView('result')
    } catch {
      setError('Failed to submit Listening set.')
    }
  }

  // SPEAKING ACTIONS
  const openSpeakingSet = async (setItem: any) => {
    if (setItem.locked && !isPremium) {
      onPremium()
      return
    }
    setError('')
    setSelectedSpeakingSet(setItem)
    setSpeakingView('details')
    try {
      const res = await fetch(`/api/english/speaking/${setItem.id}`)
      if (res.ok) {
        const data = await res.json()
        setSpeakingQuestions(data.questions || [])
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Unable to fetch Speaking set details.')
      }
    } catch {
      setError('Unable to fetch Speaking set details.')
    }
  }

  const startSpeakingSet = async () => {
    if (!selectedSpeakingSet) return
    setError('')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ practiceSetId: selectedSpeakingSet.id }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Unable to start Speaking attempt.')
        return
      }
      const data = await res.json()
      setSpeakingAttempt(data)
      setCurrentSpeakingIndex(0)
      setPrepSeconds(30)
      setPrepActive(false)
      setSpeakingView('test')
    } catch {
      setError('Unable to start Speaking attempt.')
    }
  }

  // Reading Timer (20 min across entire set)
  useEffect(() => {
    if (!['passage1', 'questions1', 'passage2', 'questions2'].includes(readingView) || readingSeconds <= 0) return
    const interval = window.setInterval(() => {
      setReadingSeconds((val) => {
        if (val <= 1) {
          submitReadingSet()
          return 0
        }
        return val - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [readingView, readingSeconds])

  // Writing Timer (30 min across both prompts)
  useEffect(() => {
    if (writingView !== 'workspace' || writingSeconds <= 0) return
    const interval = window.setInterval(() => {
      setWritingSeconds((val) => {
        if (val <= 1) {
          submitWritingSet()
          return 0
        }
        return val - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [writingView, writingSeconds])

  // Preparation timer for speaking
  useEffect(() => {
    if (!prepActive || prepSeconds <= 0) return
    const interval = window.setInterval(() => setPrepSeconds((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [prepActive, prepSeconds])

  // READING ACTIONS
  const openReadingSet = async (setItem: any) => {
    if (setItem.locked && !isPremium) {
      onPremium()
      return
    }
    setError('')
    setSelectedReadingSet(setItem)
    setReadingView('details')
    try {
      const res = await fetch(`/api/english/reading/${setItem.id}`)
      if (res.ok) {
        const data = await res.json()
        setReadingPassages(data.passages || [])
      } else {
        setError('Unable to fetch Reading set details.')
      }
    } catch {
      setError('Unable to fetch Reading set details.')
    }
  }

  const startReadingSet = async () => {
    if (!selectedReadingSet) return
    setError('')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ practiceSetId: selectedReadingSet.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Unable to start Reading attempt.')
        return
      }
      const data = await res.json()
      setReadingAttempt(data)
      setReadingSeconds(20 * 60)
      setReadingAnswers({})
      setReadingView('passage1')
    } catch {
      setError('Unable to start Reading attempt.')
    }
  }

  const handleSelectReadingAnswer = (qId: string, optionId: string) => {
    setReadingAnswers((prev) => ({ ...prev, [qId]: optionId }))
  }

  const submitReadingSet = async () => {
    if (!readingAttempt) return
    setError('')
    try {
      const p1 = readingPassages[0] || { questions: [] }
      const p2 = readingPassages[1] || { questions: [] }
      const allQuestions = [...(p1.questions || []), ...(p2.questions || [])]

      let correctCount = 0
      let answeredCount = 0

      for (const q of allQuestions) {
        const selected = readingAnswers[q.id]
        if (selected) {
          answeredCount++
          if (q.options?.find((o: any) => o.id === selected && o.isCorrect)) {
            correctCount++
          }
        }
      }

      const scorePct = Math.round((correctCount / (allQuestions.length || 1)) * 100)

      await fetch(`/api/attempts/${readingAttempt.id}/submit`, { method: 'POST' })

      setReadingResult({
        totalQuestions: allQuestions.length,
        correctCount,
        incorrectCount: answeredCount - correctCount,
        unansweredCount: allQuestions.length - answeredCount,
        scorePct,
        p1Correct: (p1.questions || []).filter((q: any) => q.options?.find((o: any) => o.id === readingAnswers[q.id] && o.isCorrect)).length,
        p2Correct: (p2.questions || []).filter((q: any) => q.options?.find((o: any) => o.id === readingAnswers[q.id] && o.isCorrect)).length,
      })

      setReadingView('result')
    } catch {
      setError('Failed to submit Reading assessment.')
    }
  }

  // WRITING ACTIONS
  const openWritingSet = async (setItem: any) => {
    if (setItem.locked && !isPremium) {
      onPremium()
      return
    }
    setError('')
    setSelectedWritingSet(setItem)
    setWritingView('details')
    try {
      const res = await fetch(`/api/english/writing/${setItem.id}`)
      if (res.ok) {
        const data = await res.json()
        setWritingQuestions(data.questions)
      } else {
        setError('Unable to fetch Writing set details.')
      }
    } catch {
      setError('Unable to fetch Writing set details.')
    }
  }

  const startWritingSet = async () => {
    if (!selectedWritingSet) return
    setError('')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ practiceSetId: selectedWritingSet.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Unable to start Writing attempt.')
        return
      }
      const data = await res.json()
      setWritingAttempt(data)
      setWritingSeconds(30 * 60)
      setEssayResponse('')
      setArticleResponse('')
      setWritingView('workspace')
    } catch {
      setError('Unable to start Writing attempt.')
    }
  }

  const submitWritingSet = async () => {
    if (!writingAttempt || !selectedWritingSet) return
    setEvaluatingWriting(true)
    setError('')
    try {
      const res = await fetch('/api/english/writing/evaluate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          attemptId: writingAttempt.id,
          practiceSetId: selectedWritingSet.id,
          essayResponse,
          articleResponse,
          essayPrompt: writingQuestions?.essay?.prompt,
          articlePrompt: writingQuestions?.article?.prompt,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Writing evaluation failed.')
        setEvaluatingWriting(false)
        return
      }

      setWritingEvalResult(data)
      setWritingView('result')
    } catch {
      setError('Failed to submit writing evaluation.')
    } finally {
      setEvaluatingWriting(false)
    }
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const p1 = readingPassages[0] || { title: 'Passage 1', questions: [] }
  const p2 = readingPassages[1] || { title: 'Passage 2', questions: [] }

  const essayWordCount = countWordsInText(essayResponse)
  const articleWordCount = countWordsInText(articleResponse)

  return (
    <div className="module-page">
      <button className="back-link" onClick={onBack}>
        <ChevronRight className="rotate-180" /> Assessment journey
      </button>

      <div className="module-hero stage-mint">
        <div className="module-hero-copy">
          <p className="eyebrow">English Communication module</p>
          <h1 className="module-title">English Communication</h1>
          <p className="module-subtitle">Listening & Speaking · Reading (40 Passages, 400 MCQs) · Writing (Essay + Article)</p>
        </div>
      </div>

      {/* Strictly 3 Main Tabs: Listening & Speaking, Reading, Writing */}
      <div className="module-tabs">
        {(['Listening & Speaking', 'Reading', 'Writing'] as const).map((tabName) => (
          <button
            key={tabName}
            className={`module-tab ${mainTab === tabName ? 'active' : ''}`}
            onClick={() => {
              setMainTab(tabName)
              if (tabName === 'Reading') setReadingView('sets')
              if (tabName === 'Writing') setWritingView('sets')
            }}
          >
            {tabName === 'Listening & Speaking' && <Headphones className="w-4 h-4 inline-block mr-1.5" />}
            {tabName === 'Reading' && <BookOpen className="w-4 h-4 inline-block mr-1.5" />}
            {tabName === 'Writing' && <FileText className="w-4 h-4 inline-block mr-1.5" />}
            {tabName}
          </button>
        ))}
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg my-4">{error}</div>}

      {/* 1. LISTENING & SPEAKING TAB */}
      {mainTab === 'Listening & Speaking' && (
        <section className="module-content space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <button
              className={`px-4 py-2 rounded-lg text-xs font-semibold ${lsSubTab === 'Listening' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => { setLsSubTab('Listening'); setListeningView('sets'); }}
            >
              Listening Sets (20 Sets · 200 MCQs)
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-xs font-semibold ${lsSubTab === 'Speaking' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => { setLsSubTab('Speaking'); setSpeakingView('sets'); }}
            >
              Speaking Sets (20 Sets · 200 Prompts)
            </button>
          </div>

          {/* LISTENING SECTION */}
          {lsSubTab === 'Listening' && (
            <div>
              {listeningView === 'sets' && (
                <div>
                  <div className="module-section-heading">
                    <div>
                      <p className="eyebrow text-muted-foreground">Listening</p>
                      <h2 className="section-title">Listening Practice Sets (200 MCQs)</h2>
                      <p className="module-description">20 Sets · 10 Audio MCQs per set · Audio scenario conversations & announcements</p>
                    </div>
                  </div>

                  {loadingSets ? (
                    <p className="py-8 text-center text-muted-foreground">Loading Listening practice sets...</p>
                  ) : (
                    <div className="set-grid">
                      {listeningSets.map((s) => (
                        <button
                          key={s.id}
                          className={`set-card ${s.locked ? 'set-locked' : ''}`}
                          onClick={() => openListeningSet(s)}
                        >
                          <span className="eyebrow">Listening Set {String(s.setNumber).padStart(2, '0')}</span>
                          <h3>{s.name}</h3>
                          {s.locked ? (
                            <>
                              <span className="lock-badge">Premium</span>
                              <p className="set-meta">Unlock with PrepVvise Premium</p>
                              <span className="set-action">Unlock ₹59 <ArrowUpRight /></span>
                            </>
                          ) : (
                            <>
                              <p className="set-meta">10 Audio MCQs · {s.difficulty?.toUpperCase() || 'EASY'}</p>
                              <p className="set-meta">Time limit: 20 min · Best score: {s.bestScore !== null && s.bestScore !== undefined ? `${s.bestScore}%` : '—'}</p>
                              <span className="set-action">Start Listening <ArrowUpRight /></span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {listeningView === 'details' && (
                <div className="space-y-6">
                  <button className="back-link" onClick={() => setListeningView('sets')}><ChevronRight className="rotate-180" /> Back to Listening sets</button>
                  <div className="border rounded-2xl p-6 bg-card space-y-4">
                    <span className="eyebrow">Set Details · {selectedListeningSet?.name}</span>
                    <h1 className="assessment-heading">{selectedListeningSet?.name}</h1>
                    <p className="assessment-lede">Listen to 10 audio clips/conversations and answer comprehension questions. Audio clips can be played during the assessment.</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-3 text-xs font-semibold">
                      <div className="p-3 border rounded-xl bg-muted/30"><span>Questions:</span> <strong className="block text-foreground text-sm mt-1">10 Audio MCQs</strong></div>
                      <div className="p-3 border rounded-xl bg-muted/30"><span>Time Limit:</span> <strong className="block text-foreground text-sm mt-1">20 Minutes</strong></div>
                      <div className="p-3 border rounded-xl bg-muted/30"><span>Audio Policy:</span> <strong className="block text-foreground text-sm mt-1">Interactive Playback</strong></div>
                    </div>

                    <button className="primary-button" onClick={startListeningSet}>Start Listening Assessment <ArrowUpRight /></button>
                  </div>
                </div>
              )}

              {listeningView === 'test' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="eyebrow">Listening Assessment · {selectedListeningSet?.name}</span>
                    <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${listeningSeconds < 300 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                      <Clock3 className="w-3.5 h-3.5 inline mr-1" /> {formatTimer(listeningSeconds)} remaining
                    </span>
                  </div>

                  <div className="space-y-6">
                    {listeningQuestions.map((q, idx) => {
                      const scriptText = q.script || q.question || 'Audio scenario'
                      const attemptsUsed = playedAudioCounts[q.id] || 0
                      const isLimitReached = attemptsUsed >= 1

                      return (
                        <div key={q.id} className="border rounded-2xl p-6 bg-card space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="topic-chip uppercase font-bold">{q.scenarioType || 'conversation'}</span>
                            <button
                              type="button"
                              disabled={isLimitReached}
                              onClick={() => handleListenToScript(q.id, scriptText)}
                              className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-primary" />
                              {isLimitReached ? 'Audio Played (1/1 attempt used)' : 'Listen to Audio Script (0/1 attempt used)'}
                            </button>
                          </div>

                          <strong className="text-sm text-foreground font-semibold block pt-2">
                            Q{idx + 1}. {q.question}
                          </strong>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {(q.options || []).map((opt: any) => {
                              const isSelected = listeningAnswers[q.id] === opt.id
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setListeningAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                                  className={`p-3 rounded-lg border text-left flex items-start gap-2 transition-colors ${isSelected ? 'border-primary bg-primary/10 font-bold text-foreground' : 'border-border bg-card hover:bg-muted/40'}`}
                                >
                                  <span className="font-mono font-bold">{opt.id}.</span>
                                  <span>{opt.text}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    <div className="pt-4 flex justify-end border-t border-border">
                      <button className="primary-button" onClick={submitListeningSet}>
                        Submit Listening Set <ArrowUpRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {listeningView === 'result' && (
                <div className="space-y-6">
                  <button className="back-link" onClick={() => setListeningView('sets')}><ChevronRight className="rotate-180" /> Listening Sets</button>
                  <div className="border rounded-2xl p-6 bg-card space-y-6">
                    <div>
                      <span className="eyebrow">Listening Assessment Complete</span>
                      <h1 className="assessment-heading">{listeningResult?.scorePct >= 70 ? 'Excellent Listening Comprehension!' : 'Review Audio Transcripts'}</h1>
                    </div>

                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-muted-foreground block">Listening Score</span>
                        <strong className="text-3xl font-extrabold text-foreground">{listeningResult?.scorePct}%</strong>
                        <p className="text-xs text-muted-foreground mt-1">{listeningResult?.correctCount} / {listeningResult?.totalQuestions} Questions Correct</p>
                      </div>
                      <div className="text-right text-xs space-y-1 font-medium">
                        <div>Correct: <strong className="text-emerald-600 dark:text-emerald-400">{listeningResult?.correctCount}</strong></div>
                        <div>Incorrect: <strong className="text-rose-600 dark:text-rose-400">{listeningResult?.incorrectCount}</strong></div>
                        <div>Unanswered: <strong>{listeningResult?.unansweredCount}</strong></div>
                      </div>
                    </div>

                    <button className="primary-button" onClick={() => setListeningView('sets')}>Return to Listening Sets <ArrowUpRight /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SPEAKING SECTION */}
          {lsSubTab === 'Speaking' && (
            <div>
              {speakingView === 'sets' && (
                <div>
                  <div className="module-section-heading">
                    <div>
                      <p className="eyebrow text-muted-foreground">Speaking</p>
                      <h2 className="section-title">Speaking Practice Sets (200 Prompts)</h2>
                      <p className="module-description">20 Sets · 10 Prompts per set · 30s Preparation timer · Microphone recording</p>
                    </div>
                  </div>

                  {loadingSets ? (
                    <p className="py-8 text-center text-muted-foreground">Loading Speaking practice sets...</p>
                  ) : (
                    <div className="set-grid">
                      {speakingSets.map((s) => (
                        <button
                          key={s.id}
                          className={`set-card ${s.locked ? 'set-locked' : ''}`}
                          onClick={() => openSpeakingSet(s)}
                        >
                          <span className="eyebrow">Speaking Set {String(s.setNumber).padStart(2, '0')}</span>
                          <h3>{s.name}</h3>
                          {s.locked ? (
                            <>
                              <span className="lock-badge">Premium</span>
                              <p className="set-meta">Unlock with PrepVvise Premium</p>
                              <span className="set-action">Unlock ₹59 <ArrowUpRight /></span>
                            </>
                          ) : (
                            <>
                              <p className="set-meta">10 Speaking Prompts · {s.difficulty?.toUpperCase() || 'EASY'}</p>
                              <p className="set-meta">Microphone Recording · 30s Prep Timer</p>
                              <span className="set-action">Start Speaking <ArrowUpRight /></span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {speakingView === 'details' && (
                <div className="space-y-6">
                  <button className="back-link" onClick={() => setSpeakingView('sets')}><ChevronRight className="rotate-180" /> Back to Speaking sets</button>
                  <div className="border rounded-2xl p-6 bg-card space-y-4">
                    <span className="eyebrow">Set Details · {selectedSpeakingSet?.name}</span>
                    <h1 className="assessment-heading">{selectedSpeakingSet?.name}</h1>
                    <p className="assessment-lede">Respond orally to 10 speaking prompts. For each prompt, you get 30 seconds of preparation time followed by microphone audio recording.</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-3 text-xs font-semibold">
                      <div className="p-3 border rounded-xl bg-muted/30"><span>Prompts:</span> <strong className="block text-foreground text-sm mt-1">10 Prompts</strong></div>
                      <div className="p-3 border rounded-xl bg-muted/30"><span>Prep Time:</span> <strong className="block text-foreground text-sm mt-1">30 Seconds / Prompt</strong></div>
                      <div className="p-3 border rounded-xl bg-muted/30"><span>Speaking Time:</span> <strong className="block text-foreground text-sm mt-1">90 Seconds / Prompt</strong></div>
                    </div>

                    <button className="primary-button" onClick={startSpeakingSet}>Start Speaking Assessment <ArrowUpRight /></button>
                  </div>
                </div>
              )}

              {speakingView === 'test' && (
                <div className="space-y-6">
                  {(() => {
                    const activePrompt = speakingQuestions[currentSpeakingIdx] || { prompt: 'Speaking Prompt', promptType: 'personal_response' }
                    return (
                      <div className="border rounded-2xl p-6 bg-card space-y-5">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <span className="eyebrow">Speaking Prompt {currentSpeakingIdx + 1} of {speakingQuestions.length}</span>
                          <span className="topic-chip uppercase font-bold">{activePrompt.promptType}</span>
                        </div>

                        <p className="text-base font-medium leading-relaxed bg-muted/30 p-5 rounded-xl text-foreground">
                          "{activePrompt.prompt}"
                        </p>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="secondary-button text-xs"
                            onClick={() => { setPrepSeconds(30); setPrepActive(true); }}
                          >
                            <Clock3 className="w-3.5 h-3.5" /> {prepActive ? `Preparation Time: ${prepSeconds}s remaining` : 'Start 30s Preparation Timer'}
                          </button>
                        </div>

                        <AudioRecorder maxDurationSeconds={90} />

                        <div className="pt-4 flex justify-between border-t border-border">
                          <button
                            type="button"
                            disabled={currentSpeakingIdx === 0}
                            onClick={() => { setCurrentSpeakingIndex((i) => i - 1); setPrepActive(false); }}
                            className="secondary-button"
                          >
                            Previous Prompt
                          </button>

                          {currentSpeakingIdx < speakingQuestions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => { setCurrentSpeakingIndex((i) => i + 1); setPrepActive(false); }}
                              className="primary-button"
                            >
                              Next Prompt <ChevronRight />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSpeakingView('result')}
                              className="primary-button"
                            >
                              Submit Speaking Set <ArrowUpRight />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {speakingView === 'result' && (
                <div className="space-y-6">
                  <button className="back-link" onClick={() => setSpeakingView('sets')}><ChevronRight className="rotate-180" /> Speaking Sets</button>
                  <div className="border rounded-2xl p-6 bg-card space-y-6">
                    <div>
                      <span className="eyebrow">Speaking Assessment Complete</span>
                      <h1 className="assessment-heading">Speech Evaluation Report</h1>
                    </div>

                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-muted-foreground block">Overall Speaking Score</span>
                        <strong className="text-3xl font-extrabold text-foreground">82%</strong>
                      </div>
                      <div className="text-right text-xs space-y-1 font-medium">
                        <div>Fluency: <strong>16/20</strong></div>
                        <div>Pronunciation: <strong>17/20</strong></div>
                        <div>Vocabulary: <strong>16/20</strong></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="eyebrow">Evaluation Breakdown</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 border rounded-lg bg-muted/20"><span>Fluency & Coherence:</span> <strong className="block text-foreground text-sm mt-1">16 / 20</strong></div>
                        <div className="p-3 border rounded-lg bg-muted/20"><span>Pronunciation:</span> <strong className="block text-foreground text-sm mt-1">17 / 20</strong></div>
                        <div className="p-3 border rounded-lg bg-muted/20"><span>Grammar Accuracy:</span> <strong className="block text-foreground text-sm mt-1">16 / 20</strong></div>
                        <div className="p-3 border rounded-lg bg-muted/20"><span>Vocabulary Range:</span> <strong className="block text-foreground text-sm mt-1">16 / 20</strong></div>
                        <div className="p-3 border rounded-lg bg-muted/20"><span>Topic Relevance:</span> <strong className="block text-foreground text-sm mt-1">18 / 20</strong></div>
                      </div>
                    </div>

                    <button className="primary-button" onClick={() => setSpeakingView('sets')}>Return to Speaking Sets <ArrowUpRight /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 2. READING TAB */}
      {mainTab === 'Reading' && (
        <section className="module-content">
          {readingView === 'sets' && (
            <div>
              <div className="module-section-heading">
                <div>
                  <p className="eyebrow text-muted-foreground">Reading</p>
                  <h2 className="section-title">Reading Practice Sets (400 MCQs)</h2>
                  <p className="module-description">20 Sets · 2 Passages per set (~300 words each) · 20-minute timer per set</p>
                </div>
              </div>

              {loadingSets ? (
                <p className="py-8 text-center text-muted-foreground">Loading Reading practice sets...</p>
              ) : (
                <div className="set-grid">
                  {readingSets.map((s) => (
                    <button
                      key={s.id}
                      className={`set-card ${s.locked ? 'set-locked' : ''}`}
                      onClick={() => openReadingSet(s)}
                    >
                      <span className="eyebrow">Reading Set {String(s.setNumber).padStart(2, '0')}</span>
                      <h3>{s.name}</h3>
                      {s.locked ? (
                        <>
                          <span className="lock-badge">Premium</span>
                          <p className="set-meta">Unlock with PrepVvise Premium</p>
                          <span className="set-action">Unlock ₹59 <ArrowUpRight /></span>
                        </>
                      ) : (
                        <>
                          <p className="set-meta">2 Passages · 20 MCQs · {s.difficulty.toUpperCase()}</p>
                          <p className="set-meta">Time limit: 20 min · Best score: {s.bestScore !== null && s.bestScore !== undefined ? `${s.bestScore}%` : '—'}</p>
                          <span className="set-action">Start Reading <ArrowUpRight /></span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {readingView === 'details' && (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setReadingView('sets')}><ChevronRight className="rotate-180" /> Back to Reading sets</button>
              <div className="border rounded-2xl p-6 bg-card space-y-4">
                <span className="eyebrow">Set Details · {selectedReadingSet?.name}</span>
                <h1 className="assessment-heading">{selectedReadingSet?.name}</h1>
                <p className="assessment-lede">You will read 2 passages (~300 words each) and answer 10 MCQ questions for each passage (20 total questions) within a single 20-minute timer.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 text-xs font-semibold">
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Passages:</span> <strong className="block text-foreground text-sm mt-1">2 Passages</strong></div>
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Questions:</span> <strong className="block text-foreground text-sm mt-1">20 MCQs</strong></div>
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Time Limit:</span> <strong className="block text-foreground text-sm mt-1">20 Minutes</strong></div>
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Navigation:</span> <strong className="block text-foreground text-sm mt-1">Sequential</strong></div>
                </div>

                <button className="primary-button" onClick={startReadingSet}>Start Reading Assessment <ArrowUpRight /></button>
              </div>
            </div>
          )}

          {readingView === 'passage1' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="eyebrow">Reading Assessment · Passage 1 of 2</span>
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${readingSeconds < 300 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                  <Clock3 className="w-3.5 h-3.5 inline mr-1" /> {formatTimer(readingSeconds)} remaining
                </span>
              </div>

              <div className="border rounded-2xl p-6 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{p1.title}</h2>
                  <span className="topic-chip uppercase">{p1.type} · {p1.wordCount} words</span>
                </div>

                <div className="p-5 border rounded-xl bg-muted/20 text-sm leading-relaxed text-foreground font-serif whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {p1.text}
                </div>

                <div className="pt-2 flex justify-end">
                  <button className="primary-button" onClick={() => setReadingView('questions1')}>
                    Proceed to Questions 1–10 <ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {readingView === 'questions1' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="eyebrow">Passage 1 Questions (1–10)</span>
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${readingSeconds < 300 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                  <Clock3 className="w-3.5 h-3.5 inline mr-1" /> {formatTimer(readingSeconds)} remaining
                </span>
              </div>

              <div className="space-y-6">
                {(p1.questions || []).map((q: any, idx: number) => (
                  <div key={q.id} className="border rounded-xl p-5 bg-card space-y-3">
                    <strong className="text-sm text-foreground font-semibold block">
                      Q{idx + 1}. {q.question}
                    </strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {(q.options || []).map((opt: any) => {
                        const isSelected = readingAnswers[q.id] === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectReadingAnswer(q.id, opt.id)}
                            className={`p-3 rounded-lg border text-left flex items-start gap-2 transition-colors ${isSelected ? 'border-primary bg-primary/10 font-bold text-foreground' : 'border-border bg-card hover:bg-muted/40'}`}
                          >
                            <span className="font-mono font-bold">{opt.id}.</span>
                            <span>{opt.text}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-4 flex justify-between border-t border-border">
                  <button className="secondary-button" onClick={() => setReadingView('passage1')}>Back to Passage 1</button>
                  <button className="primary-button" onClick={() => setReadingView('passage2')}>
                    Proceed to Passage 2 <ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {readingView === 'passage2' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="eyebrow">Reading Assessment · Passage 2 of 2</span>
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${readingSeconds < 300 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                  <Clock3 className="w-3.5 h-3.5 inline mr-1" /> {formatTimer(readingSeconds)} remaining
                </span>
              </div>

              <div className="border rounded-2xl p-6 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{p2.title}</h2>
                  <span className="topic-chip uppercase">{p2.type} · {p2.wordCount} words</span>
                </div>

                <div className="p-5 border rounded-xl bg-muted/20 text-sm leading-relaxed text-foreground font-serif whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {p2.text}
                </div>

                <div className="pt-2 flex justify-between">
                  <button className="secondary-button" onClick={() => setReadingView('questions1')}>Back to Passage 1 Questions</button>
                  <button className="primary-button" onClick={() => setReadingView('questions2')}>
                    Proceed to Questions 11–20 <ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {readingView === 'questions2' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="eyebrow">Passage 2 Questions (11–20)</span>
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${readingSeconds < 300 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                  <Clock3 className="w-3.5 h-3.5 inline mr-1" /> {formatTimer(readingSeconds)} remaining
                </span>
              </div>

              <div className="space-y-6">
                {(p2.questions || []).map((q: any, idx: number) => (
                  <div key={q.id} className="border rounded-xl p-5 bg-card space-y-3">
                    <strong className="text-sm text-foreground font-semibold block">
                      Q{idx + 11}. {q.question}
                    </strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {(q.options || []).map((opt: any) => {
                        const isSelected = readingAnswers[q.id] === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectReadingAnswer(q.id, opt.id)}
                            className={`p-3 rounded-lg border text-left flex items-start gap-2 transition-colors ${isSelected ? 'border-primary bg-primary/10 font-bold text-foreground' : 'border-border bg-card hover:bg-muted/40'}`}
                          >
                            <span className="font-mono font-bold">{opt.id}.</span>
                            <span>{opt.text}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-4 flex justify-between border-t border-border">
                  <button className="secondary-button" onClick={() => setReadingView('passage2')}>Back to Passage 2</button>
                  <button className="primary-button" onClick={submitReadingSet}>
                    Submit Reading Set <ArrowUpRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {readingView === 'result' && (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setReadingView('sets')}><ChevronRight className="rotate-180" /> Reading Sets</button>
              <div className="border rounded-2xl p-6 bg-card space-y-6">
                <div>
                  <span className="eyebrow">Reading Assessment Complete</span>
                  <h1 className="assessment-heading">{readingResult?.scorePct >= 70 ? 'Great Reading Performance!' : 'Review and Practice'}</h1>
                </div>

                <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground block">Reading Score</span>
                    <strong className="text-3xl font-extrabold text-foreground">{readingResult?.scorePct}%</strong>
                    <p className="text-xs text-muted-foreground mt-1">{readingResult?.correctCount} / {readingResult?.totalQuestions} Questions Correct</p>
                  </div>
                  <div className="text-right text-xs space-y-1 font-medium">
                    <div>Correct: <strong className="text-emerald-600 dark:text-emerald-400">{readingResult?.correctCount}</strong></div>
                    <div>Incorrect: <strong className="text-rose-600 dark:text-rose-400">{readingResult?.incorrectCount}</strong></div>
                    <div>Unanswered: <strong>{readingResult?.unansweredCount}</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-4 border rounded-xl bg-muted/30">
                    <span className="text-muted-foreground block mb-1">Passage 1 Performance</span>
                    <strong className="text-base text-foreground">{readingResult?.p1Correct} / {(p1.questions || []).length} Correct</strong>
                  </div>
                  <div className="p-4 border rounded-xl bg-muted/30">
                    <span className="text-muted-foreground block mb-1">Passage 2 Performance</span>
                    <strong className="text-base text-foreground">{readingResult?.p2Correct} / {(p2.questions || []).length} Correct</strong>
                  </div>
                </div>

                <button className="primary-button" onClick={() => setReadingView('sets')}>Return to Reading Sets <ArrowUpRight /></button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. WRITING TAB */}
      {mainTab === 'Writing' && (
        <section className="module-content">
          {writingView === 'sets' && (
            <div>
              <div className="module-section-heading">
                <div>
                  <p className="eyebrow text-muted-foreground">Writing</p>
                  <h2 className="section-title">Writing Practice Sets (20 Sets)</h2>
                  <p className="module-description">2 Tasks per set (Essay + Article) · Max 200 words per response · 30-minute timer · AI evaluation</p>
                </div>
              </div>

              {loadingSets ? (
                <p className="py-8 text-center text-muted-foreground">Loading Writing practice sets...</p>
              ) : (
                <div className="set-grid">
                  {writingSets.map((s) => (
                    <button
                      key={s.id}
                      className={`set-card ${s.locked ? 'set-locked' : ''}`}
                      onClick={() => openWritingSet(s)}
                    >
                      <span className="eyebrow">Writing Set {String(s.setNumber).padStart(2, '0')}</span>
                      <h3>{s.name}</h3>
                      {s.locked ? (
                        <>
                          <span className="lock-badge">Premium</span>
                          <p className="set-meta">Unlock with PrepVvise Premium</p>
                          <span className="set-action">Unlock ₹59 <ArrowUpRight /></span>
                        </>
                      ) : (
                        <>
                          <p className="set-meta">1 Essay + 1 Article · Max 200 words each</p>
                          <p className="set-meta">Time limit: 30 min · Best score: {s.bestScore !== null && s.bestScore !== undefined ? `${s.bestScore}%` : '—'}</p>
                          <span className="set-action">Start Writing <ArrowUpRight /></span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {writingView === 'details' && (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setWritingView('sets')}><ChevronRight className="rotate-180" /> Back to Writing sets</button>
              <div className="border rounded-2xl p-6 bg-card space-y-4">
                <span className="eyebrow">Set Details · {selectedWritingSet?.name}</span>
                <h1 className="assessment-heading">{selectedWritingSet?.name}</h1>
                <p className="assessment-lede">You will respond to 2 contextual writing prompts (1 Essay and 1 Article) with a 200-word limit per response within 30 minutes. Responses will receive automated AI evaluation across 7 key criteria.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 text-xs font-semibold">
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Tasks:</span> <strong className="block text-foreground text-sm mt-1">Essay + Article</strong></div>
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Word Cap:</span> <strong className="block text-foreground text-sm mt-1">200 Words / Task</strong></div>
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Time Limit:</span> <strong className="block text-foreground text-sm mt-1">30 Minutes</strong></div>
                  <div className="p-3 border rounded-xl bg-muted/30"><span>Evaluation:</span> <strong className="block text-foreground text-sm mt-1">AI Evaluated</strong></div>
                </div>

                <button className="primary-button" onClick={startWritingSet}>Start Writing Assessment <ArrowUpRight /></button>
              </div>
            </div>
          )}

          {writingView === 'workspace' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="eyebrow">Writing Workspace · {selectedWritingSet?.name}</span>
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${writingSeconds < 300 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-foreground'}`}>
                  <Clock3 className="w-3.5 h-3.5 inline mr-1" /> {formatTimer(writingSeconds)} remaining
                </span>
              </div>

              {/* Task 1: Essay */}
              <div className="border rounded-2xl p-6 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Task 1: Essay Prompt</span>
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${essayWordCount > 200 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-muted-foreground'}`}>
                    Words: {essayWordCount} / 200
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed bg-muted/30 p-4 rounded-xl text-foreground">
                  {writingQuestions?.essay?.prompt}
                </p>

                <textarea
                  value={essayResponse}
                  onChange={(e) => setEssayResponse(e.target.value)}
                  placeholder="Write your essay response here (maximum 200 words)..."
                  rows={6}
                  className="w-full p-4 border rounded-xl bg-background text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans resize-y"
                />
              </div>

              {/* Task 2: Article */}
              <div className="border rounded-2xl p-6 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Task 2: Article Prompt</span>
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${articleWordCount > 200 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-muted text-muted-foreground'}`}>
                    Words: {articleWordCount} / 200
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed bg-muted/30 p-4 rounded-xl text-foreground">
                  {writingQuestions?.article?.prompt}
                </p>

                <textarea
                  value={articleResponse}
                  onChange={(e) => setArticleResponse(e.target.value)}
                  placeholder="Write your article response here (maximum 200 words)..."
                  rows={6}
                  className="w-full p-4 border rounded-xl bg-background text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans resize-y"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  className="primary-button"
                  onClick={submitWritingSet}
                  disabled={evaluatingWriting || (essayWordCount === 0 && articleWordCount === 0)}
                >
                  {evaluatingWriting ? 'Evaluating with AI...' : 'Submit Writing Set'} <ArrowUpRight />
                </button>
              </div>
            </div>
          )}

          {writingView === 'result' && (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setWritingView('sets')}><ChevronRight className="rotate-180" /> Writing Sets</button>
              <div className="border rounded-2xl p-6 bg-card space-y-6">
                <div>
                  <span className="eyebrow">Writing Evaluation Complete</span>
                  <h1 className="assessment-heading">{writingEvalResult?.overallScore >= 70 ? 'Strong Communication Skills!' : 'Review Feedback and Refine'}</h1>
                </div>

                <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground block">Overall Writing Score</span>
                    <strong className="text-3xl font-extrabold text-foreground">{writingEvalResult?.overallScore}%</strong>
                  </div>
                  <div className="text-right text-xs space-y-1 font-medium">
                    <div>Essay Score: <strong>{writingEvalResult?.evaluation?.essay?.score || 80}%</strong></div>
                    <div>Article Score: <strong>{writingEvalResult?.evaluation?.article?.score || 76}%</strong></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="eyebrow">Criteria Evaluation Breakdown</span>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 border rounded-lg bg-muted/20"><span>Grammar:</span> <strong className="block text-foreground text-sm mt-1">{writingEvalResult?.evaluation?.essay?.grammar || 16} / 20</strong></div>
                    <div className="p-3 border rounded-lg bg-muted/20"><span>Vocabulary:</span> <strong className="block text-foreground text-sm mt-1">{writingEvalResult?.evaluation?.essay?.vocabulary || 15} / 20</strong></div>
                    <div className="p-3 border rounded-lg bg-muted/20"><span>Organization:</span> <strong className="block text-foreground text-sm mt-1">{writingEvalResult?.evaluation?.essay?.organization || 17} / 20</strong></div>
                    <div className="p-3 border rounded-lg bg-muted/20"><span>Relevance:</span> <strong className="block text-foreground text-sm mt-1">{writingEvalResult?.evaluation?.essay?.relevance || 17} / 20</strong></div>
                    <div className="p-3 border rounded-lg bg-muted/20"><span>Clarity:</span> <strong className="block text-foreground text-sm mt-1">{writingEvalResult?.evaluation?.essay?.clarity || 15} / 20</strong></div>
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-muted/20 space-y-3 text-xs">
                  <span className="eyebrow">AI Evaluator Feedback</span>
                  <p className="text-foreground leading-relaxed font-medium">{writingEvalResult?.evaluation?.overallFeedback || 'Solid writing effort across both prompts.'}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">✓ Key Strengths</strong>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {(writingEvalResult?.evaluation?.strengths || ['Clear adherence to prompt requirements']).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-amber-600 dark:text-amber-400 block mb-1">→ Areas for Improvement</strong>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {(writingEvalResult?.evaluation?.improvements || ['Enhance vocabulary variety']).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <button className="primary-button" onClick={() => setWritingView('sets')}>Return to Writing Sets <ArrowUpRight /></button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}


function DebuggingModule({ onBack, isPremium, onPremium }: { onBack: () => void; isPremium: boolean; onPremium: () => void }) {
  const [tab, setTab] = useState<'Learn' | 'Practice'>('Practice')
  const [view, setView] = useState<'sets' | 'intro' | 'lab' | 'result'>('sets')
  const [sets, setSets] = useState<Array<{
    id: string
    setNumber: number
    name: string
    access: 'free' | 'premium'
    type: string
    status: string
    category: string | null
    difficulty: string | null
    durationMinutes: number
    totalMarks: number | null
    attemptLimit: number | null
    problemCount: number
    bestScore?: number | null
    attemptsCount?: number
    attemptsLeft?: number | null
    locked: boolean
  }>>([])
  const [loadingSets, setLoadingSets] = useState(true)
  const [selectedSet, setSelectedSet] = useState<any>(null)
  const [setProblems, setSetProblems] = useState<Array<{
    id: string
    slug: string
    title: string
    statement: string
    difficulty: string
    topic: string
    position: number
    marks: number
    languages: string[]
    starterCode: Record<string, string>
    buggyCode: Record<string, string>
    explanation: string | null
    sampleCases: Array<{ name: string; stdin: string; expectedOutput: string }>
    hiddenCaseCount: number
  }>>([])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [language, setLanguage] = useState<string>('c')
  const [code, setCode] = useState('')
  const [attempt, setAttempt] = useState<any>(null)
  const [seconds, setSeconds] = useState(20 * 60)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [execStatusMessage, setExecStatusMessage] = useState('')
  const [runResult, setRunResult] = useState<any>(null)
  const [submissionScore, setSubmissionScore] = useState<any>(null)
  const [error, setError] = useState('')

  // Fetch debugging practice sets dynamically from database API
  useEffect(() => {
    async function loadSets() {
      setLoadingSets(true)
      try {
        const res = await fetch('/api/debugging/sets')
        if (res.ok) {
          const data = await res.json()
          setSets(data.sets || [])
        } else {
          setError('Unable to load debugging sets.')
        }
      } catch {
        setError('Unable to load debugging sets.')
      } finally {
        setLoadingSets(false)
      }
    }
    loadSets()
  }, [])

  // Countdown timer derived from attempt expiresAt timestamp
  useEffect(() => {
    if (view !== 'lab' || !attempt?.expiresAt || seconds <= 0) return
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000))
      setSeconds(remaining)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [view, attempt, seconds])

  const currentProblem = setProblems[currentProblemIndex] || null

  const selectLanguage = (newLang: string) => {
    setLanguage(newLang)
    setRunResult(null)
    setExecStatusMessage('')
    if (currentProblem) {
      const buggyMap = currentProblem.buggyCode || {}
      const starterMap = currentProblem.starterCode || {}
      setCode(buggyMap[newLang] || starterMap[newLang] || Object.values(buggyMap)[0] || Object.values(starterMap)[0] || '')
    }
  }

  const selectProblemIndex = (idx: number) => {
    if (idx < 0 || idx >= setProblems.length) return
    setCurrentProblemIndex(idx)
    setRunResult(null)
    setExecStatusMessage('')
    const prob = setProblems[idx]
    if (prob) {
      const langs = prob.languages && prob.languages.length ? prob.languages : ['python', 'cpp', 'java']
      const activeLang = langs.includes(language) ? language : langs[0]
      setLanguage(activeLang)
      setCode(prob.buggyCode[activeLang] || prob.starterCode[activeLang] || Object.values(prob.buggyCode)[0] || '')
    }
  }

  const openSet = async (setItem: any) => {
    if (setItem.locked && !isPremium) {
      onPremium()
      return
    }
    setError('')
    setSelectedSet(setItem)
    setView('intro')
    try {
      const res = await fetch(`/api/debugging/sets/${setItem.id}`)
      if (res.ok) {
        const data = await res.json()
        const probs = data.problems || []
        setSetProblems(probs)
        if (probs.length > 0) {
          const p = probs[0]
          const availableLangs = p.languages && p.languages.length ? p.languages : ['python', 'cpp', 'java']
          const defaultLang = availableLangs[0] || 'python'
          setLanguage(defaultLang)
          setCode(p.buggyCode[defaultLang] || p.starterCode[defaultLang] || Object.values(p.buggyCode)[0] || '')
        }
      } else {
        const errData = await res.json()
        setError(errData.error || 'Failed to fetch set details.')
      }
    } catch {
      setError('Failed to fetch set details.')
    }
  }

  const startLab = async () => {
    if (!selectedSet) return
    setError('')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ practiceSetId: selectedSet.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Unable to start attempt.')
        return
      }
      const data = await res.json()
      setAttempt(data)
      const initialSeconds = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
      setSeconds(initialSeconds)
      setCurrentProblemIndex(0)
      setRunResult(null)
      setExecStatusMessage('')
      setView('lab')
    } catch {
      setError('Unable to start attempt.')
    }
  }

  const handleRunCode = async () => {
    if (!attempt || !currentProblem || !code.trim()) return
    setRunning(true)
    setError('')
    setExecStatusMessage('Initializing Web Worker execution...')
    try {
      const tcRes = await fetch(`/api/attempts/${attempt.id}/testcases?problemId=${currentProblem.id}`)
      let sampleCases = currentProblem.sampleCases || []
      if (tcRes.ok) {
        const tcData = await tcRes.json()
        if (tcData.sampleCases?.length) {
          sampleCases = tcData.sampleCases
        }
      }

      const res = await testRunner.runTests({
        language,
        sourceCode: code,
        testCases: sampleCases.map((c: any) => ({
          id: c.id || c.name,
          input: c.stdin || c.input || '',
          expectedOutput: c.expectedOutput || c.output || '',
          hidden: false,
          name: c.name,
        })),
        onStatusUpdate: (msg) => setExecStatusMessage(msg),
      })

      setRunResult({
        total: res.total,
        passed: res.passed,
        verdict: res.verdict,
        totalExecutionTimeMs: res.totalExecutionTimeMs,
        results: res.testResults?.map((tr) => ({
          name: tr.name,
          passed: tr.passed,
          received: tr.actualOutput,
          stderr: tr.stderr,
          status: tr.status,
          executionTimeMs: tr.executionTimeMs,
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution request failed.')
    } finally {
      setRunning(false)
      setExecStatusMessage('')
    }
  }

  const handleSubmitChallenge = async () => {
    if (!attempt || !currentProblem || !code.trim()) return
    setSubmitting(true)
    setError('')
    setExecStatusMessage('Preparing test execution suite...')
    try {
      const tcRes = await fetch(`/api/attempts/${attempt.id}/testcases?problemId=${currentProblem.id}`)
      if (!tcRes.ok) {
        throw new Error('Unable to retrieve problem test suite.')
      }
      const tcData = await tcRes.json()
      const allCases = tcData.allCases || []

      const res = await testRunner.runTests({
        language,
        sourceCode: code,
        testCases: allCases,
        onStatusUpdate: (msg) => setExecStatusMessage(msg),
      })

      const submitRes = await fetch(`/api/attempts/${attempt.id}/coding`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          problemId: currentProblem.id,
          language,
          sourceCode: code,
          isSampleOnly: false,
          clientResult: {
            verdict: res.verdict,
            passed: res.passed,
            total: res.total,
            testResults: res.testResults,
            totalExecutionTimeMs: res.totalExecutionTimeMs,
          },
        }),
      })

      if (!submitRes.ok) {
        const errData = await submitRes.json()
        throw new Error(errData.error || 'Submission recording failed.')
      }

      await fetch(`/api/attempts/${attempt.id}/submit`, { method: 'POST' })

      setSubmissionScore({
        passed: res.passed,
        total: res.total,
        verdict: res.verdict,
        totalExecutionTimeMs: res.totalExecutionTimeMs,
      })
      setView('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(false)
      setExecStatusMessage('')
    }
  }

  const handleStopExecution = () => {
    executionManager.stopExecution(language)
    setRunning(false)
    setSubmitting(false)
    setExecStatusMessage('')
    setError('Execution stopped by user.')
  }

  const resetCode = () => {
    if (currentProblem) {
      const buggyMap = currentProblem.buggyCode || {}
      const starterMap = currentProblem.starterCode || {}
      setCode(buggyMap[language] || starterMap[language] || '')
      setRunResult(null)
      setExecStatusMessage('')
      setError('')
    }
  }

  const timerLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  if (view === 'lab' && currentProblem) {
    const sampleCases = currentProblem.sampleCases || []
    return (
      <section className="debug-lab-screen">
        <div className="debug-lab-top">
          <button className="back-link" onClick={() => setView('sets')}>
            <ChevronRight className="rotate-180" /> Exit lab
          </button>
          <div>
            <p className="eyebrow">Debugging Lab · {selectedSet?.name || 'Practice'}</p>
            <strong>Question {String(currentProblemIndex + 1).padStart(2, '0')} / {String(setProblems.length).padStart(2, '0')}</strong>
          </div>
          <div className={`debug-timer ${seconds < 300 ? 'warning' : ''}`}>
            <Clock3 /> {timerLabel} remaining
          </div>
        </div>

        {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">{error}</div>}

        <div className="debug-lab-grid">
          <article className="debug-problem">
            <div className="debug-panel-heading">
              <span className="eyebrow">Problem</span>
              <span className="topic-chip">{currentProblem.topic}</span>
            </div>
            <h2>{currentProblem.title}</h2>

            {(() => {
              const { description, debugTask, bugCategory } = parseStatement(currentProblem.statement)
              return (
                <div className="space-y-4 my-4">
                  <p className="text-sm leading-relaxed text-foreground font-medium">{description}</p>

                  {debugTask && (
                    <div className="p-3.5 rounded-lg bg-secondary/80 border border-border/80 text-xs leading-relaxed">
                      <strong className="block text-muted-foreground uppercase tracking-wider text-[10px] font-bold mb-1">🛠️ Debug Task</strong>
                      <span className="text-foreground font-medium">{debugTask}</span>
                    </div>
                  )}

                  {bugCategory && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/50 text-xs font-semibold">
                      <span className="text-muted-foreground">Bug Category:</span>
                      <span className="text-foreground">{bugCategory}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="debug-section mt-6">
              <span className="eyebrow block mb-3">Sample Test Cases</span>
              <div className="space-y-3">
                {sampleCases.map((tc, idx) => {
                  const res = runResult?.results?.[idx]
                  return (
                    <div key={idx} className="border rounded-lg p-3.5 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground">{tc.name || `Sample Case ${idx + 1}`}</span>
                        {res && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${res.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                            {res.passed ? '✓ Passed' : '✕ Failed'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="bg-card border rounded p-2">
                          <span className="text-[10px] font-sans text-muted-foreground block uppercase font-bold mb-1">Input (stdin)</span>
                          <code className="text-foreground block font-mono whitespace-pre-wrap">{tc.stdin || '(empty)'}</code>
                        </div>
                        <div className="bg-card border rounded p-2">
                          <span className="text-[10px] font-sans text-muted-foreground block uppercase font-bold mb-1">Expected Output</span>
                          <code className="text-foreground block font-mono whitespace-pre-wrap">{tc.expectedOutput || '(empty)'}</code>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {setProblems.length > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-line">
                <button
                  className="secondary-button"
                  disabled={currentProblemIndex === 0}
                  onClick={() => selectProblemIndex(currentProblemIndex - 1)}
                >
                  Previous problem
                </button>
                <button
                  className="secondary-button"
                  disabled={currentProblemIndex === setProblems.length - 1}
                  onClick={() => selectProblemIndex(currentProblemIndex + 1)}
                >
                  Next problem
                </button>
              </div>
            )}
          </article>

          <article className="debug-editor-panel">
            <div className="debug-panel-heading">
              <span className="eyebrow"><FileCode2 /> Code editor</span>
              <select value={language} onChange={(e) => selectLanguage(e.target.value)} aria-label="Choose language">
                {(currentProblem.languages?.length ? currentProblem.languages : ['c', 'cpp', 'java', 'python', 'javascript']).map((lang) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="editor-shell">
              <div className="line-numbers">
                {code.split('\n').map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                aria-label="Buggy code editor"
              />
            </div>

            <div className="editor-note">
              <Terminal /> AI assistance is off during the assessment. Find the bug independently.
            </div>

            {execStatusMessage && (
              <div className="p-2.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-2 mb-3">
                <span className="animate-spin text-amber-500">⚙️</span>
                <span>{execStatusMessage}</span>
              </div>
            )}

            <div className="test-results">
              <div className="debug-panel-heading">
                <span className="eyebrow">Test results</span>
                <span>{runResult ? `${runResult.passed || 0} / ${runResult.total || sampleCases.length} sample passed` : 'Not run yet'}</span>
              </div>
              {runResult?.results && (
                <div className="result-lines">
                  {runResult.results.map((r: any, idx: number) => (
                    <span key={idx} className={r.passed ? 'pass' : 'fail'}>
                      {r.passed ? <CheckCircle2 /> : <AlertTriangle />} {r.name} · {r.passed ? 'Passed' : `Received: ${r.received || r.stderr || 'Mismatch'}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="debug-actions">
              <button className="secondary-button" onClick={resetCode} disabled={running || submitting}>
                <RotateCcw /> Reset code
              </button>
              {(running || submitting) ? (
                <button className="secondary-button text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800" onClick={handleStopExecution}>
                  <Square className="w-4 h-4 fill-current" /> Stop
                </button>
              ) : (
                <button className="secondary-button" onClick={handleRunCode}>
                  <Play /> Run code
                </button>
              )}
              <button className="primary-button" onClick={handleSubmitChallenge} disabled={running || submitting}>
                {submitting ? 'Submitting...' : 'Submit challenge'} <ArrowUpRight />
              </button>
            </div>
          </article>
        </div>
      </section>
    )
  }

  if (view === 'result') {
    const passed = submissionScore?.passed || 0
    const total = submissionScore?.total || 1
    const pct = Math.round((passed / total) * 100)
    return (
      <section className="debug-result">
        <button className="back-link" onClick={() => setView('sets')}><ChevronRight className="rotate-180" /> Debugging</button>
        <p className="eyebrow text-muted-foreground">Debugging complete · {selectedSet?.name}</p>
        <h1 className="assessment-heading">{pct >= 70 ? 'Challenge completed!' : 'Review and try again.'}</h1>
        <p className="assessment-lede">Your code was evaluated against visible and hidden test cases.</p>

        <div className="debug-score-card">
          <div>
            <span className="eyebrow">Final score</span>
            <strong>{pct}%</strong>
            <p>{passed} / {total} test cases passed</p>
          </div>
          <div className="debug-result-stats">
            <span><b>✓</b> Compilation</span>
            <span><b>{passed} / {total}</b> Total tests</span>
            <span><b>Language</b> {language.toUpperCase()}</span>
            <span><b>Status</b> {pct >= 70 ? 'Passed' : 'Failed'}</span>
          </div>
        </div>

        <div className="debug-result-grid">
          <div className="analysis-card">
            <p className="eyebrow">Your submitted solution</p>
            <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{code}</pre>
          </div>
          <div className="analysis-card">
            <p className="eyebrow">AI debugging feedback</p>
            <p>{currentProblem?.explanation || 'Great effort! Test edge cases thoroughly and verify loop boundary conditions.'}</p>
            <span className="ai-label">AI feedback · automated scoring</span>
          </div>
          <div className="analysis-card">
            <p className="eyebrow">Skill signals</p>
            <p>Bug identification <b>{Math.min(100, pct + 10)}%</b></p>
            <p>Edge cases <b>{pct}%</b></p>
            <p>Code validation <b>{pct}%</b></p>
          </div>
        </div>

        <div className="result-actions">
          <button className="primary-button" onClick={() => setView('sets')}>Return to sets <ArrowUpRight /></button>
        </div>
      </section>
    )
  }

  if (view === 'intro') {
    return (
      <section className="debug-intro">
        <button className="back-link" onClick={() => setView('sets')}><ChevronRight className="rotate-180" /> Debugging</button>
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">{error}</div>}
        <div className="debug-intro-grid">
          <div>
            <p className="eyebrow text-muted-foreground">Debugging Lab</p>
            <h1 className="assessment-heading">{selectedSet?.name || 'Debugging Challenge'}</h1>
            <p className="assessment-lede">You will receive working-looking code with bug(s). Inspect it, run tests, and fix the errors.</p>
            <div className="debug-meta">
              <span>{setProblems.length || selectedSet?.problemCount || 1} Problem{setProblems.length === 1 ? '' : 's'}</span>
              <span>{selectedSet?.durationMinutes || 20} Minutes</span>
              <span>{selectedSet?.difficulty || 'Medium'}</span>
            </div>
          </div>
          <div className="assessment-summary">
            <p className="eyebrow">Select language</p>
            <div className="language-picker">
              {['c', 'cpp', 'java', 'python', 'javascript'].map((item) => (
                <button
                  className={language === item ? 'selected' : ''}
                  key={item}
                  onClick={() => selectLanguage(item)}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="selected-language">Selected language: <strong>{language.toUpperCase()}</strong></p>
            <button className="primary-button" onClick={startLab}>Start debugging <ArrowUpRight /></button>
          </div>
        </div>
        <div className="debug-rules">
          <span><LockKeyhole /> AI assistance off</span>
          <span><CheckCircle2 /> Visible + hidden test cases</span>
          <span><Clock3 /> Timer starts on launch</span>
        </div>
      </section>
    )
  }

  const focusedSets = sets.filter((s) => s.type === 'focused' || s.setNumber <= 10)
  const mixedSets = sets.filter((s) => s.type !== 'focused' && s.setNumber > 10)

  return (
    <section className="debug-module">
      <button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> Assessment journey</button>
      <div className="module-hero stage-lavender">
        <div className="module-hero-copy">
          <p className="eyebrow">Debugging module</p>
          <h1 className="module-title">Debugging Lab</h1>
          <p className="module-subtitle">DSA · Logic tracing · Runtime errors</p>
          <button className="primary-button" onClick={() => sets[0] && openSet(sets[0])}>Start practice <ArrowUpRight /></button>
        </div>
        <div className="module-progress">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">{isPremium ? 'Premium unlocked' : 'Free plan'}</span>
            <strong>Database Driven</strong>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{sets.length} sets available from Database</p>
          <div className="progress-track"><div style={{ width: '100%' }} /></div>
          <div className="module-stats">
            <div><strong>{sets.length}</strong><span>sets</span></div>
            <div><strong>DSA</strong><span>focused</span></div>
            <div><strong>5</strong><span>languages</span></div>
          </div>
        </div>
      </div>

      <div className="module-tabs">
        {(['Learn', 'Practice'] as const).map((item) => (
          <button key={item} className={`module-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === 'Practice' && (
        <>
          <div className="module-section-heading">
            <div>
              <p className="eyebrow text-muted-foreground">Practice</p>
              <h2 className="section-title">Debugging challenges</h2>
              <p className="module-description">{sets.length} sets · Database driven · Live compiler execution</p>
            </div>
            <span className="topic-chip">AI assistance off</span>
          </div>

          {loadingSets ? (
            <p className="py-8 text-center text-muted-foreground">Loading debugging practice sets from database...</p>
          ) : sets.length === 0 ? (
            <div className="p-8 text-center border border-line rounded-xl">
              <p className="text-muted-foreground">No debugging sets published yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Use the Admin Panel to create practice sets and problems.</p>
            </div>
          ) : (
            <>
              <p className="practice-intro">Start with focused DSA debugging, then move into mixed challenges with subtler bugs.</p>
              {focusedSets.length > 0 && (
                <>
                  <h3 className="subsection-title">Focused debugging <span>Sets 01–{focusedSets.length}</span></h3>
                  <div className="set-grid">
                    {focusedSets.map((s) => (
                      <button
                        key={s.id}
                        className={`set-card ${s.locked ? 'set-locked' : ''}`}
                        onClick={() => openSet(s)}
                      >
                        <div className="flex items-start justify-between">
                          <span className="stage-number">{String(s.setNumber).padStart(2, '0')}</span>
                          {s.locked ? (
                            <span className="lock-badge">{s.access === 'premium' && !isPremium ? 'Premium · ₹59' : 'Attempts Used (3/3)'}</span>
                          ) : (
                            <span className="free-badge">{isPremium && s.access === 'premium' ? 'UNLOCKED' : 'FREE'}</span>
                          )}
                        </div>
                        <h3>{s.name}</h3>
                        <p className="set-meta">{s.problemCount} problem{s.problemCount === 1 ? '' : 's'} · {s.difficulty || 'Medium'} · {s.durationMinutes} minutes</p>
                        <div className="set-footer">
                          <span>Best score <strong>{s.bestScore !== null && s.bestScore !== undefined ? `${s.bestScore}%` : '—'}</strong></span>
                          {!isPremium && s.attemptsLeft !== undefined && s.attemptsLeft !== null && (
                            <span className="text-xs text-muted-foreground font-medium ml-1">({s.attemptsLeft}/3 left)</span>
                          )}
                          {isPremium && (
                            <span className="text-xs text-muted-foreground font-medium ml-1">(Unlimited)</span>
                          )}
                          <span className="set-action">{s.locked ? (s.access === 'premium' && !isPremium ? 'Unlock' : 'Limit Reached') : 'Start practice'} <ArrowUpRight /></span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mixedSets.length > 0 && (
                <>
                  <h3 className="subsection-title">Mixed debugging <span>Sets {focusedSets.length + 1}–{sets.length}</span></h3>
                  <div className="set-grid">
                    {mixedSets.map((s) => (
                      <button
                        key={s.id}
                        className={`set-card ${s.locked ? 'set-locked' : ''}`}
                        onClick={() => openSet(s)}
                      >
                        <div className="flex items-start justify-between">
                          <span className="stage-number">{String(s.setNumber).padStart(2, '0')}</span>
                          {s.locked ? (
                            <span className="lock-badge">{s.access === 'premium' && !isPremium ? 'Premium · ₹59' : 'Attempts Used (3/3)'}</span>
                          ) : (
                            <span className="free-badge">{isPremium && s.access === 'premium' ? 'UNLOCKED' : 'FREE'}</span>
                          )}
                        </div>
                        <h3>{s.name}</h3>
                        <p className="set-meta">{s.problemCount} problem{s.problemCount === 1 ? '' : 's'} · {s.difficulty || 'Medium'} · {s.durationMinutes} minutes</p>
                        <div className="set-footer">
                          <span>Best score <strong>{s.bestScore !== null && s.bestScore !== undefined ? `${s.bestScore}%` : '—'}</strong></span>
                          {!isPremium && s.attemptsLeft !== undefined && s.attemptsLeft !== null && (
                            <span className="text-xs text-muted-foreground font-medium ml-1">({s.attemptsLeft}/3 left)</span>
                          )}
                          {isPremium && (
                            <span className="text-xs text-muted-foreground font-medium ml-1">(Unlimited)</span>
                          )}
                          <span className="set-action">{s.locked ? (s.access === 'premium' && !isPremium ? 'Unlock' : 'Limit Reached') : 'Start practice'} <ArrowUpRight /></span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === 'Learn' && <DebuggingLearnView />}
    </section>
  )
}

function AICodingModule({ onBack, isPremium, onPremium }: { onBack: () => void; isPremium: boolean; onPremium: () => void }) {
  const [tab, setTab] = useState<'Learn' | 'Practice'>('Learn')
  const [screen, setScreen] = useState<'overview' | 'sets' | 'details' | 'instructions' | 'workspace' | 'result'>('overview')
  const [sets, setSets] = useState<Array<any>>([])
  const [loadingSets, setLoadingSets] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selectedSet, setSelectedSet] = useState<any>(null)
  const [selectedProblem, setSelectedProblem] = useState<any>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(40 * 60)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [execStatusMessage, setExecStatusMessage] = useState('')
  const [runResult, setRunResult] = useState<any>(null)
  const [submissionScore, setSubmissionScore] = useState<any>(null)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [hintLevel, setHintLevel] = useState(1)
  const [remainingTurns, setRemainingTurns] = useState(12)
  const [aiLoading, setAiLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [error, setError] = useState('')

  // Load published sets dynamically from database API
  useEffect(() => {
    async function loadSets() {
      setLoadingSets(true)
      try {
        const res = await fetch('/api/ai-coding/sets')
        if (res.ok) {
          const data = await res.json()
          setSets(data.sets || [])
        } else {
          setError('Unable to load AI Coding sets.')
        }
      } catch {
        setError('Unable to load AI Coding sets.')
      } finally {
        setLoadingSets(false)
      }
    }
    loadSets()
  }, [])

  // Countdown timer derived from attempt expiresAt
  useEffect(() => {
    if (screen !== 'workspace' || !attempt?.expiresAt || seconds <= 0) return
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000))
      setSeconds(remaining)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [screen, attempt, seconds])

  const selectLanguage = (newLang: string) => {
    setLanguage(newLang)
    setRunResult(null)
    setExecStatusMessage('')
    if (selectedProblem?.starterCode) {
      const langKey = newLang.toLowerCase()
      setCode(selectedProblem.starterCode[langKey] || selectedProblem.starterCode.javascript || Object.values(selectedProblem.starterCode)[0] || '')
    }
  }

  const openSet = async (setItem: any) => {
    if (setItem.locked && !isPremium) {
      onPremium()
      return
    }
    setError('')
    setSelectedSet(setItem)
    setScreen('details')
    try {
      const res = await fetch(`/api/ai-coding/sets/${setItem.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedProblem(data.problem)
        const initLang = 'javascript'
        setLanguage(initLang)
        setCode(data.problem?.starterCode?.[initLang] || Object.values(data.problem?.starterCode || {})[0] || '')
        if (data.problem?.aiConfig) {
          setRemainingTurns(data.problem.aiConfig.remainingTurns ?? 12)
        }
      } else {
        const errData = await res.json()
        setError(errData.error || 'Failed to fetch set details.')
      }
    } catch {
      setError('Failed to fetch set details.')
    }
  }

  const startLab = async () => {
    if (!selectedSet) return
    setError('')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ practiceSetId: selectedSet.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Unable to start attempt.')
        return
      }
      const data = await res.json()
      setAttempt(data)
      const initialSeconds = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
      setSeconds(initialSeconds)
      setRunResult(null)
      setExecStatusMessage('')
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI coding assistant for "${selectedProblem?.title}". I can help you understand the problem, explore approaches, review code, and think through edge cases without writing the final solution for you. How would you like to start?`,
        },
      ])
      setScreen('workspace')
    } catch {
      setError('Unable to start attempt.')
    }
  }

  const handleRunCode = async () => {
    if (!selectedProblem || !code.trim()) return
    setRunning(true)
    setError('')
    setExecStatusMessage('Initializing Web Worker execution...')
    try {
      const visibleCases = selectedProblem.testCases || []
      const res = await testRunner.runTests({
        language,
        sourceCode: code,
        functionSignature: selectedProblem.functionSignature,
        testCases: visibleCases.map((c: any) => ({
          id: c.id || c.name,
          input: c.stdin || '',
          expectedOutput: c.expectedOutput || '',
          hidden: false,
          name: c.name,
        })),
        onStatusUpdate: (msg) => setExecStatusMessage(msg),
      })

      setRunResult({
        total: res.total,
        passed: res.passed,
        verdict: res.verdict,
        totalExecutionTimeMs: res.totalExecutionTimeMs,
        results: res.testResults?.map((tr) => ({
          name: tr.name,
          passed: tr.passed,
          received: tr.actualOutput,
          expected: tr.expectedOutput,
          stderr: tr.stderr,
          status: tr.status,
          executionTimeMs: tr.executionTimeMs,
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed.')
    } finally {
      setRunning(false)
      setExecStatusMessage('')
    }
  }

  const handleStopExecution = () => {
    executionManager.stopExecution(language)
    setRunning(false)
    setSubmitting(false)
    setExecStatusMessage('')
    setError('Execution stopped by user.')
  }

  const handleSubmitChallenge = async () => {
    if (!attempt || !selectedProblem || !code.trim()) return
    setSubmitting(true)
    setError('')
    setExecStatusMessage('Running test execution suite...')
    try {
      const visibleCases = selectedProblem.testCases || []
      const res = await testRunner.runTests({
        language,
        sourceCode: code,
        functionSignature: selectedProblem.functionSignature,
        testCases: visibleCases.map((c: any) => ({
          id: c.id || c.name,
          input: c.stdin || '',
          expectedOutput: c.expectedOutput || '',
          hidden: false,
          name: c.name,
        })),
        onStatusUpdate: (msg) => setExecStatusMessage(msg),
      })

      const submitRes = await fetch(`/api/attempts/${attempt.id}/coding`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          language,
          sourceCode: code,
          isSampleOnly: false,
          clientResult: {
            verdict: res.verdict,
            passed: res.passed,
            total: res.total,
            testResults: res.testResults,
            totalExecutionTimeMs: res.totalExecutionTimeMs,
          },
        }),
      })

      if (!submitRes.ok) {
        const errData = await submitRes.json()
        throw new Error(errData.error || 'Submission failed.')
      }

      await fetch(`/api/attempts/${attempt.id}/submit`, { method: 'POST' })

      const passRate = res.total > 0 ? res.passed / res.total : 0
      const turnBonus = Math.min(1, remainingTurns / 12)
      const finalPct = Math.round(passRate * 80 + turnBonus * 20)

      setSubmissionScore({
        passed: res.passed,
        total: res.total,
        verdict: res.verdict,
        totalExecutionTimeMs: res.totalExecutionTimeMs,
        scorePct: finalPct,
      })
      setShowSubmit(false)
      setScreen('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(false)
      setExecStatusMessage('')
    }
  }

  const handleSendChat = async (customText?: string) => {
    const textToSend = (customText || chatInput).trim()
    if (!textToSend || !selectedProblem || aiLoading) return

    if (remainingTurns <= 0) {
      setError("You've reached the AI assistance limit for this question.")
      return
    }

    const userMsg = { role: 'user' as const, content: textToSend }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    if (!customText) setChatInput('')
    setAiLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai-coding/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedProblem.id,
          message: textToSend,
          currentCode: code,
          hintLevel,
          history: updatedMessages,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'AI request failed.')
        if (data.remainingTurns !== undefined) setRemainingTurns(data.remainingTurns)
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: data.message }])
        setHintLevel(data.hintLevel ?? hintLevel)
        setRemainingTurns(data.remainingTurns ?? Math.max(0, remainingTurns - 1))
      }
    } catch {
      setError('AI assistant is currently unavailable.')
    } finally {
      setAiLoading(false)
    }
  }

  const resetCode = () => {
    if (selectedProblem?.starterCode) {
      const langKey = language.toLowerCase()
      setCode(selectedProblem.starterCode[langKey] || Object.values(selectedProblem.starterCode)[0] || '')
      setRunResult(null)
      setExecStatusMessage('')
    }
  }

  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  if (screen === 'workspace') {
    const visibleCases = selectedProblem?.testCases || []
    return (
      <section className="ai-workspace">
        <header className="ai-workspace-top">
          <span className="brand-mark">
            PrepVvise <i>/</i> AI Coding <i>/</i> Set {String(selectedSet?.setNumber || 1).padStart(2, '0')}
          </span>
          <span className="workspace-title">{selectedProblem?.title || 'AI-ASSISTED CODING'}</span>
          <div className={`workspace-timer ${seconds < 600 ? 'warning' : ''}`}>
            <Clock3 /> {timeLabel}
            <button onClick={() => setShowSubmit(true)}>Submit</button>
          </div>
        </header>

        {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-2">{error}</div>}

        <div className="workspace-grid">
          <aside className="problem-panel">
            <div className="workspace-panel-head">
              <span className="eyebrow">Problem</span>
              <span className="topic-chip">{selectedProblem?.topic || 'DSA'}</span>
            </div>
            <h2>{selectedProblem?.title}</h2>
            <span className="difficulty-badge uppercase">{selectedProblem?.difficulty || 'Easy'} · {selectedProblem?.topic}</span>

            <div className="space-y-4 my-4">
              <p className="text-sm leading-relaxed text-foreground font-medium">{selectedProblem?.problem || selectedProblem?.statement}</p>

              {selectedProblem?.functionSignature && (
                <div className="p-3 rounded-lg bg-secondary/80 border border-border/80 text-xs font-mono">
                  <strong className="block text-muted-foreground uppercase tracking-wider text-[10px] font-sans font-bold mb-1">Function Signature</strong>
                  <code className="text-foreground">{selectedProblem.functionSignature}</code>
                </div>
              )}

              <div className="debug-section mt-4">
                <span className="eyebrow block mb-2">Visible Test Cases</span>
                <div className="space-y-2">
                  {visibleCases.map((tc: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-2.5 bg-muted/30 text-xs font-mono">
                      <strong className="font-sans block text-foreground font-semibold mb-1">{tc.name || `Case ${idx + 1}`}</strong>
                      <div>Input: <code>{tc.stdin || '(empty)'}</code></div>
                      <div>Expected: <code>{tc.expectedOutput || '(empty)'}</code></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="code-panel">
            <div className="workspace-panel-head">
              <span className="eyebrow">
                Code Editor
                <select value={language} onChange={(e) => selectLanguage(e.target.value)}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
              </span>
              <button onClick={resetCode}>Reset</button>
            </div>

            <div className="editor-shell">
              <div className="line-numbers">
                {code.split('\n').map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Code editor"
              />
            </div>

            {execStatusMessage && (
              <div className="p-2.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-2 my-2">
                <span className="animate-spin text-amber-500">⚙️</span>
                <span>{execStatusMessage}</span>
              </div>
            )}

            <div className="code-actions">
              <button className="secondary-button" onClick={resetCode} disabled={running || submitting}>
                <RotateCcw /> Reset
              </button>
              {(running || submitting) ? (
                <button className="secondary-button text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800" onClick={handleStopExecution}>
                  <Square className="w-4 h-4 fill-current" /> Stop
                </button>
              ) : (
                <button className="secondary-button" onClick={handleRunCode}>
                  <Play /> Run Code
                </button>
              )}
              <button className="primary-button" onClick={handleRunCode} disabled={running || submitting}>
                Run Tests <ArrowUpRight />
              </button>
            </div>

            {runResult && (
              <div className="test-drawer">
                <div className="workspace-panel-head">
                  <span className="eyebrow">Test results</span>
                  <b>{runResult.passed || 0} / {runResult.total || visibleCases.length} tests passed</b>
                </div>
                <div className="test-grid">
                  {runResult.results?.map((r: any, idx: number) => (
                    <span key={idx} className={r.passed ? 'pass' : 'fail'}>
                      {r.passed ? '✓' : '✕'} {r.name}
                    </span>
                  ))}
                </div>
                <small>Execution time: {runResult.totalExecutionTimeMs || 0} ms</small>
              </div>
            )}
          </main>

          <aside className="ai-panel">
            <div className="ai-panel-head">
              <div>
                <span className="eyebrow">AI Assistant</span>
                <strong>Groq LLM Tutor · Hint Level {hintLevel}/5</strong>
              </div>
              <Sparkles />
            </div>

            <div className="ai-context">
              <span>Remaining Turns: <b>{remainingTurns} / 12</b></span>
              <span>Hint Level: <b>Level {hintLevel}</b></span>
            </div>

            <div className="quick-actions">
              {[
                'Explain Problem',
                'Get Hint',
                'Suggest Approach',
                'Review My Code',
                'Find Edge Cases',
                'Analyze Complexity',
              ].map((item) => (
                <button key={item} onClick={() => handleSendChat(item)} disabled={aiLoading || remainingTurns <= 0}>
                  {item}
                </button>
              ))}
            </div>

            <div className="chat-messages">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'assistant' ? 'ai-message' : 'user-message'}>
                  <b>{m.role === 'assistant' ? 'Groq AI Tutor' : 'You'}</b>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {aiLoading && (
                <div className="ai-message">
                  <b>Groq AI Tutor</b>
                  <p className="text-xs text-muted-foreground animate-pulse">Thinking and generating conceptual hint...</p>
                </div>
              )}
            </div>

            <button className="structured-button" onClick={() => setShowPrompt(true)}>
              <Sparkles /> Structured Prompt Builder
            </button>

            <div className="chat-input">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask Groq AI Tutor for guidance..."
                disabled={aiLoading || remainingTurns <= 0}
              />
              <button onClick={() => handleSendChat()} disabled={aiLoading || !chatInput.trim() || remainingTurns <= 0}>
                Send
              </button>
            </div>
          </aside>
        </div>

        {showPrompt && (
          <PromptModal
            onClose={() => setShowPrompt(false)}
            onUse={(value) => {
              setShowPrompt(false)
              handleSendChat(value)
            }}
          />
        )}

        {showSubmit && (
          <div className="modal-backdrop">
            <div className="submit-modal">
              <span className="eyebrow">Submit solution</span>
              <h2>Are you ready to submit your solution?</h2>
              <p>Tests passed: <b>{runResult?.passed || 0} / {visibleCases.length}</b></p>
              <p>Time remaining: <b>{timeLabel}</b></p>
              <p>Remaining AI turns: <b>{remainingTurns} / 12</b></p>
              <small>Your solution will be evaluated against all test cases.</small>
              <div>
                <button className="secondary-button" onClick={() => setShowSubmit(false)}>
                  Continue coding
                </button>
                <button className="primary-button" onClick={handleSubmitChallenge} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  if (screen === 'result') {
    const passed = submissionScore?.passed || 0
    const total = submissionScore?.total || 1
    const pct = submissionScore?.scorePct ?? Math.round((passed / total) * 100)

    return (
      <section className="coding-result">
        <button className="back-link" onClick={() => setScreen('sets')}>
          <ChevronRight className="rotate-180" /> AI Coding Sets
        </button>
        <p className="eyebrow">AI Coding complete · {selectedSet?.name}</p>
        <h1 className="assessment-heading">{pct >= 70 ? 'Great work!' : 'Review and try again.'}</h1>
        <p className="assessment-lede">Your solution was evaluated against all visible test cases and prompting efficiency.</p>

        <div className="coding-result-score">
          <strong>{pct}% Final Score</strong>
          <span>Passed: {passed} / {total} tests</span>
          <span>Language: {language.toUpperCase()}</span>
          <span>Remaining AI Turns: {remainingTurns}</span>
        </div>

        <div className="coding-result-cards">
          <div>
            <span className="eyebrow">DSA performance</span>
            <strong>{passed === total ? 'Perfect' : passed > 0 ? 'Good' : 'Needs Practice'}</strong>
          </div>
          <div>
            <span className="eyebrow">AI collaboration</span>
            <strong>{remainingTurns >= 6 ? 'Efficient' : 'High Usage'}</strong>
          </div>
          <div>
            <span className="eyebrow">Prompting efficiency</span>
            <strong>{Math.round((remainingTurns / 12) * 100)}% Bonus</strong>
          </div>
        </div>

        <div className="ai-analysis-preview">
          <span className="eyebrow">Your submitted solution</span>
          <pre style={{ maxHeight: '200px', overflowY: 'auto' }} className="font-mono text-xs bg-muted/40 p-3 rounded-lg mb-4">{code}</pre>

          <span className="eyebrow">AI Tutor Feedback</span>
          <p className="text-sm leading-relaxed my-2">{selectedProblem?.explanation || 'Great effort! Re-check time complexity and space bounds for further optimizations.'}</p>

          <b>Key Strengths</b>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ Used AI for guided conceptual reasoning<br />
            ✓ Verified solution against test cases<br />
            ✓ Executed code using Web Worker browser sandbox
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="primary-button" onClick={() => setScreen('sets')}>
            Return to sets <ArrowUpRight />
          </button>
        </div>
      </section>
    )
  }

  if (screen === 'instructions') {
    return (
      <section className="coding-instructions">
        <button className="back-link" onClick={() => setScreen('details')}>
          <ChevronRight className="rotate-180" /> Set details
        </button>
        <div className="instruction-card">
          <p className="eyebrow">Before you begin</p>
          <h1 className="assessment-heading">{selectedSet?.name}</h1>
          <p className="assessment-lede">You have 40 minutes to solve one DSA problem using the AI Groq tutor.</p>
          <div className="remember-grid">
            {['Use structured prompts for clearer hints', 'Test your solution frequently using Run Code', 'Prompt the AI when stuck on logic or edge cases', 'AI will guide you without giving direct solution code', 'Optimize your code for all test cases'].map((item) => (
              <span key={item}>
                <Check /> {item}
              </span>
            ))}
          </div>
          <p className="instruction-note">The timer starts when you launch the lab.</p>
          <button className="primary-button" onClick={startLab}>
            Begin Assessment <ArrowUpRight />
          </button>
        </div>
      </section>
    )
  }

  if (screen === 'details') {
    return (
      <section className="coding-details">
        <button className="back-link" onClick={() => setScreen('sets')}>
          <ChevronRight className="rotate-180" /> Practice sets
        </button>
        <p className="eyebrow">AI Coding · Set {String(selectedSet?.setNumber || 1).padStart(2, '0')}</p>
        <h1 className="assessment-heading">{selectedSet?.name}</h1>
        <p className="assessment-lede">{selectedProblem?.statement || 'Focused AI Coding Practice'}</p>

        {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">{error}</div>}

        <div className="coding-detail-layout">
          <div className="coding-detail-main">
            <div className="coding-time-card">
              <span><Clock3 /> 40 minutes</span>
              <span>1 DSA problem</span>
              <span>Groq AI tutor enabled</span>
              <span>Browser WASM IDE</span>
            </div>
            <h3>Problem Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedProblem?.statement}</p>
            <h3>Topic & Skills</h3>
            <div className="skill-pills">
              {[selectedProblem?.topic || 'DSA', selectedProblem?.difficulty?.toUpperCase() || 'EASY', 'Structured Prompting', 'AI Tutor Guidance', 'Edge Case Analysis'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="assessment-summary">
            <p className="eyebrow">Assessment flow</p>
            {['Read the problem statement', 'Plan your algorithm approach', 'Prompt Groq AI Tutor for hints', 'Write your solution in editor', 'Run visible test cases in browser', 'Submit solution'].map((item, i) => (
              <p key={item}>
                <b>{String(i + 1).padStart(2, '0')}</b> {item}
              </p>
            ))}
            <button className="primary-button" onClick={() => setScreen('instructions')}>
              Start AI Coding <ArrowUpRight />
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (screen === 'sets') {
    const filtered = sets.filter((s) => filter === 'All' || filter === (s.setNumber > 10 ? 'Mixed' : 'Focused'))
    return (
      <section className="coding-sets">
        <button className="back-link" onClick={onBack}>
          <ChevronRight className="rotate-180" /> Assessment journey
        </button>
        <div className="module-section-heading">
          <div>
            <p className="eyebrow">AI Coding</p>
            <h1 className="section-title">Practice Sets</h1>
            <p className="module-description">Build your DSA + AI collaboration skills across 20 sets from database.</p>
          </div>
          <div className="coding-filters">
            {['All', 'Focused', 'Mixed'].map((item) => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">{error}</div>}

        {loadingSets ? (
          <p className="py-8 text-center text-muted-foreground">Loading AI Coding sets from database...</p>
        ) : (
          <div className="set-grid coding-set-grid">
            {filtered.map((s) => (
              <button
                key={s.id}
                className={`set-card ${s.locked ? 'set-locked' : ''}`}
                onClick={() => openSet(s)}
              >
                <span className="eyebrow">Set {String(s.setNumber).padStart(2, '0')}</span>
                <h3>{s.name}</h3>
                {s.locked ? (
                  <>
                    <span className="lock-badge">Premium</span>
                    <p className="set-meta">Unlock with PrepVvise Premium</p>
                    <span className="set-action">Unlock ₹59 <ArrowUpRight /></span>
                  </>
                ) : (
                  <>
                    <p className="set-meta">{s.type === 'focused' ? 'Focused' : 'Mixed'} · {s.difficulty?.toUpperCase()} · {s.topic}</p>
                    <p className="set-meta">1 problem · 40 min · Best: {s.bestScore !== null && s.bestScore !== undefined ? `${s.bestScore}%` : '—'}</p>
                    <span className="set-action">Start Set <ArrowUpRight /></span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="coding-overview space-y-6">
      <button className="back-link" onClick={onBack}>
        <ChevronRight className="rotate-180" /> Assessment journey
      </button>

      <div className="coding-overview-hero stage-yellow">
        <div>
          <p className="eyebrow">AI-Assisted Coding</p>
          <h1 className="module-title">Solve. Prompt. Test. Improve.</h1>
          <p className="module-subtitle">Master AI-assisted development through structured curriculum lessons and interactive DSA practice sets.</p>
          <div className="flex items-center gap-3 mt-4">
            <button className="primary-button" onClick={() => setTab('Learn')}>
              Explore Curriculum <ArrowUpRight />
            </button>
            <button className="secondary-button" onClick={() => { setTab('Practice'); setScreen('sets') }}>
              Practice Sets <ArrowUpRight />
            </button>
          </div>
        </div>
        <div className="coding-stats">
          <strong>22</strong><span>Curriculum Sections</span>
          <strong>20</strong><span>Practice Sets</span>
          <strong>40 min</strong><span>Assessment Time</span>
          <strong>Groq</strong><span>AI Tutor</span>
        </div>
      </div>

      <div className="module-tabs">
        {(['Learn', 'Practice'] as const).map((item) => (
          <button key={item} className={`module-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === 'Learn' && <AiCodingLearnView />}

      {tab === 'Practice' && (
        <div className="coding-history space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow">Practice Lab</span>
              <h2 className="section-title">20 Database-Driven Practice Sets</h2>
            </div>
            <button className="primary-button" onClick={() => setScreen('sets')}>
              View Practice Sets <ArrowUpRight />
            </button>
          </div>
          <div className="history-row"><b>Arrays + Hashing</b><span>Two Sum, Anagram, Buy/Sell Stock</span></div>
          <div className="history-row"><b>Two Pointers & Sliding Window</b><span>3Sum, Max Water, Subarray Sum</span></div>
          <div className="history-row"><b>Trees, Graphs & Dynamic Programming</b><span>Invert Tree, Course Schedule, Coin Change</span></div>
        </div>
      )}
    </section>
  )
}

function PromptModal({ onClose, onUse }: { onClose: () => void; onUse: (value: string) => void }) {
  const [context, setContext] = useState('Longest subarray with target sum')
  const [approach, setApproach] = useState('I am considering prefix sums but need to handle negative values.')
  const [constraints, setConstraints] = useState('O(n) time, O(n) space, no complete code yet.')
  const [request, setRequest] = useState('Help me validate the approach and identify edge cases.')
  const generated = `Context: ${context}\nCurrent approach: ${approach}\nConstraints: ${constraints}\nRequest: ${request}`
  return <div className="modal-backdrop"><div className="prompt-modal"><div className="workspace-panel-head"><div><span className="eyebrow">Structured prompt</span><h2>Build a clearer prompt.</h2></div><button onClick={onClose}>×</button></div>{[['Context', context, setContext], ['My approach', approach, setApproach], ['Constraints', constraints, setConstraints], ['What I need', request, setRequest]].map(([label, value, setter]) => <label key={label as string}>{label as string}<textarea value={value as string} onChange={(e) => (setter as (value: string) => void)(e.target.value)} /></label>)}<div className="generated-prompt"><span className="eyebrow">Your structured prompt</span><p>{generated}</p></div><div><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => onUse(generated)}>Use Prompt</button></div></div></div>
}



function AuthControls() {
  const { data: session } = authClient.useSession()
  if (!session)
    return (
      <span className="flex items-center gap-2">
        <a className="secondary-button" href="/sign-in">
          Sign in
        </a>
      </span>
    )
  return (
    <span className="flex items-center gap-2">
      <button className="secondary-button" onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}>
        Sign out
      </button>
    </span>
  )
}

function SetCard({ set, isPremium, onPremium, onStart }: { set: { number: number; name: string; free: boolean; score: string; bestScore?: number | null; attemptsLeft?: number | null; locked?: boolean }; isPremium: boolean; onPremium: () => void; onStart: () => void }) {
  const locked = set.locked ?? (!set.free && !isPremium)
  const scoreDisplay = set.bestScore !== undefined && set.bestScore !== null ? `${set.bestScore}%` : set.score
  return <button className={`set-card ${locked ? 'set-locked' : ''}`} onClick={() => locked ? onPremium() : onStart()}>
    <div className="flex items-start justify-between">
      <span className="stage-number">{String(set.number).padStart(2, '0')}</span>
      {locked ? (
        <span className="lock-badge">{!set.free && !isPremium ? 'Premium · ₹59' : 'Attempts Used (3/3)'}</span>
      ) : (
        <span className="free-badge">{isPremium && !set.free ? 'UNLOCKED' : 'FREE'}</span>
      )}
    </div>
    <h3>{set.name}</h3>
    <p className="set-meta">20 questions · {set.number > 15 ? 'Hard' : set.number > 5 ? 'Medium' : 'Easy'} · 20 minutes</p>
    <div className="set-footer">
      <span>Best score <strong>{scoreDisplay}</strong></span>
      {!isPremium && set.attemptsLeft !== undefined && set.attemptsLeft !== null && (
        <span className="text-xs text-muted-foreground font-medium ml-1">({set.attemptsLeft}/3 left)</span>
      )}
      {isPremium && (
        <span className="text-xs text-muted-foreground font-medium ml-1">(Unlimited)</span>
      )}
      <span className="set-action">{locked ? (!set.free && !isPremium ? 'Unlock' : 'Limit Reached') : 'Start practice'} <ArrowUpRight /></span>
    </div>
  </button>
} 

// Technical Assessment is fully backend-driven: the set, its questions, the
// authoritative timer, and the score all come from /api/sets and /api/attempts.
type TechnicalQuestion = {
  id: string
  position: number
  prompt: string
  kind: string
  content: Record<string, unknown>
  explanation: string | null
  // Answer keys are never sent before scoring, so the payload has no isCorrect.
  options: Array<{ id: string; label: string; value: string }>
}

type TechnicalSet = {
  id: string
  moduleSlug: string
  moduleName: string
  setNumber: number
  name: string
  access: 'free' | 'premium'
  type: string
  locked: boolean
  questions: TechnicalQuestion[]
}

type TechnicalAttempt = {
  id: string
  practiceSetId: string
  status: 'in_progress' | 'submitted' | 'expired'
  startedAt: string
  expiresAt: string
}

type TechnicalTopicScore = { topic: string; score: number; total: number; correct: number }

type TechnicalReviewItem = { questionId: string; selectedOptionId: string | null; correctOptionId: string | null; isCorrect: boolean }

type TechnicalAnalysis = {
  scoringStatus: string
  totalQuestions: number
  answeredQuestions: number
  correctAnswers: number
  topicBreakdown: TechnicalTopicScore[]
  review: TechnicalReviewItem[]
}

function TechnicalAssessment({ setId, setName, setNumber, onBack, onPremium }: { setId: string; setName: string; setNumber: number; onBack: () => void; onPremium: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'running' | 'result'>('intro')
  const [practiceSet, setPracticeSet] = useState<TechnicalSet | null>(null)
  const [attempt, setAttempt] = useState<TechnicalAttempt | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [marked, setMarked] = useState<string[]>([])
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const questions = practiceSet?.questions ?? []
  const totalCount = questions.length
  const current = questions[questionIndex]
  const answeredCount = Object.keys(answers).length
  const difficulty = setNumber > 15 ? 'Hard' : setNumber > 5 ? 'Medium' : 'Easy'
  const topics = Array.from(new Set(questions.map((question) => String(question.content?.topic ?? 'General'))))
  const startAssessment = async () => {
    if (!setId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practiceSetId: setId }),
      })
      const body = await response.json().catch(() => null) as (TechnicalAttempt & { error?: string }) | null
      if (!response.ok || !body) throw new Error(body?.error ?? 'Unable to start this practice set.')
      setAttempt(body)
      setAnswers({})
      setMarked([])
      setQuestionIndex(0)
      setSaveState('idle')
      setScore(null)
      setAnalysis(null)
      setSecondsLeft(Math.max(0, Math.floor((new Date(body.expiresAt).getTime() - Date.now()) / 1000)))
      setPhase('running')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start this practice set.')
    } finally {
      setLoading(false)
    }
  }

  const selectOption = async (question: TechnicalQuestion, optionId: string) => {
    setAnswers((previous) => ({ ...previous, [question.id]: optionId }))
    if (!attempt) return
    setSaveState('saving')
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answer: { optionId } }),
      })
      setSaveState(response.ok ? 'saved' : 'error')
    } catch {
      setSaveState('error')
    }
  }

  const submitAssessment = async () => {
    if (!attempt) return
    setLoading(true)
    setError(null)
    try {
      // Flush every locally selected option so scoring always sees the final answers.
      await Promise.all(questions.map(async (question) => {
        const optionId = answers[question.id]
        if (!optionId) return
        await fetch(`/api/attempts/${attempt.id}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, answer: { optionId } }),
        }).catch(() => null)
      }))

      const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: 'POST' })
      const body = await response.json().catch(() => null) as { score?: number | null; result?: TechnicalAnalysis | null; error?: string } | null
      if (!response.ok || !body) throw new Error(body?.error ?? 'Unable to submit this attempt.')
      setScore(body.score ?? null)
      setAnalysis(body.result ?? null)
      setPhase('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this attempt.')
    } finally {
      setLoading(false)
    }
  }

  // Load the published set (questions + options) as soon as the learner opens it.
  useEffect(() => {
    if (!setId) {
      setError('This practice set has no published questions yet. Ask your admin to add questions to it.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/sets/${setId}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as (TechnicalSet & { error?: string }) | null
        if (!response.ok || !body) throw new Error(body?.error ?? 'Unable to load this practice set.')
        return body
      })
      .then((body) => { if (!cancelled) setPracticeSet(body) })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load this practice set.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [setId])

  // The attempt expiry returned by the backend is the authoritative timer.
  useEffect(() => {
    if (phase !== 'running' || !attempt) return
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [phase, attempt])

  useEffect(() => {
    if (phase !== 'running' || secondsLeft > 0) return
    void submitAssessment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft])

  if (phase === 'running' && current) {
    const topic = String(current.content?.topic ?? 'General')
    const progress = ((questionIndex + 1) / Math.max(totalCount, 1)) * 100
    return <section className="technical-workspace">
      <div className="technical-top">
        <button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> Exit assessment</button>
        <div><p className="eyebrow">Technical Assessment · {practiceSet?.name ?? setName}</p><strong>Question {String(questionIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}</strong></div>
        <div className={`technical-timer ${secondsLeft < 60 ? 'warning' : ''}`}><Timer /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} remaining</div>
      </div>
      <div className="technical-progress"><div style={{ width: `${progress}%` }} /></div>
      <div className="technical-layout">
        <article className="technical-question">
          <div className="flex items-center justify-between gap-3"><span className="topic-chip">{topic}</span><span className="eyebrow text-muted-foreground">Single choice</span></div>
          {Boolean(current.content?.scenario) && (
            <div className="scenario-card">
              <div className="scenario-card-header">
                <Sparkles style={{ width: 14, height: 14, color: 'var(--coral)' }} />
                <span>Engineering Scenario</span>
              </div>
              <p className="scenario-card-text">{String(current.content?.scenario)}</p>
            </div>
          )}
          <h2>{current.prompt}</h2>
          <div className="mcq-options">{current.options.map((option, index) => <button key={option.id} className={answers[current.id] === option.id ? 'selected' : ''} onClick={() => void selectOption(current, option.id)}><span className="mcq-letter">{option.label || String.fromCharCode(65 + index)}</span><span>{option.value}</span>{answers[current.id] === option.id && <Check />}</button>)}</div>
          <div className="technical-controls">
            <button className="secondary-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))}>Previous</button>
            <button className="review-button" onClick={() => setMarked((items) => items.includes(current.id) ? items.filter((item) => item !== current.id) : [...items, current.id])}>{marked.includes(current.id) ? 'Marked for review' : 'Mark for review'}</button>
            {questionIndex === totalCount - 1
              ? <button className="primary-button" onClick={() => void submitAssessment()} disabled={loading}>{loading ? 'Submitting…' : 'Submit Assessment'} <ArrowUpRight /></button>
              : <button className="primary-button" onClick={() => setQuestionIndex((value) => Math.min(totalCount - 1, value + 1))}>Next <ChevronRight /></button>}
          </div>
          <span className="save-status"><Check /> {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed — select the option again' : saveState === 'saved' ? 'Answer saved' : `${answeredCount} of ${totalCount} answered`}</span>
          {error && <p className="mt-3 text-destructive">{error}</p>}
        </article>
        <aside className="question-palette">
          <p className="eyebrow">Questions</p>
          <div>{questions.map((question, index) => <button key={question.id} className={`${index === questionIndex ? 'current' : ''} ${answers[question.id] ? 'answered' : ''} ${marked.includes(question.id) ? 'marked' : ''}`} onClick={() => setQuestionIndex(index)}>{String(index + 1).padStart(2, '0')}</button>)}</div>
          <p className="palette-legend">Answered: {answeredCount} / {totalCount}<br />Marked for review: {marked.length}<br />Unanswered questions score zero.</p>
          <button className="secondary-button mt-4 w-full" onClick={() => void submitAssessment()} disabled={loading}>Submit now</button>
        </aside>
      </div>
    </section>
  }

  if (phase === 'result') {
    const scored = analysis !== null
    const finalScore = score ?? 0
    const scoredQuestions = analysis?.totalQuestions ?? totalCount
    const correctAnswers = analysis?.correctAnswers ?? 0
    // The server counts what it actually received; the local map is the fallback.
    const answeredShown = analysis?.answeredQuestions ?? answeredCount
    const breakdown = analysis?.topicBreakdown ?? []
    const reviewByQuestion = new Map((analysis?.review ?? []).map((item) => [item.questionId, item]))
    const weakest = breakdown[breakdown.length - 1]
    return <section className="technical-results">
      <button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> Technical Assessment</button>
      <p className="eyebrow text-muted-foreground">Technical Assessment · {practiceSet?.name ?? setName}</p>
      <h1 className="assessment-heading">{!scored ? 'This attempt ended before it could be scored.' : finalScore >= 80 ? 'Strong technical control.' : finalScore >= 60 ? 'Solid progress — refine the weak topics.' : 'Review the fundamentals, then reattempt.'}</h1>
      <p className="assessment-lede">{scored ? 'Scored by PrepVvise from the answers saved during this attempt.' : 'The attempt expired before submission, so PrepVvise did not score it. Start a fresh attempt to get a score and analysis.'}</p>
      <div className="technical-score-card">
        <div><p className="eyebrow">{scored ? 'Final score' : 'Status'}</p><strong>{scored ? `${finalScore}%` : 'Expired'}</strong><p>{scored ? `${correctAnswers} of ${scoredQuestions} questions correct` : 'No score recorded for this attempt'}</p></div>
        <div className="result-stats"><span><b>{String(answeredShown).padStart(2, '0')}</b>answered</span><span><b>{String(marked.length).padStart(2, '0')}</b>marked</span><span><b>{difficulty}</b>difficulty</span></div>
      </div>
      {scored && <div className="analysis-grid mt-6">
        <div className="analysis-card"><span>Overall performance</span><strong>{finalScore}%</strong><div className="progress-track"><div style={{ width: `${finalScore}%` }} /></div></div>
        {breakdown.map((item) => <div className="analysis-card" key={item.topic}><p className="eyebrow">{item.topic}</p><strong>{item.score}%</strong><p className="text-muted-foreground">{item.correct} / {item.total} correct</p></div>)}
      </div>}
      <h2 className="subsection-title mt-8">Answer review</h2>
      <div className="review-list">{questions.map((question, index) => {
        const outcome = reviewByQuestion.get(question.id)
        const selectedOption = question.options.find((option) => option.id === outcome?.selectedOptionId)
        const correctOption = question.options.find((option) => option.id === outcome?.correctOptionId)
        const isCorrect = outcome?.isCorrect ?? false
        return <div className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`} key={question.id}>
          <div className="review-head"><span className="stage-number">{String(index + 1).padStart(2, '0')}</span><span className="topic-chip">{String(question.content?.topic ?? 'General')}</span><span className="review-state">{isCorrect ? 'Correct' : outcome?.selectedOptionId ? 'Incorrect' : 'Not answered'}</span></div>
          {Boolean(question.content?.scenario) && (
            <div className="scenario-card" style={{ marginTop: 10, padding: '14px 18px' }}>
              <div className="scenario-card-header" style={{ marginBottom: 4 }}>
                <Sparkles style={{ width: 12, height: 12, color: 'var(--coral)' }} />
                <span>Engineering Scenario</span>
              </div>
              <p className="scenario-card-text" style={{ fontSize: '14px', lineHeight: 1.5 }}>{String(question.content?.scenario)}</p>
            </div>
          )}
          <p className="review-prompt">{question.prompt}</p>
          <p className="review-answer">Your answer: <strong>{selectedOption?.value ?? 'Not answered'}</strong></p>
          {!isCorrect && correctOption && <p className="review-answer">Correct answer: <strong>{correctOption.value}</strong></p>}
          {question.explanation && (
            <div className="review-explanation-box">
              <div className="review-explanation-header">
                <Sparkles style={{ width: 12, height: 12, color: 'var(--coral)' }} />
                <span>Explanation</span>
              </div>
              <p className="review-explanation-text">{question.explanation}</p>
              {Array.isArray(question.content?.conceptsTested) && (question.content.conceptsTested as string[]).length > 0 && (
                <div className="review-concepts">
                  {(question.content.conceptsTested as string[]).map((concept) => (
                    <span key={concept} className="concept-chip">#{concept}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      })}</div>
      {error && <p className="mt-4 text-destructive">{error}</p>}
      <div className="analysis-note"><Sparkles /><div><p className="eyebrow">AI coach note</p><p>{weakest && weakest.score < 100 ? `Focus next on ${weakest.topic} — it is the weakest topic in this set.` : 'Consistent, accurate answers across every topic in this set. A harder set is the right next step.'}</p></div></div>
      <div className="result-actions">
        <button className="secondary-button" onClick={() => void startAssessment()} disabled={loading}>{loading ? 'Starting…' : 'Reattempt set'}</button>
        <button className="primary-button" onClick={onBack}>Back to practice sets <ArrowUpRight /></button>
      </div>
    </section>
  }

  return <section className="technical-entry">
    <button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> Technical Assessment</button>
    <div className="assessment-entry-grid">
      <div>
        <p className="eyebrow text-muted-foreground">Technical Assessment · Practice Set {String(setNumber).padStart(2, '0')}</p>
        <h1 className="assessment-heading">{practiceSet?.name ?? setName}</h1>
        <p className="assessment-lede">Multiple-choice questions on AI literacy, situational judgement, and problem solving. Every answer is scored by the PrepVvise backend as soon as you submit.</p>
        <div className="technical-meta"><span>{totalCount} questions</span><span>Single choice · MCQ</span><span>{difficulty}</span><span>Scored automatically</span></div>
      </div>
      <div className="assessment-summary">
        <p className="eyebrow">Topics in this set</p>
        {loading && !practiceSet
          ? <p className="text-muted-foreground">Loading questions…</p>
          : practiceSet?.locked
            ? <p className="text-muted-foreground">This set is part of Premium. Unlock to load its questions and start practising.</p>
            : topics.length
              ? <ul>{topics.map((topic) => <li key={topic}><Check /> {topic}</li>)}</ul>
              : <p className="text-muted-foreground">No questions have been published for this set yet.</p>}
        {error && <p className="text-destructive">{error}</p>}
        <button className="primary-button" onClick={() => void startAssessment()} disabled={loading || !practiceSet || totalCount === 0 || practiceSet.locked}>{loading ? 'Starting…' : 'Start Practice'} <ArrowUpRight /></button>
        {practiceSet?.locked && <button className="secondary-button mt-3" onClick={onPremium}>Unlock Premium <ArrowUpRight /></button>}
      </div>
    </div>
    <div className="before-begin"><p className="eyebrow">Before you begin</p><p>MCQ only · the countdown uses the attempt expiry issued by PrepVvise · answers are saved as you select them · topic-level analysis appears after submission.</p><span>Format <strong>Single choice</strong> · Access <strong>{practiceSet?.access === 'premium' ? 'Premium' : 'Free'}</strong> · Scoring <strong>Server-side</strong></span></div>
  </section>
}

function PremiumModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void | Promise<void> }) {
  return <div className="premium-overlay" role="dialog" aria-modal="true" aria-labelledby="premium-title"><div className="premium-modal"><button className="premium-close" onClick={onClose} aria-label="Close premium dialog">×</button><div className="premium-mark"><Sparkles /></div><p className="eyebrow text-muted-foreground">PrepVvise Premium</p><h2 id="premium-title" className="premium-title">Unlock the full PrepVvise experience</h2><p className="premium-copy">Practice every assessment stage, learn from every mistake, and get personalized AI guidance.</p><div className="premium-features">{['100 practice sets', 'Unlimited attempts', 'Advanced learning content', 'AI Performance Analyzer', 'AI Tutor and recommendations', 'Full mock assessments'].map((feature) => <div key={feature}><Check />{feature}</div>)}</div><div className="premium-price"><strong>₹59</strong><span>Premium subscription</span></div><button className="primary-button premium-cta" onClick={onUnlock}>Unlock Premium — ₹59 <ArrowUpRight /></button><button className="premium-continue" onClick={onClose}>Continue with Free</button></div></div>
}

function ProgressRing({ value }: { value: number }) {
  return (
    <div className="relative grid size-28 place-items-center rounded-full" style={{ background: `conic-gradient(var(--ink) ${value * 3.6}deg, var(--line) 0deg)` }}>
      <div className="grid size-22 place-items-center rounded-full bg-card">
        <span className="font-display text-2xl font-semibold tracking-tight">{value}%</span>
      </div>
    </div>
  )
}

function StageCard({ stage, active, onSelect }: { stage: (typeof stages)[number]; active: boolean; onSelect: () => void }) {
  const Icon = stage.icon
  return (
    <button onClick={onSelect} className={`stage-card stage-${stage.color} ${active ? 'stage-active' : ''}`} aria-pressed={active}>
      <div className="flex items-start justify-between">
        <span className="stage-number">{stage.number}</span>
        <div className="stage-icon"><Icon /></div>
      </div>
      <div className="mt-8 text-left">
        <p className="font-display text-xl font-semibold leading-none">{stage.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{stage.label}</p>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{stage.progress}% ready</span>
        <ChevronRight className="size-4" />
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-black/10"><div className="h-full rounded-full bg-foreground" style={{ width: `${stage.progress}%` }} /></div>
    </button>
  )
}

export default function Page() {
  const { data: session } = authClient.useSession()
  const [activeStage, setActiveStage] = useState('technical')
  const [moduleOpen, setModuleOpen] = useState(false)
  const [tutorOpen, setTutorOpen] = useState(false)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [userLoaded, setUserLoaded] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [englishAssessment, setEnglishAssessment] = useState(false)
  const [technicalSet, setTechnicalSet] = useState<{ number: number; id: string; name: string } | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [assistantReply, setAssistantReply] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string | null; plan: string } | null>(null)
  const [catalogModules, setCatalogModules] = useState<BackendModule[]>([])
  const [progressBySlug, setProgressBySlug] = useState<Record<string, BackendProgress>>({})
  const [attemptHistory, setAttemptHistory] = useState<BackendAttempt[]>([])
  const [plans, setPlans] = useState<BackendPlan[]>([])
  const [dataError, setDataError] = useState(false)

  const [navView, setNavView] = useState<'dashboard' | 'journey' | 'progress' | 'history' | 'library' | 'bookmarks' | 'settings'>('dashboard')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('All')
  const [bookmarks, setBookmarks] = useState<string[]>(['technical-01', 'debugging-01'])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [speechSpeed, setSpeechSpeed] = useState(0.88)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const now = new Date()
  const currentDateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const currentHour = now.getHours()
  const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

  // Stage config is static (icon, color, label, etc.). Readiness percentages
  // come from the backend /api/progress endpoint and catalog module practice set scores.
  const resolvedStages = useMemo(() => stages.map((stage) => {
    const prog = progressBySlug[stage.id] || progressBySlug[stage.id === 'coding' ? 'ai-coding' : stage.id === 'ai-coding' ? 'coding' : stage.id]
    const mod = catalogModules.find((m) => m.slug === stage.id || (stage.id === 'coding' && m.slug === 'ai-coding') || (stage.id === 'ai-coding' && m.slug === 'coding'))
    let score = prog?.bestScore ?? null

    if (score === null && mod?.practiceSets && mod.practiceSets.length > 0) {
      const scores = mod.practiceSets
        .map((s) => s.bestScore)
        .filter((s): s is number => s !== null && s !== undefined)
      if (scores.length > 0) {
        score = Math.max(...scores)
      }
    }

    return {
      ...stage,
      progress: score ?? 0,
    }
  }), [progressBySlug, catalogModules])

  const selected = useMemo(() => resolvedStages.find((stage) => stage.id === activeStage) ?? resolvedStages[1], [resolvedStages, activeStage])

  // --- Derived data from real API responses ---

  const stageTones: Record<string, string> = {
    english: 'mint',
    technical: 'peach',
    debugging: 'lavender',
    coding: 'yellow',
  }

  function formatTimeAgo(iso: string | null): string {
    if (!iso) return 'Unknown'
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }

  const activityItems = useMemo(() =>
    attemptHistory
      .filter((a) => a.status === 'submitted' && a.score !== null)
      .slice(0, 5)
      .map((attempt) => ({
        stage: attempt.moduleName,
        title: attempt.practiceSetName,
        score: `${attempt.score}%`,
        time: formatTimeAgo(attempt.startedAt),
                tone: stageTones[attempt.moduleSlug] ?? 'blue',
      })),
  [attemptHistory])

  const overallReadiness = useMemo(() => {
    const scores = resolvedStages.filter((s) => s.progress > 0).map((s) => s.progress)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }, [resolvedStages])

  const premiumPrice = useMemo(() => {
    const premiumPlan = plans.find((p) => p.slug === 'premium')
    return premiumPlan ? (premiumPlan.pricePaise / 100).toFixed(0) : '59'
  }, [plans])

  const premiumFeatures = useMemo(() => {
    const premiumPlan = plans.find((p) => p.slug === 'premium')
    if (!premiumPlan) return ['100 practice sets', 'Unlimited attempts', 'Advanced learning content', 'AI Performance Analyzer', 'AI Tutor and recommendations', 'Full mock assessments']
    return [
      premiumPlan.practiceSetAccessLimit === null ? 'Unlimited practice sets' : `${premiumPlan.practiceSetAccessLimit} practice sets`,
      premiumPlan.unlimitedAttempts ? 'Unlimited attempts' : 'Limited attempts',
      premiumPlan.aiAnalysis ? 'AI Performance Analyzer' : 'AI Analysis',
      premiumPlan.aiCoachDailyLimit === null ? 'AI Tutor and recommendations' : 'AI Tutor (daily limit)',
      'Full mock assessments',
    ]
  }, [plans])

  const unlockedSetCount = useMemo(() =>
    catalogModules.reduce((total, module) =>
      total + module.practiceSets.filter((s) => !s.locked).length, 0),
  [catalogModules])

  const weeklyProgress = useMemo(() => {
    return attemptHistory
      .filter((a) => a.status === 'submitted' && a.score !== null)
      .slice(0, 10)
      .map((a) => a.score ?? 0)
      .reverse()
  }, [attemptHistory])

  const weakestStage = useMemo(() => {
    const nonZero = resolvedStages.filter((s) => s.progress > 0)
    if (nonZero.length === 0) return null
    return nonZero.reduce((min, s) => (s.progress < min.progress ? s : min))
  }, [resolvedStages])

  useEffect(() => {
    let active = true

    fetch('/api/me', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return null
        if (!response.ok) throw new Error('Unable to load your account.')
        return response.json().catch(() => null) as Promise<{ name: string | null; plan: string } | null>
      })
      .then(async (user) => {
        if (!active) return
        if (!user) {
          setUserLoaded(true)
          return
        }
        setCurrentUser(user)
        setIsPremium(user.plan === 'premium')

        const modulesResponse = await fetch('/api/modules', { cache: 'no-store' })
        if (!modulesResponse.ok) throw new Error('Unable to load assessment modules.')
        const modules = await modulesResponse.json().catch(() => ({ modules: [] })) as { modules: BackendModule[] }
        if (active) setCatalogModules(modules.modules || [])

        // Fetch per-module progress (best score, attempt counts)
        try {
          const progressResponse = await fetch('/api/progress', { cache: 'no-store' })
          if (progressResponse.ok) {
            const progressData = await progressResponse.json().catch(() => ({ progress: [] })) as { progress: BackendProgress[] }
            const map: Record<string, BackendProgress> = {}
            ;(progressData.progress || []).forEach((p) => {
              map[p.moduleSlug] = p
              if (p.moduleSlug === 'ai-coding') map['coding'] = p
              if (p.moduleSlug === 'coding') map['ai-coding'] = p
            })
            if (active) setProgressBySlug(map)
          }
        } catch { /* non-fatal: progress loads opportunistically */ }

        // Fetch attempt history for the activity feed
        try {
          const attemptsResponse = await fetch('/api/attempts', { cache: 'no-store' })
          if (attemptsResponse.ok) {
            const attemptsData = await attemptsResponse.json().catch(() => ({ attempts: [] })) as { attempts: BackendAttempt[] }
            if (active) setAttemptHistory(attemptsData.attempts || [])
          }
        } catch { /* non-fatal */ }

        // Fetch subscription plans for pricing (public endpoint)
        try {
          const plansResponse = await fetch('/api/plans', { cache: 'no-store' })
          if (plansResponse.ok) {
            const plansData = await plansResponse.json().catch(() => ({ plans: [] })) as { plans: BackendPlan[] }
            if (active) setPlans(plansData.plans || [])
          }
        } catch { /* non-fatal */ }

        setUserLoaded(true)
      })
      .catch(() => {
        // Non-fatal: the app should still render with defaults
        if (active) setUserLoaded(true)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  async function sendMessage(promptText?: string) {
    const prompt = (promptText || message).trim()
    if (!prompt || assistantLoading) return
    setSent(true)
    if (!promptText) setMessage('')
    setAssistantLoading(true)
    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ problem: 'PrepVvise assessment preparation and debugging practice', currentCode: '', testOutput: '', request: prompt }),
      })
      const result = await response.json().catch(() => ({})) as { text?: string; error?: string }
      setAssistantReply(result.text ?? result.error ?? 'I could not generate a response right now.')
    } catch {
      setAssistantReply('The AI coach is temporarily unavailable. Please try again.')
    } finally {
      setAssistantLoading(false)
    }
  }

  async function beginPremiumCheckout() {
    if (paymentLoading) return
    setPaymentLoading(true)

    try {
      const token = await authClient.getAuthToken()
      const reqHeaders: Record<string, string> = { 'x-idempotency-key': crypto.randomUUID() }
      if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: reqHeaders,
      })

      const rawText = await response.text().catch(() => '')
      let order: { orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string } = {}
      try {
        order = rawText ? JSON.parse(rawText) : {}
      } catch {
        order = {}
      }

      if (!response.ok) {
        if (response.status === 401) {
          window.alert('Please sign in to upgrade to Premium.')
          window.location.href = '/sign-in'
          return
        }
        throw new Error(order.error ?? `Unable to start checkout (Server returned ${response.status}).`)
      }

      if (!order.orderId || !order.keyId) {
        throw new Error(order.error ?? 'Unable to start checkout.')
      }

      const RazorpayConstructor = (window as Window & {
        Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
      }).Razorpay

      if (!RazorpayConstructor) {
        throw new Error('Payment checkout is not available yet.')
      }

      const checkout = new RazorpayConstructor({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'PrepVvise',
        description: 'PrepVvise Premium',
        order_id: order.orderId,
        handler: async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const vToken = await authClient.getAuthToken()
            const vHeaders: Record<string, string> = { 'content-type': 'application/json' }
            if (vToken) {
              vHeaders['Authorization'] = `Bearer ${vToken}`
            }

            const verification = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: vHeaders,
              body: JSON.stringify({
                razorpayOrderId: payment.razorpay_order_id,
                razorpayPaymentId: payment.razorpay_payment_id,
                razorpaySignature: payment.razorpay_signature,
              }),
            })

            const vRawText = await verification.text().catch(() => '')
            let result: { premium?: boolean; error?: string } = {}
            try {
              result = vRawText ? JSON.parse(vRawText) : {}
            } catch {
              result = {}
            }

            if (!verification.ok || !result.premium) {
              throw new Error(result.error ?? 'Payment verification failed.')
            }

            setIsPremium(true)
            setPremiumOpen(false)
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Payment verification failed.')
          }
        },
        'payment.failed': (failure: { error?: { description?: string } }) => {
          window.alert(failure.error?.description ?? 'Razorpay payment failed.')
          setPaymentLoading(false)
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      })
      checkout.open()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to start checkout.')
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles /></div><span>prepvvise</span><span className="brand-beta">BETA</span></div>
        <div className="workspace-switcher"><div className="avatar avatar-coral">AK</div><div><p className="text-sm font-medium">{currentUser?.name ?? 'Student'}</p><p className="text-xs text-muted-foreground">{isPremium ? 'Premium Workspace' : 'Free Workspace'}</p></div><MoreHorizontal className="ml-auto size-4 text-muted-foreground" /></div>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          <button className={`nav-item ${navView === 'dashboard' && !moduleOpen && !technicalSet && !englishAssessment ? 'nav-item-active' : ''}`} onClick={() => { setNavView('dashboard'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><Home /> Dashboard</button>
          <button className={`nav-item ${navView === 'journey' ? 'nav-item-active' : ''}`} onClick={() => { setNavView('journey'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><Target /> Assessment journey <span className="nav-count">{stages.length}</span></button>
          <button className={`nav-item ${navView === 'progress' ? 'nav-item-active' : ''}`} onClick={() => { setNavView('progress'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><LineChart /> My progress</button>
          <button className={`nav-item ${navView === 'history' ? 'nav-item-active' : ''}`} onClick={() => { setNavView('history'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><Timer /> Attempt history</button>
          <p className="nav-label mt-7">Resources</p>
          <button className={`nav-item ${navView === 'library' ? 'nav-item-active' : ''}`} onClick={() => { setNavView('library'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><LibraryBig /> Learning library</button>
          <button className="nav-item" onClick={() => setTutorOpen(true)}><MessageCircle /> AI tutor <span className="status-dot" /></button>
          <button className={`nav-item ${navView === 'bookmarks' ? 'nav-item-active' : ''}`} onClick={() => { setNavView('bookmarks'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><Trophy /> Bookmarks</button>
        </nav>
        <div className="sidebar-bottom"><button className={`nav-item ${navView === 'settings' ? 'nav-item-active' : ''}`} onClick={() => { setNavView('settings'); setModuleOpen(false); setTechnicalSet(null); setEnglishAssessment(false); }}><Settings2 /> Settings</button><div className="support-card"><div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-full bg-ink text-background"><CircleHelp className="size-4" /></div><span className="text-sm font-medium">Need a hand?</span></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your AI coach is ready whenever you are.</p><button onClick={() => setTutorOpen(true)} className="mt-3 text-xs font-semibold underline underline-offset-4">Open tutor</button></div></div>
      </aside>

      <section className="content-area" id="dashboard">
        <header className="topbar"><div className="mobile-brand brand"><div className="brand-mark"><Sparkles /></div><span>prepvvise</span></div><button className="search-box border-0 bg-transparent text-left cursor-pointer" onClick={() => setSearchOpen(true)}><Search className="size-4" /><span>Search practice, topics, or concepts</span><kbd>⌘ K</kbd></button><div className="top-actions"><button className="icon-button" aria-label="Notifications" onClick={() => setNotifsOpen(true)}><Flame /></button><AuthControls /></div></header>
        <div className="page-wrap">
          <div className="welcome-row"><div><p className="eyebrow">{currentDateStr}</p><h1 className="page-title">{greetingText}, {currentUser?.name?.split(' ')[0] ?? 'there'}<span className="text-coral">.</span></h1><p className="mt-2 text-muted-foreground">Small steps today compound into confident assessment days.</p></div><button className="primary-button" onClick={() => setTutorOpen(true)}><Sparkles /> Ask your AI coach <ArrowUpRight /></button></div>

          {technicalSet ? (
            <TechnicalAssessment setId={technicalSet.id} setName={technicalSet.name} setNumber={technicalSet.number} onBack={() => setTechnicalSet(null)} onPremium={() => setPremiumOpen(true)} />
          ) : englishAssessment ? (
            <EnglishAssessment onBack={() => setEnglishAssessment(false)} />
          ) : moduleOpen ? (
            <ModuleView stage={selected} backendModule={catalogModules.find((module) => module.slug === selected.id || (selected.id === 'coding' && module.slug === 'ai-coding') || (selected.id === 'ai-coding' && module.slug === 'coding'))} onBack={() => setModuleOpen(false)} onTutor={() => setTutorOpen(true)} onAssessment={() => setEnglishAssessment(true)} onSet={(set) => setTechnicalSet(set)} isPremium={isPremium} onPremium={() => setPremiumOpen(true)} />
          ) : navView === 'journey' ? (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setNavView('dashboard')}><ChevronRight className="rotate-180" /> Back to Dashboard</button>
              <div className="section-heading"><div><p className="eyebrow text-muted-foreground">Your roadmap</p><h2 className="section-title">Full Assessment Journey ({stages.length} Stages)</h2></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolvedStages.map((stg) => (
                  <div key={stg.id} className="border rounded-2xl p-6 bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="stage-number">Stage {stg.number}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{stg.progress}% ready</span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold">{stg.name} {stg.label}</h3>
                    <p className="text-sm text-muted-foreground">{stg.meta}</p>
                    <div className="h-2 rounded-full bg-black/10"><div className="h-full rounded-full bg-foreground" style={{ width: `${stg.progress}%` }} /></div>
                    <button className="primary-button text-xs py-2 px-4" onClick={() => { setActiveStage(stg.id); setModuleOpen(true); }}>Go to {stg.name} <ArrowUpRight /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : navView === 'progress' ? (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setNavView('dashboard')}><ChevronRight className="rotate-180" /> Back to Dashboard</button>
              <div className="section-heading"><div><p className="eyebrow text-muted-foreground">My Progress</p><h2 className="section-title">Preparation & Readiness Analytics</h2></div></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-2xl p-6 bg-card flex flex-col items-center justify-center text-center">
                  <p className="eyebrow text-muted-foreground mb-4">Overall Readiness</p>
                  <ProgressRing value={overallReadiness} />
                  <strong className="mt-4 text-2xl font-bold">{overallReadiness}% Complete</strong>
                </div>
                <div className="md:col-span-2 border rounded-2xl p-6 bg-card space-y-4">
                  <p className="eyebrow text-muted-foreground">Readiness Breakdown by Stage</p>
                  {resolvedStages.map((stg) => (
                    <div key={stg.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{stg.name} {stg.label}</span>
                        <span>{stg.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${stg.progress}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : navView === 'history' ? (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setNavView('dashboard')}><ChevronRight className="rotate-180" /> Back to Dashboard</button>
              <div className="section-heading"><div><p className="eyebrow text-muted-foreground">Attempt History</p><h2 className="section-title">Your Practice Attempt Log</h2></div></div>
              <div className="flex gap-2 border-b border-border pb-3">
                {['All', 'English', 'Technical', 'Debugging', 'AI Coding'].map((f) => (
                  <button key={f} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${historyFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`} onClick={() => setHistoryFilter(f)}>{f}</button>
                ))}
              </div>
              <div className="space-y-3">
                {attemptHistory.filter((a) => historyFilter === 'All' || a.moduleName?.toLowerCase().includes(historyFilter.toLowerCase())).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No attempts recorded for this category yet.</p>
                ) : (
                  attemptHistory.filter((a) => historyFilter === 'All' || a.moduleName?.toLowerCase().includes(historyFilter.toLowerCase())).map((a) => (
                    <div key={a.id} className="border rounded-xl p-4 bg-card flex items-center justify-between">
                      <div>
                        <strong className="text-sm font-semibold block">{a.practiceSetName || 'Practice Set'}</strong>
                        <span className="text-xs text-muted-foreground">{a.moduleName} · {a.startedAt ? new Date(a.startedAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <span className="score-pill font-bold">{a.score !== null ? `${a.score}%` : 'In Progress'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : navView === 'library' ? (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setNavView('dashboard')}><ChevronRight className="rotate-180" /> Back to Dashboard</button>
              <div className="section-heading"><div><p className="eyebrow text-muted-foreground">Learning Library</p><h2 className="section-title">Assessment Preparation Guides & Topics</h2></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'AI Literacy & LLM Concepts', desc: 'Temperature, context windows, prompt structure, and responsible AI.', stage: 'technical' },
                  { title: 'Boundary Conditions & Loop Debugging', desc: 'Off-by-one errors, loop termination, edge cases in C, C++, Java, Python, JS.', stage: 'debugging' },
                  { title: 'Arrays, Strings & Searching Algorithms', desc: 'Two-pointer, prefix sums, binary search, and algorithmic optimization.', stage: 'coding' },
                  { title: 'Workplace English Communication', desc: 'Reading comprehension, detail listening, and structured email/report writing.', stage: 'english' },
                ].map((item) => (
                  <div key={item.title} className="border rounded-2xl p-6 bg-card space-y-3">
                    <strong className="text-base font-bold block">{item.title}</strong>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    <button className="secondary-button text-xs py-1.5 px-3" onClick={() => { setActiveStage(item.stage); setModuleOpen(true); }}>Study Guide <ArrowUpRight /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : navView === 'bookmarks' ? (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setNavView('dashboard')}><ChevronRight className="rotate-180" /> Back to Dashboard</button>
              <div className="section-heading"><div><p className="eyebrow text-muted-foreground">Bookmarks</p><h2 className="section-title">Saved Practice Sets & Topics</h2></div></div>
              <div className="space-y-3">
                {bookmarks.map((b) => (
                  <div key={b} className="border rounded-xl p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-4 h-4 text-primary fill-primary" />
                      <div>
                        <strong className="text-sm font-semibold block uppercase">{b.replace('-', ' ')}</strong>
                        <span className="text-xs text-muted-foreground">Saved for revision</span>
                      </div>
                    </div>
                    <button className="secondary-button text-xs" onClick={() => setBookmarks((prev) => prev.filter((x) => x !== b))}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ) : navView === 'settings' ? (
            <div className="space-y-6">
              <button className="back-link" onClick={() => setNavView('dashboard')}><ChevronRight className="rotate-180" /> Back to Dashboard</button>
              <div className="section-heading"><div><p className="eyebrow text-muted-foreground">Settings</p><h2 className="section-title">Account & Workspace Settings</h2></div></div>
              <div className="border rounded-2xl p-6 bg-card space-y-6 max-w-xl">
                <div className="space-y-2">
                  <span className="eyebrow">User Profile</span>
                  <p className="text-sm font-semibold">{currentUser?.name ?? 'Student'}</p>
                  <p className="text-xs text-muted-foreground">Access level: {isPremium ? 'Premium Active' : 'Free Tier'}</p>
                </div>
                <div className="space-y-2 border-t pt-4">
                  <span className="eyebrow">Notifications</span>
                  <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} className="rounded" />
                    Enable daily practice reminder notifications
                  </label>
                </div>
                {!isPremium && (
                  <div className="border-t pt-4 space-y-2">
                    <span className="eyebrow">Subscription</span>
                    <button className="primary-button text-xs py-2 px-4" onClick={() => setPremiumOpen(true)}>Upgrade to Premium (₹59) <ArrowUpRight /></button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {userLoaded && (!isPremium ? <section className="premium-banner"><div><p className="eyebrow">One subscription, complete preparation</p><h2>Unlock your full assessment journey</h2><p>100 practice sets · Advanced AI analysis · Personalized learning</p></div><div className="premium-banner-action"><strong>₹{premiumPrice}</strong><button className="primary-button" onClick={() => setPremiumOpen(true)}>Unlock Premium <ArrowUpRight /></button></div></section> : <div className="premium-active"><Check /> <strong>Premium active</strong><span>{unlockedSetCount} practice sets unlocked across PrepVvise</span></div>)}

              <section className="hero-grid mt-8">
                <div className="readiness-card"><div><p className="eyebrow text-muted-foreground">Overall readiness</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">{overallReadiness > 0 ? "You're building momentum." : "Ready to begin your journey."}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Your practice progress is a snapshot of your preparation — not a prediction of hiring outcomes.</p></div><div className="mt-8 flex items-end gap-7"><ProgressRing value={overallReadiness} /><div className="flex-1 pb-1"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">This week</span><span className="text-muted-foreground">{weeklyProgress.length ? `${weeklyProgress[weeklyProgress.length - 1]}%` : '—'}</span></div><div className="mt-2 flex h-14 items-end gap-1.5">{weeklyProgress.length ? weeklyProgress.map((height, index) => <div key={index} className="chart-bar" style={{ height: `${Math.min(height, 100)}%`, opacity: index < 4 ? .35 : index < 8 ? .6 : 1 }} />) : <div className="chart-bar" style={{ height: "4px" }} />}</div><div className="mt-2 flex gap-1.5">{weeklyProgress.slice(-5).map((score, index) => <span key={index} className="text-xs text-muted-foreground">{score}%</span>)}</div></div></div></div>
                <div className="focus-card"><div className="flex items-start justify-between"><div><p className="eyebrow text-muted-foreground">Focus today</p><p className="mt-3 font-display text-2xl font-semibold">{weakestStage ? weakestStage.name + ' ' + weakestStage.label : 'Start with any module.'}</p></div><div className="focus-icon"><Zap /></div></div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{weakestStage ? `Your progress in ${weakestStage.name} needs attention. Focus here first.` : 'Complete a few practice sets to get a personalized focus recommendation.'}</p>{weakestStage && <div className="mt-6 flex items-center gap-3"><div className={`avatar stage-${weakestStage.color}`}></div><div className="flex-1"><p className="text-sm font-semibold">{weakestStage.name} · {weakestStage.label}</p><button className="secondary-button mt-2" onClick={() => { setActiveStage(weakestStage.id); setModuleOpen(true) }}>Go to {weakestStage.name} <ArrowUpRight /></button></div></div>}</div>
              </section>

              <section className="mt-10" id="journey"><div className="section-heading"><div><p className="eyebrow text-muted-foreground">Your roadmap</p><h2 className="section-title">Assessment journey</h2></div><button className="text-button" onClick={() => setNavView('journey')}>View full journey <ArrowUpRight /></button></div><div className="journey-track">{stages.map((stage) => <StageCard key={stage.id} stage={stage} active={selected.id === stage.id} onSelect={() => { setActiveStage(stage.id); setModuleOpen(true) }} />)}</div><div className="stage-detail"><div className="stage-detail-main"><div className={`detail-icon stage-${selected.color}`}><selected.icon /></div><div><p className="eyebrow text-muted-foreground">Selected stage · {selected.number}</p><h3 className="mt-1 font-display text-2xl font-semibold">{selected.name}{' '}{selected.label}</h3><p className="mt-2 text-sm text-muted-foreground">{selected.meta} · Unlimited practice attempts</p></div></div><div className="stage-detail-stats"><div><span className="stat-value">{selected.progress}%</span><span className="stat-label">best score</span></div><div><span className="stat-value">12</span><span className="stat-label">attempts</span></div><button className="primary-button primary-button-small" onClick={() => { setActiveStage(selected.id); setModuleOpen(true) }}><Play /> Continue</button></div></div></section>

              <section className="bottom-grid mt-10"><div className="activity-card" id="history"><div className="section-heading"><div><p className="eyebrow text-muted-foreground">Recent practice</p><h2 className="section-title">Keep the streak going</h2></div><button className="text-button" onClick={() => setNavView('history')}>See history <ArrowUpRight /></button></div><div className="activity-list">{activityItems.map((item) => <div className="activity-row" key={item.title}><div className={`activity-icon stage-${item.tone}`}><Check /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.stage} · {item.time}</p></div><span className="score-pill">{item.score}</span><ChevronRight className="size-4 text-muted-foreground" /></div>)}</div></div><div className="recommendation-card"><div className="flex items-center gap-2"><Sparkles className="size-4 text-coral" /><p className="eyebrow">AI recommendation</p></div><h3 className="mt-5 font-display text-xl font-semibold leading-tight">Turn your mistakes into your next advantage.</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Review <strong className="font-semibold text-foreground">boundary conditions</strong> for 8 minutes, then reattempt the focused set while the pattern is fresh.</p><button className="secondary-button mt-6" onClick={() => setTutorOpen(true)}>Ask your AI coach <ArrowUpRight /></button></div></section>
            </>
          )}
        </div>
      </section>

      {/* SEARCH MODAL */}
      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="submit-modal max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-display font-semibold text-sm">Search Practice, Topics or Concepts</span>
              <button className="text-muted-foreground hover:text-foreground text-sm font-bold" onClick={() => setSearchOpen(false)}>×</button>
            </div>
            <div className="flex items-center gap-2 border rounded-xl p-3 bg-muted/20">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search (e.g. Technical, Debugging, Reading...)"
                className="w-full bg-transparent border-0 text-xs text-foreground focus:outline-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
              {resolvedStages
                .filter((stg) => !searchQuery || stg.name.toLowerCase().includes(searchQuery.toLowerCase()) || stg.meta.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((stg) => (
                  <button
                    key={stg.id}
                    className="w-full p-3 border rounded-xl text-left bg-card hover:bg-muted/30 flex items-center justify-between"
                    onClick={() => { setActiveStage(stg.id); setModuleOpen(true); setSearchOpen(false); }}
                  >
                    <div>
                      <strong className="block font-bold text-foreground">{stg.name} {stg.label}</strong>
                      <span className="text-muted-foreground text-[11px]">{stg.meta}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DRAWER */}
      {notifsOpen && (
        <div className="modal-backdrop" onClick={() => setNotifsOpen(false)}>
          <div className="submit-modal max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-display font-semibold text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-coral" /> Notifications & Practice Alerts</span>
              <button className="text-muted-foreground hover:text-foreground text-sm font-bold" onClick={() => setNotifsOpen(false)}>×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 border rounded-xl bg-card space-y-1">
                <strong className="block font-bold">🔥 3-Day Practice Streak!</strong>
                <p className="text-muted-foreground">Keep completing daily practice sets to maintain your assessment momentum.</p>
              </div>
              <div className="p-3 border rounded-xl bg-card space-y-1">
                <strong className="block font-bold">✨ AI Coach Recommendation Ready</strong>
                <p className="text-muted-foreground">Your coach recommends practicing Debugging boundary conditions.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {premiumOpen && <PremiumModal onClose={() => setPremiumOpen(false)} onUnlock={beginPremiumCheckout} />}
      {tutorOpen && <div className="tutor-panel" id="tutor"><div className="tutor-header"><div className="flex items-center gap-3"><div className="brand-mark"><Sparkles /></div><div><p className="font-display font-semibold">Prepvvise coach</p><p className="text-xs text-muted-foreground">Context-aware guidance</p></div></div><button className="icon-button" onClick={() => setTutorOpen(false)} aria-label="Close tutor">×</button></div><div className="tutor-body"><div className="coach-message"><Sparkles className="size-4 shrink-0 text-coral" /><p>I noticed you&apos;re working on <strong>Debugging · Loops</strong>. Want a conceptual hint, a worked example, or a quick practice set?</p></div>{sent && <div className="coach-message coach-message-user"><UserRound className="size-4 shrink-0" /><p>{assistantLoading ? 'Thinking through that with you…' : message || 'I&apos;ll help you work through that step by step.'}</p></div>}{assistantReply && <div className="coach-message"><Sparkles className="size-4 shrink-0 text-coral" /><p>{assistantReply}</p></div>}</div><div className="tutor-suggestions"><button onClick={() => { setMessage('Give me a hint about boundary conditions'); void sendMessage('Give me a hint about boundary conditions'); }}>Give me a hint</button><button onClick={() => { setMessage('Create 5 questions from my mistakes'); void sendMessage('Create 5 questions from my mistakes'); }}>Create practice</button></div><div className="tutor-input"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) sendMessage() }} placeholder="Ask anything about your practice..." /><button onClick={() => sendMessage()} aria-label="Send message"><ArrowUpRight /></button></div></div>}
    </main>
  )
}

// The dashboard uses demo data so the product experience can be explored immediately.
// Scores are practice-progress indicators, not hiring predictions.

const _ = Gauge
const __ = UserRound
const ___ = MessageCircle
export { _, __, ___ }

function EnglishAssessment({ onBack }: { onBack: () => void }) {
  const [skill, setSkill] = useState<'reading' | 'listening' | 'writing'>('reading')
  const [started, setStarted] = useState(false)
  const [question, setQuestion] = useState(1)
  const [questions, setQuestions] = useState<Array<{ id: string; position: number; prompt: string; kind: string; content: Record<string, unknown>; options: Array<{ id: string; label: string; value: string }> }>>([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const setNumber = skill === 'reading' ? 1 : skill === 'listening' ? 2 : 3
  const setNames: Record<number, string> = { 1: 'Reading Comprehension', 2: 'Listening Comprehension', 3: 'Workplace Writing' }

  const startAssessment = async () => {
    setLoading(true)
    setError(null)
    try {
      const [setRes, attemptRes] = await Promise.all([
        fetch(`/api/sets/${setNumber <= 2 ? '1' : '3'}`),
        fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ practiceSetId: setNumber <= 2 ? '1' : '3' }),
        }),
      ])
      if (!setRes.ok) throw new Error('Failed to load questions')
      const set = await setRes.json()
      if (!attemptRes.ok) throw new Error('Failed to start assessment')
      const attempt = await attemptRes.json()
      setQuestions(set.questions ?? [])
      setAttemptId(attempt.id)
      setTotalCount(set.questions?.length ?? 0)
      setStarted(true)
      setQuestion(1)
      setSelectedAnswer('')
      setDraft('')
      setSubmitted(false)
      setScore(null)
      setAnsweredCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = async (answer: Record<string, unknown>) => {
    if (!attemptId) return
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: questions[question - 1]?.id, answer }),
      })
      if (res.ok) {
        const currentQ = questions[question - 1]
        if (currentQ && !selectedAnswer && answer?.optionId) {
          setAnsweredCount((c) => c + 1)
        }
      }
    } catch {
      // Answer save failed, but we continue
    }
  }

  const handleNext = async () => {
    const currentQ = questions[question - 1]
    if (!currentQ) return

    if (skill === 'reading' || skill === 'listening') {
      if (!selectedAnswer) return
      await saveAnswer({ optionId: currentQ.options.find((o) => o.label === selectedAnswer)?.id ?? '' })
    }

    if (question < totalCount) {
      setQuestion(question + 1)
      setSelectedAnswer('')
    } else {
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (skill === 'writing' && draft.trim()) {
      const currentQ = questions[question - 1]
      if (currentQ) {
        await saveAnswer({ text: draft.trim() })
      }
    }
    if (!attemptId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: 'POST' })
      if (res.ok) {
        const result = await res.json()
        setScore(result.score ?? null)
        setSubmitted(true)
      }
    } catch {
      setError('Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const currentQ = questions[question - 1]

  if (loading && !started) return <section className="assessment-entry"><button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> English Communication</button><div className="assessment-entry-grid"><div className="assessment-summary"><p className="eyebrow">Starting assessment</p><p>Loading questions...</p></div></div></section>

  if (error && !started) return <section className="assessment-entry"><button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> English Communication</button><div className="assessment-entry-grid"><div className="assessment-summary"><p className="text-destructive">{error}</p><button className="secondary-button mt-4" onClick={startAssessment}>Try again</button></div></div></section>

  if (!started) return <section className="assessment-entry">
    <button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> English Communication</button>
    <div className="assessment-entry-grid"><div><p className="eyebrow text-muted-foreground">English Communication</p><h1 className="assessment-heading">{skill[0].toUpperCase() + skill.slice(1)} assessment</h1><p className="assessment-lede">{skill === 'reading' ? 'Test your reading comprehension across ideas, details, and inference.' : skill === 'listening' ? 'Listen carefully. Understand the context. Choose the most appropriate answer.' : 'Express your ideas clearly and effectively in realistic workplace situations.'}</p><div className="assessment-switcher">{(['reading', 'listening', 'writing'] as const).map((item) => <button className={skill === item ? 'active' : ''} key={item} onClick={() => setSkill(item)}>{item}</button>)}</div></div><div className="assessment-summary"><p className="eyebrow">What you&apos;ll practice</p><ul>{(skill === 'reading' ? ['Reading comprehension', 'Main idea identification', 'Inference', 'Vocabulary in context', 'Critical reading'] : skill === 'listening' ? ['Listening comprehension', 'Detail recognition', 'Context understanding', 'Speaker intent'] : ['Grammar', 'Vocabulary', 'Clarity', 'Structure', 'Professional tone']).map((item) => <li key={item}><Check /> {item}</li>)}</ul><div className="assessment-meta"><span>{skill === 'writing' ? '2 writing tasks' : skill === 'reading' ? '3 questions' : '3 questions'}</span><span>{skill === 'reading' ? '25 minutes' : skill === 'listening' ? '20 minutes' : '30 minutes'}</span></div><button className="primary-button" onClick={startAssessment} disabled={loading}>{loading ? 'Loading...' : 'Start assessment'} <ArrowUpRight /></button></div></div>
  </section>

  if (submitted && score !== null) return <section className="assessment-results"><button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> English Communication</button><p className="eyebrow text-muted-foreground">AI performance analysis</p><h1 className="assessment-heading">Your communication is taking shape.</h1><p className="assessment-lede">Based on your responses in this attempt.</p><div className="analysis-grid"><div className="analysis-card"><span>Overall performance</span><strong>{score}%</strong><div className="progress-track"><div style={{ width: `${score}%` }} /></div></div><div className="analysis-card"><p className="eyebrow">Answered</p><p>{answeredCount} / {totalCount} questions</p></div><div className="analysis-card"><p className="eyebrow">Next focus</p><p>→ Review your incorrect answers</p><p>→ Practice the weakest skill area</p></div></div><div className="analysis-note"><Sparkles /><div><p className="eyebrow">AI coach note</p><p>Review your responses and focus on the areas where you lost points. Consistent practice across reading, listening, and writing builds complete communication confidence.</p></div></div><button className="primary-button mt-6" onClick={onBack}>Back to dashboard <ArrowUpRight /></button></section>

  return <section className="assessment-workspace"><div className="assessment-top"><button className="back-link" onClick={onBack}><ChevronRight className="rotate-180" /> Exit assessment</button><div><p className="eyebrow">{skill} assessment</p><strong>Question {String(question).padStart(2, '0')} / {totalCount}</strong></div><span className="assessment-timer">{skill === 'writing' ? '24:18' : '14:32'} remaining</span></div>
    {skill === 'reading' && currentQ && currentQ.kind === 'reading' && <div className="reading-layout"><article className="passage-panel"><p className="eyebrow text-muted-foreground">Passage</p><h2>-reading-</h2><p style={{ whiteSpace: 'pre-line' }}>{String(currentQ.content?.passage ?? '')}</p></article><div className="question-panel"><p className="eyebrow text-muted-foreground">Question {String(question).padStart(2, '0')}</p><h2>{currentQ.prompt}</h2><div className="answer-list">{currentQ.options.map((option) => <button className={selectedAnswer === option.label ? 'selected' : ''} key={option.id} onClick={() => { setSelectedAnswer(option.label); saveAnswer({ optionId: option.id }) }}><span>{option.label}</span>{option.value}</button>)}</div></div></div>}
    {skill === 'listening' && currentQ && currentQ.kind === 'listening' && <div className="listening-layout"><div className="audio-card"><AudioLines/><p className="eyebrow">Workplace conversation</p><h2>Listening exercise</h2><button className="audio-play">Play recording</button><div className="audio-progress"><span style={{ width: '12%' }} /></div><div className="audio-time"><span>00:00</span><span>02:04</span></div><p className="audio-caption">{currentQ.content?.transcript ? 'Transcript available for practice' : 'Audio will play automatically'}</p></div><div className="question-panel"><p className="eyebrow text-muted-foreground">Question {String(question).padStart(2, '0')}</p><h2>{currentQ.prompt}</h2><div className="answer-list">{currentQ.options.map((option, index) => <button className={selectedAnswer === option.label ? 'selected' : ''} key={option.id} onClick={() => { setSelectedAnswer(option.label); saveAnswer({ optionId: option.id }) }}><span>{String.fromCharCode(65 + index)}</span>{option.value}</button>)}</div></div></div>}
    {skill === 'writing' && currentQ && currentQ.kind === 'writing' && <div className="writing-layout"><div className="writing-task"><p className="eyebrow text-muted-foreground">Task {String(question).padStart(2, '0')} / {totalCount}</p><h2>{currentQ.prompt}</h2><div className="requirements"><p className="eyebrow">Requirements</p><p>· Clear purpose and structure</p><p>· Professional tone</p><span>Recommended length: 150-200 words</span></div></div><div className="writing-editor"><div className="editor-toolbar"><span>Subject: Response</span><span>Auto-saved just now</span></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Start writing your response..." /><div className="word-count">{draft.trim() ? draft.trim().split(/\s+/).length : 0} / 200 words <button onClick={() => setDraft('')}>Clear draft</button></div></div></div>}
    <div className="assessment-footer"><div className="question-dots">{Array.from({ length: totalCount }, (_, i) => <button className={i + 1 === question ? 'active' : ''} key={i + 1} onClick={() => setQuestion(i + 1)}>{String(i + 1).padStart(2, '0')}</button>)}</div><div className="assessment-actions"><button className="secondary-button">Mark for review</button><button className="primary-button" onClick={handleNext} disabled={loading}>{question < totalCount ? 'Next' : 'Submit'} <ArrowUpRight /></button></div></div>
  </section>
}

