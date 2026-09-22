'use client'

import React, { useState } from 'react'
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
import { QuizBlock as QuizBlockType } from '@/lib/content/debugging/types'

export function QuizBlock({ block }: { block: QuizBlockType }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = selectedIdx === block.answerIndex

  const handleSelect = (idx: number) => {
    if (submitted) return
    setSelectedIdx(idx)
  }

  const handleSubmit = () => {
    if (selectedIdx === null) return
    setSubmitted(true)
  }

  const handleReset = () => {
    setSelectedIdx(null)
    setSubmitted(false)
  }

  return (
    <div className="my-6 border border-border rounded-xl bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-2.5">
        <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Mini Quiz</span>
          <h4 className="font-semibold text-sm md:text-base text-foreground mt-0.5 leading-snug">
            {block.question}
          </h4>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {block.options.map((option, idx) => {
          let btnStyle = 'border-border hover:bg-muted/50 text-foreground'

          if (selectedIdx === idx) {
            btnStyle = 'border-primary bg-primary/10 text-foreground font-medium'
          }

          if (submitted) {
            if (idx === block.answerIndex) {
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
              onClick={() => handleSelect(idx)}
              disabled={submitted}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs md:text-sm text-left transition-all ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-mono">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>
              {submitted && idx === block.answerIndex && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
              )}
              {submitted && selectedIdx === idx && idx !== block.answerIndex && (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />
              )}
            </button>
          )
        })}
      </div>

      {!submitted ? (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={selectedIdx === null}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Check Answer
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div
            className={`p-3.5 rounded-lg border text-xs md:text-sm space-y-1 ${
              isCorrect
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50/50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Incorrect</span>
                </>
              )}
            </div>
            <p className="leading-relaxed text-foreground/90">{block.explanation}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
