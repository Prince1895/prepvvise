'use client'

import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
  Search,
  X,
  Sparkles,
  Award,
  AlertTriangle,
  Info,
  Lightbulb,
  Copy,
  Check,
  HelpCircle,
  XCircle,
  Brain,
  Code2,
  FileText,
  Bookmark,
  Layers,
  ShieldCheck,
  Target
} from 'lucide-react'
import {
  getAILiteracyContent,
  getAllAILiteracyLessons,
  getAdjacentAILiteracyLessons,
  getAILiteracyGlossary,
  getAILiteracyCheatSheets
} from '@/lib/content/technical/ai-literacy'
import {
  ContentBlock,
  DifficultyLevel,
  Lesson,
  QuizItem
} from '@/lib/content/technical/ai-literacy/types'

export function AILiteracyLearnView() {
  const contentModel = useMemo(() => getAILiteracyContent(), [])
  const allLessons = useMemo(() => getAllAILiteracyLessons(), [])
  const glossaryList = useMemo(() => getAILiteracyGlossary(), [])
  const cheatSheetsList = useMemo(() => getAILiteracyCheatSheets(), [])

  // Navigation tab: 'curriculum' | 'glossary' | 'cheatsheets'
  const [activeTab, setActiveTab] = useState<'curriculum' | 'glossary' | 'cheatsheets'>('curriculum')

  // Currently active lesson (defaults to first lesson)
  const [activeSlug, setActiveSlug] = useState<string>(
    allLessons[0]?.slug || 'what-is-artificial-intelligence'
  )

  // Filters & Search
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [glossaryQuery, setGlossaryQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set())

  // Active lesson
  const currentLesson = useMemo(() => {
    return allLessons.find((l) => l.slug === activeSlug) || allLessons[0]
  }, [allLessons, activeSlug])

  // Navigation
  const { prevLesson, nextLesson, currentIndex, totalLessons, currentSection } = useMemo(() => {
    return getAdjacentAILiteracyLessons(activeSlug)
  }, [activeSlug])

  // Filter sections & lessons
  const filteredSections = useMemo(() => {
    return contentModel.sections
      .map((sec) => {
        const matchingLessons = sec.lessons.filter((les) => {
          const matchesLevel = selectedLevel === 'all' || les.level === selectedLevel
          if (!matchesLevel) return false

          if (!searchQuery.trim()) return true
          const q = searchQuery.toLowerCase()
          return (
            les.title.toLowerCase().includes(q) ||
            les.slug.toLowerCase().includes(q) ||
            les.objectives?.some((o) => o.toLowerCase().includes(q))
          )
        })
        return {
          ...sec,
          lessons: matchingLessons,
        }
      })
      .filter((sec) => sec.lessons.length > 0)
  }, [contentModel, selectedLevel, searchQuery])

  // Filter glossary
  const filteredGlossary = useMemo(() => {
    if (!glossaryQuery.trim()) return glossaryList
    const q = glossaryQuery.toLowerCase()
    return glossaryList.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q) ||
        g.simpleExplanation.toLowerCase().includes(q)
    )
  }, [glossaryList, glossaryQuery])

  const handleSelectLesson = (slug: string) => {
    setActiveSlug(slug)
    setActiveTab('curriculum')
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const markCompleted = (slug: string) => {
    setCompletedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const progressPercent = Math.round(
    ((currentIndex + 1) / (totalLessons || 1)) * 100
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Bar Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                AI LITERACY
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Technical Assessment Curriculum
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-foreground leading-tight mt-0.5">
              {activeTab === 'curriculum'
                ? currentLesson?.title
                : activeTab === 'glossary'
                ? 'AI Terminology Glossary'
                : 'AI Literacy Revision & Cheat Sheets'}
            </h1>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-muted p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'curriculum'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Curriculum ({allLessons.length})
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'glossary'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Glossary ({glossaryList.length})
            </button>
            <button
              onClick={() => setActiveTab('cheatsheets')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'cheatsheets'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cheat Sheets
            </button>
          </div>

          {activeTab === 'curriculum' && (
            <button
              onClick={() => markCompleted(activeSlug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                completedSlugs.has(activeSlug)
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-background hover:bg-muted text-foreground'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {completedSlugs.has(activeSlug) ? 'Completed' : 'Mark Done'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Left Navigation Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-80 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0 flex flex-col shrink-0 ${
            mobileMenuOpen ? 'translate-x-0 h-full' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile view tabs */}
          <div className="sm:hidden p-2 border-b border-border flex items-center justify-around bg-muted/40 text-xs">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-2 py-1 rounded font-medium ${activeTab === 'curriculum' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Curriculum
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-2 py-1 rounded font-medium ${activeTab === 'glossary' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Glossary
            </button>
            <button
              onClick={() => setActiveTab('cheatsheets')}
              className={`px-2 py-1 rounded font-medium ${activeTab === 'cheatsheets' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Cheat Sheets
            </button>
          </div>

          {/* Level Filter Pills */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search 248 AI lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {(['all', 'beginner', 'intermediate', 'advanced', 'expert'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1 rounded-full font-medium capitalize shrink-0 transition-colors ${
                    selectedLevel === lvl
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Lessons List Accordion */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {filteredSections.map((sec) => (
              <div key={sec.id} className="space-y-1">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Sec {sec.position}. {sec.title}</span>
                  <span className="text-[10px] font-mono">({sec.lessons.length})</span>
                </div>

                <div className="space-y-0.5">
                  {sec.lessons.map((les) => {
                    const isActive = les.slug === activeSlug && activeTab === 'curriculum'
                    const isDone = completedSlugs.has(les.slug)

                    return (
                      <button
                        key={les.id}
                        onClick={() => handleSelectLesson(les.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <BookOpen className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate leading-snug">{les.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                            <span className="capitalize">{les.level}</span>
                            <span>•</span>
                            <span>{les.durationMinutes}m</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No lessons match &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 min-w-0">
          {activeTab === 'curriculum' && currentLesson && (
            <>
              {/* Lesson Banner Header */}
              <div className="space-y-4 border-b border-border pb-6">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {currentSection && (
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Section {currentSection.position}: {currentSection.title}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-foreground uppercase text-[10px]">
                    {currentLesson.level}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {currentLesson.durationMinutes} min read
                  </span>
                  <span className="text-muted-foreground">
                    Lesson {currentIndex + 1} of {totalLessons}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {currentLesson.title}
                </h1>

                {/* Learning Objectives Box */}
                {currentLesson.objectives && currentLesson.objectives.length > 0 && (
                  <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      Learning Objectives
                    </span>
                    <ul className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {currentLesson.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Lesson Content Blocks */}
              <div className="space-y-4">
                {currentLesson.content.map((block, idx) => (
                  <RenderAILiteracyBlock key={idx} block={block} />
                ))}
              </div>

              {/* Examples if present */}
              {currentLesson.examples && currentLesson.examples.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Real-World Examples & Architecture
                  </h3>
                  {currentLesson.examples.map((ex, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs sm:text-sm">
                      <h4 className="font-semibold text-foreground text-sm">{ex.title}</h4>
                      {ex.context && <p className="text-muted-foreground"><strong>Context:</strong> {ex.context}</p>}
                      {ex.input && (
                        <div className="p-3 rounded bg-muted/50 font-mono text-xs space-y-1">
                          <div><strong>Input:</strong> {ex.input}</div>
                          {ex.features && <div><strong>Features:</strong> {ex.features.join(', ')}</div>}
                          {ex.model && <div><strong>Model:</strong> {ex.model}</div>}
                          {ex.prediction && <div><strong>Prediction:</strong> {ex.prediction}</div>}
                        </div>
                      )}
                      {ex.explanation && <p className="text-muted-foreground leading-relaxed">{ex.explanation}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Knowledge Check Quizzes */}
              {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Assessment Knowledge Check
                  </h3>
                  {currentLesson.quiz.map((q, idx) => (
                    <RenderQuizCard key={idx} quiz={q} />
                  ))}
                </div>
              )}

              {/* Key Takeaways */}
              {currentLesson.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
                <div className="my-6 p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
                    <Award className="w-5 h-5" />
                    Key Takeaways
                  </div>
                  <ul className="space-y-2">
                    {currentLesson.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                {prevLesson ? (
                  <button
                    onClick={() => handleSelectLesson(prevLesson.slug)}
                    className="w-full sm:w-auto flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted text-left transition-colors group"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1 transition-transform" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Previous Lesson
                      </span>
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {prevLesson.title}
                      </span>
                    </div>
                  </button>
                ) : <div />}

                {nextLesson ? (
                  <button
                    onClick={() => handleSelectLesson(nextLesson.slug)}
                    className="w-full sm:w-auto flex items-center justify-end gap-3 p-3 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-right transition-colors group ml-auto"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-primary block">
                        Next Lesson
                      </span>
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {nextLesson.title}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    🎉 You have completed all 248 lessons in AI Literacy!
                  </div>
                )}
              </div>
            </>
          )}

          {/* Glossary View */}
          {activeTab === 'glossary' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">AI Terminology Glossary</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Master core AI nomenclature, definitions, and technical explanations.
                </p>

                <div className="mt-4 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search terminology (e.g. LLM, Transformer, Hallucination, Embedding)..."
                    value={glossaryQuery}
                    onChange={(e) => setGlossaryQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredGlossary.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-foreground text-base">{item.term}</h3>
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                        GLOSSARY
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-foreground">{item.definition}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Simple Explanation:</strong> {item.simpleExplanation}
                    </p>
                    <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <strong>Example:</strong> {item.example}
                    </div>
                  </div>
                ))}

                {filteredGlossary.length === 0 && (
                  <p className="text-center py-12 text-sm text-muted-foreground">
                    No glossary terms match &quot;{glossaryQuery}&quot;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cheat Sheets View */}
          {activeTab === 'cheatsheets' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground">AI Literacy Revision & Cheat Sheets</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Rapid-fire revision cards and comparison tables for campus recruitment & technical assessments.
                </p>
              </div>

              <div className="grid gap-6">
                {cheatSheetsList.map((cs) => (
                  <div key={cs.id} className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-primary" />
                        {cs.title}
                      </h3>
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {cs.category}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {cs.points.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {cs.tables && cs.tables.map((tbl, tIdx) => (
                      <div key={tIdx} className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/60 border-b border-border">
                            <tr>
                              {tbl.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-3 font-semibold text-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {tbl.rows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-muted/30">
                                {r.map((c, cIdx) => (
                                  <td key={cIdx} className="p-3 text-muted-foreground">{c}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Sub-component for rendering content blocks
function RenderAILiteracyBlock({ block }: { block: ContentBlock }) {
  const [copied, setCopied] = useState(false)

  switch (block.type) {
    case 'heading':
      return <h2 className="text-xl font-bold tracking-tight text-foreground mt-6 mb-3 border-b border-border/40 pb-2">{block.text}</h2>
    case 'subheading':
      return <h3 className="text-base font-semibold text-foreground mt-4 mb-2">{block.text}</h3>
    case 'paragraph':
      return <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground my-2.5">{block.text}</p>
    case 'bulletList':
      return (
        <ul className="my-3 space-y-1.5 pl-2">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'numberedList':
      return (
        <ol className="my-3 space-y-2">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[11px] mt-0.5 font-mono">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'code':
      return (
        <div className="my-4 rounded-xl border border-border bg-slate-950 text-slate-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>{block.filename || block.language?.toUpperCase() || 'CODE'}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(block.code)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="flex items-center gap-1 hover:text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto"><code>{block.code}</code></pre>
        </div>
      )
    case 'note':
      return (
        <div className="my-4 flex items-start gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-xs sm:text-sm">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            {block.title && <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">{block.title}</h5>}
            <p className="text-blue-900/90 dark:text-blue-200/90 leading-relaxed">{block.text}</p>
          </div>
        </div>
      )
    case 'warning':
      return (
        <div className="my-4 flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            {block.title && <h5 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">{block.title}</h5>}
            <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed">{block.text}</p>
          </div>
        </div>
      )
    case 'tip':
      return (
        <div className="my-4 flex items-start gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs sm:text-sm">
          <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            {block.title && <h5 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1">{block.title}</h5>}
            <p className="text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">{block.text}</p>
          </div>
        </div>
      )
    case 'comparison':
      return (
        <div className="my-5 border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/40 font-bold text-sm text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            {block.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  {block.columns.map((col, idx) => (
                    <th key={idx} className="p-3 font-semibold text-foreground border-r last:border-r-0 border-border">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-muted-foreground border-r last:border-r-0 border-border leading-relaxed">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    case 'scenario':
      return (
        <div className="my-5 p-5 rounded-2xl border border-border bg-card space-y-3 text-xs sm:text-sm shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Brain className="w-4 h-4" />
            {block.title || 'Practical Scenario'}
          </span>
          <p className="font-medium text-foreground"><strong>Context:</strong> {block.context}</p>
          <p className="text-muted-foreground"><strong>Problem:</strong> {block.problem}</p>
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
            <p className="font-semibold text-primary">Recommended Approach:</p>
            <p className="text-foreground">{block.recommendedApproach}</p>
            <p className="text-xs text-muted-foreground mt-1">{block.reasoning}</p>
          </div>
        </div>
      )
    case 'checklist':
      return (
        <div className="my-4 p-4 rounded-xl border border-border bg-card space-y-2">
          {block.title && <h5 className="font-bold text-xs sm:text-sm text-foreground">{block.title}</h5>}
          <div className="space-y-1.5">
            {block.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'workflow':
      return (
        <div className="my-4 p-4 rounded-xl border border-border bg-card space-y-3">
          <h5 className="font-bold text-xs sm:text-sm text-foreground">{block.title}</h5>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {block.steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <span className="px-3 py-1.5 rounded-lg border border-border bg-muted font-medium text-foreground">
                  {step}
                </span>
                {idx < block.steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )
    case 'table':
      return (
        <div className="my-5 overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                {block.headers.map((h, idx) => (
                  <th key={idx} className="p-3 font-semibold text-foreground border-r last:border-r-0 border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/30">
                  {r.map((c, cIdx) => (
                    <td key={cIdx} className="p-3 text-muted-foreground border-r last:border-r-0 border-border">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

// Interactive Quiz Sub-card
function RenderQuizCard({ quiz }: { quiz: QuizItem }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = selectedIdx === quiz.answer

  return (
    <div className="border border-border rounded-2xl bg-card p-5 shadow-sm space-y-4 my-4">
      <div className="flex items-start gap-2.5">
        <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Knowledge Check
          </span>
          <h4 className="font-semibold text-sm sm:text-base text-foreground mt-0.5 leading-snug">
            {quiz.question}
          </h4>
        </div>
      </div>

      <div className="space-y-2">
        {quiz.options.map((opt, idx) => {
          let btnStyle = 'border-border hover:bg-muted/50 text-foreground'

          if (selectedIdx === idx) {
            btnStyle = 'border-primary bg-primary/10 text-foreground font-medium'
          }

          if (submitted) {
            if (idx === quiz.answer) {
              btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-medium'
            } else if (selectedIdx === idx) {
              btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200 font-medium'
            } else {
              btnStyle = 'border-border/60 opacity-60 text-muted-foreground'
            }
          }

          return (
            <button
              key={idx}
              onClick={() => !submitted && setSelectedIdx(idx)}
              disabled={submitted}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm text-left transition-all ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-mono">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </div>
              {submitted && idx === quiz.answer && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              {submitted && selectedIdx === idx && idx !== quiz.answer && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            </button>
          )
        })}
      </div>

      {!submitted ? (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => selectedIdx !== null && setSubmitted(true)}
            disabled={selectedIdx === null}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Check Answer
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            {isCorrect ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Correct!
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Incorrect
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed">{quiz.explanation}</p>
        </div>
      )}
    </div>
  )
}
