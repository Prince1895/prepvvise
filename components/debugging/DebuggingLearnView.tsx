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
  List
} from 'lucide-react'
import {
  getDebuggingLearnContent,
  getAllLessons,
  getAdjacentLessons
} from '@/lib/content/debugging'
import { ContentBlock } from './ContentBlock'
import { ExampleBlock } from './ExampleBlock'
import { QuizBlock } from './QuizBlock'

export function DebuggingLearnView() {
  const moduleData = useMemo(() => getDebuggingLearnContent(), [])
  const allLessons = useMemo(() => getAllLessons(), [])

  // Currently active lesson (defaults to first lesson)
  const [activeSlug, setActiveSlug] = useState<string>(
    allLessons[0]?.slug || 'what-is-debugging'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set())

  // Active lesson data
  const currentLesson = useMemo(() => {
    return allLessons.find((l) => l.slug === activeSlug) || allLessons[0]
  }, [allLessons, activeSlug])

  // Navigation data
  const { prevLesson, nextLesson, currentIndex, totalLessons, currentSection } = useMemo(() => {
    return getAdjacentLessons(activeSlug)
  }, [activeSlug])

  // Filter lessons for search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return moduleData.sections

    const query = searchQuery.toLowerCase()
    return moduleData.sections
      .map((sec) => {
        const matchingLessons = sec.lessons.filter(
          (les) =>
            les.title.toLowerCase().includes(query) ||
            les.description.toLowerCase().includes(query) ||
            les.slug.toLowerCase().includes(query)
        )
        return {
          ...sec,
          lessons: matchingLessons,
        }
      })
      .filter((sec) => sec.lessons.length > 0)
  }, [moduleData, searchQuery])

  const handleSelectLesson = (slug: string) => {
    setActiveSlug(slug)
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Module Header Bar */}
      <div className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
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
                LEARN
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

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="hidden sm:flex items-center gap-2">
            <span>Progress:</span>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-semibold text-foreground">{progressPercent}%</span>
          </div>

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
              {completedSlugs.has(activeSlug) ? 'Completed' : 'Mark as Done'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-80 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0 flex flex-col shrink-0 ${
            mobileMenuOpen ? 'translate-x-0 h-full' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Sidebar Top Search */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search 44 lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>{allLessons.length} Total Lessons</span>
              <span>10 Curriculum Modules</span>
            </div>
          </div>

          {/* Lessons List Accordion / Group */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {filteredSections.map((sec) => (
              <div key={sec.id} className="space-y-1">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>{sec.position}. {sec.title}</span>
                  <span className="text-[10px] font-normal font-mono">({sec.lessons.length})</span>
                </div>

                <div className="space-y-0.5">
                  {sec.lessons.map((les) => {
                    const isActive = les.slug === activeSlug
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
                          <span className="text-[10px] text-muted-foreground/80 font-mono">
                            {les.durationMinutes} min read
                          </span>
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

        {/* Overlay backdrop for mobile menu */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}

        {/* Main Content Reader Area */}
        <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 min-w-0">
          {/* Lesson Banner Header */}
          {currentLesson && (
            <div className="space-y-4 border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {currentSection && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    Module {currentSection.position}: {currentSection.title}
                  </span>
                )}
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

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {currentLesson.description}
              </p>
            </div>
          )}

          {/* Dynamic Content Blocks */}
          <div className="space-y-4">
            {currentLesson?.content.map((block, idx) => (
              <ContentBlock key={idx} block={block} />
            ))}
          </div>

          {/* Additional Examples if defined */}
          {currentLesson?.examples && currentLesson.examples.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Code Demonstration & Fix
              </h3>
              {currentLesson.examples.map((ex, idx) => (
                <ExampleBlock
                  key={idx}
                  block={{
                    type: 'example',
                    title: ex.title,
                    description: ex.description,
                    language: ex.language,
                    buggyCode: ex.buggyCode,
                    correctCode: ex.correctCode,
                    whyItFails: ex.whyItFails,
                    explanation: ex.stepByStepExplanation,
                  }}
                />
              ))}
            </div>
          )}

          {/* Key Takeaways Card */}
          {currentLesson?.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
            <div className="my-6 p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
                <Award className="w-5 h-5" />
                Key Takeaways
              </div>
              <ul className="space-y-2">
                {currentLesson.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Mini Quiz */}
          {currentLesson?.quiz && (
            <div className="pt-4 border-t border-border">
              <QuizBlock block={{ type: 'quiz', ...currentLesson.quiz }} />
            </div>
          )}

          {/* Footer Navigation Buttons */}
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
                🎉 Congratulations! You completed all lessons in the Debugging Learn curriculum!
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
