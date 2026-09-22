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
  Filter,
  Flame,
  Check
} from 'lucide-react'
import {
  getAiCodingLearnContent,
  getAllAiCodingLessons,
  getAdjacentAiCodingLessons
} from '@/lib/content/ai-coding'
import { ContentBlock } from './learn/ContentBlock'
import { ExampleBlock } from './learn/ExampleBlock'
import { ExerciseBlock } from './learn/ExerciseBlock'
import { QuizBlock } from './learn/QuizBlock'
import { KeyTakeawaysBlock } from './learn/KeyTakeawaysBlock'
import { LessonLevel } from '@/lib/content/ai-coding/types'

export function AiCodingLearnView() {
  const moduleData = useMemo(() => getAiCodingLearnContent(), [])
  const allLessons = useMemo(() => getAllAiCodingLessons(), [])

  // State
  const [activeSlug, setActiveSlug] = useState<string>(
    allLessons[0]?.slug || 'what-is-ai-assisted-coding'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('All')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set())

  // Active lesson
  const currentLesson = useMemo(() => {
    return allLessons.find((l) => l.slug === activeSlug) || allLessons[0]
  }, [allLessons, activeSlug])

  // Adjacent lesson navigation
  const { prevLesson, nextLesson, currentIndex, totalLessons, currentSection } = useMemo(() => {
    return getAdjacentAiCodingLessons(activeSlug)
  }, [activeSlug])

  // Filter sections and lessons by search & difficulty level
  const filteredSections = useMemo(() => {
    return moduleData.sections
      .map((sec) => {
        const matchingLessons = sec.lessons.filter((les) => {
          const matchesQuery =
            !searchQuery.trim() ||
            les.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            les.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            les.slug.toLowerCase().includes(searchQuery.toLowerCase())

          const matchesLevel =
            levelFilter === 'All' ||
            les.level?.toLowerCase() === levelFilter.toLowerCase()

          return matchesQuery && matchesLevel
        })

        return {
          ...sec,
          lessons: matchingLessons,
        }
      })
      .filter((sec) => sec.lessons.length > 0)
  }, [moduleData, searchQuery, levelFilter])

  const handleSelectLesson = (slug: string) => {
    setActiveSlug(slug)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleCompleted = (slug: string) => {
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

  const completedCount = completedSlugs.size
  const progressPercent = Math.round(
    (completedCount / Math.max(1, totalLessons)) * 100
  )

  const getLevelBadgeColor = (level?: LessonLevel) => {
    switch (level) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case 'intermediate':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'advanced':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      case 'expert':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      default:
        return 'bg-primary/10 text-primary border-primary/20'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Module Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                AI CODING CURRICULUM
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {moduleData.title}
              </span>
            </div>
            <h1 className="text-sm font-bold text-foreground sm:text-base leading-tight mt-0.5">
              {currentLesson?.title}
            </h1>
          </div>
        </div>

        {/* Progress & Actions */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
            <span>Progress ({completedCount}/{totalLessons}):</span>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-foreground">{progressPercent}%</span>
          </div>

          <button
            onClick={() => toggleCompleted(activeSlug)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              completedSlugs.has(activeSlug)
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-background hover:bg-muted text-foreground'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">
              {completedSlugs.has(activeSlug) ? 'Completed' : 'Mark as Done'}
            </span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-80 sm:w-84 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0 flex flex-col shrink-0 ${
            mobileMenuOpen ? 'translate-x-0 h-full' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Sidebar Search & Filter Controls */}
          <div className="p-3.5 border-b border-border space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${allLessons.length} lessons...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Level Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                    levelFilter === lvl
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>{allLessons.length} Total Lessons</span>
              <span>{moduleData.sections.length} Sections</span>
            </div>
          </div>

          {/* Section Accordion List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {filteredSections.map((sec) => (
              <div key={sec.id} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span className="truncate">{sec.title}</span>
                  <span className="text-[10px] font-mono shrink-0 ml-1">({sec.lessons.length})</span>
                </div>

                <div className="space-y-0.5">
                  {sec.lessons.map((les) => {
                    const isActive = les.slug === activeSlug
                    const isDone = completedSlugs.has(les.slug)

                    return (
                      <button
                        key={les.id}
                        onClick={() => handleSelectLesson(les.slug)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary font-bold border border-primary/30 shadow-xs'
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
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono">
                            <span className={`px-1.5 py-0.2 rounded border uppercase text-[9px] ${getLevelBadgeColor(les.level)}`}>
                              {les.level}
                            </span>
                            <span className="text-muted-foreground/80">{les.durationMinutes}m read</span>
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
                No lessons match &quot;{searchQuery}&quot; with level &quot;{levelFilter}&quot;
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

        {/* Main Content Reader */}
        <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 min-w-0">
          {/* Lesson Header Banner */}
          {currentLesson && (
            <div className="space-y-4 border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {currentSection && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                    {currentSection.title}
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold uppercase ${getLevelBadgeColor(currentLesson.level)}`}>
                  {currentLesson.level}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {currentLesson.durationMinutes} min read
                </span>
                <span className="text-muted-foreground font-mono">
                  Lesson {currentIndex + 1} of {totalLessons}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {currentLesson.title}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {currentLesson.description}
              </p>

              {/* Objectives Pill Badges */}
              {currentLesson.objectives && currentLesson.objectives.length > 0 && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                    Learning Objectives
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
                    {currentLesson.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Content Blocks */}
          <div className="space-y-4">
            {currentLesson?.content.map((block, idx) => (
              <ContentBlock key={idx} block={block} />
            ))}
          </div>

          {/* Additional Code Demonstration / Examples */}
          {currentLesson?.examples && currentLesson.examples.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Code Demonstration & Comparison
              </h3>
              {currentLesson.examples.map((ex, idx) => (
                <ExampleBlock
                  key={idx}
                  block={{
                    type: 'example',
                    title: ex.title,
                    description: ex.description,
                    language: ex.language,
                    weakPrompt: ex.weakPrompt,
                    strongPrompt: ex.strongPrompt,
                    buggyCode: ex.buggyCode,
                    correctCode: ex.correctCode,
                    whyItFails: ex.whyItFails,
                    explanation: ex.explanation,
                  }}
                />
              ))}
            </div>
          )}

          {/* Interactive Mini Exercise Block */}
          {currentLesson?.exercise && (
            <div className="pt-6 border-t border-border">
              <ExerciseBlock block={currentLesson.exercise} />
            </div>
          )}

          {/* Key Takeaways Card */}
          {currentLesson?.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
            <div className="pt-2">
              <KeyTakeawaysBlock block={{ type: 'keyTakeaways', items: currentLesson.keyTakeaways }} />
            </div>
          )}

          {/* Knowledge Check Quiz */}
          {currentLesson?.quiz && (
            <div className="pt-6 border-t border-border">
              <QuizBlock block={{ type: 'quiz', ...currentLesson.quiz }} />
            </div>
          )}

          {/* Footer Prev/Next Navigation Buttons */}
          <footer className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevLesson ? (
              <button
                onClick={() => handleSelectLesson(prevLesson.slug)}
                className="w-full sm:w-auto flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:bg-muted text-left transition-all group"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1 transition-transform" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Previous Lesson
                  </span>
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {prevLesson.title}
                  </span>
                </div>
              </button>
            ) : <div />}

            {nextLesson ? (
              <button
                onClick={() => handleSelectLesson(nextLesson.slug)}
                className="w-full sm:w-auto flex items-center justify-end gap-3 p-3.5 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-right transition-all group ml-auto"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary block">
                    Next Lesson
                  </span>
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {nextLesson.title}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="p-4 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                🎉 Congratulations! You completed all lessons in the AI-Assisted Coding curriculum!
              </div>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}
