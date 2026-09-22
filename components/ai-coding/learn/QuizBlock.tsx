'use client'

import React, { useState } from 'react'
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react'
import { QuizBlock as QuizBlockType } from '@/lib/content/ai-coding/types'

export function QuizBlock({ block }: { block: QuizBlockType }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = selectedIdx === block.answerIndex

  return (
    <div className="my-6 p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
        <HelpCircle className="w-4 h-4" />
        <span>Knowledge Check Quiz</span>
      </div>

      <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
        {block.question}
      </h3>

      <div className="space-y-2">
        {block.options.map((option, idx) => {
          let style = 'border-border bg-background hover:bg-muted/60 text-foreground'

          if (submitted) {
            if (idx === block.answerIndex) {
              style = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
            } else if (selectedIdx === idx) {
              style = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
            }
          } else if (selectedIdx === idx) {
            style = 'border-primary bg-primary/10 text-primary font-semibold'
          }

          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedIdx(idx)
                setSubmitted(true)
              }}
              className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${style}`}
            >
              <span className="font-bold shrink-0">{String.fromCharCode(65 + idx)}.</span>
              <span className="leading-relaxed flex-1">{option}</span>
            </button>
          )
        })}
      </div>

      {submitted && selectedIdx !== null && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm space-y-1.5 ${
            isCorrect
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Correct Answer!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Incorrect</span>
              </>
            )}
          </div>
          <p className="leading-relaxed opacity-90">{block.explanation}</p>
        </div>
      )}
    </div>
  )
}
