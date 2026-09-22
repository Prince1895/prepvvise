'use client'

import React, { useState } from 'react'
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import { ExerciseBlock as ExerciseBlockType } from '@/lib/content/ai-coding/types'

export function ExerciseBlock({ block }: { block: ExerciseBlockType }) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [submitted, setSubmitting] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const choices = block.choices || []
  const isCorrect =
    typeof block.correctAnswer === 'number'
      ? selectedChoice === block.correctAnswer
      : selectedChoice !== null && choices[selectedChoice] === block.correctAnswer

  return (
    <div className="my-6 p-5 rounded-2xl border border-primary/30 bg-card space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Interactive Exercise
          </span>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">
          {block.exerciseType || 'Reasoning'}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-foreground">{block.title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {block.description}
        </p>
      </div>

      {block.scenario && (
        <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs leading-relaxed">
          <strong className="text-foreground block mb-1">Scenario Context:</strong>
          <span className="text-muted-foreground">{block.scenario}</span>
        </div>
      )}

      {block.promptOrCode && (
        <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto">
          <pre>{block.promptOrCode}</pre>
        </div>
      )}

      {choices.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-foreground block">Select the best option:</span>
          {choices.map((choice, idx) => {
            let style = 'border-border bg-background hover:bg-muted/60 text-foreground'
            if (submitted) {
              const choiceIsCorrect =
                typeof block.correctAnswer === 'number'
                  ? idx === block.correctAnswer
                  : choice === block.correctAnswer

              if (choiceIsCorrect) {
                style = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
              } else if (selectedChoice === idx) {
                style = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }
            } else if (selectedChoice === idx) {
              style = 'border-primary bg-primary/10 text-primary font-semibold'
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedChoice(idx)
                  setSubmitting(true)
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${style}`}
              >
                <span className="font-bold shrink-0">{String.fromCharCode(65 + idx)}.</span>
                <span className="leading-relaxed flex-1">{choice}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Feedback Alert */}
      {submitted && selectedChoice !== null && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2 ${
            isCorrect
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Correct! Spot on logic.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>Not quite right. Review rationale below.</span>
              </>
            )}
          </div>
          <p className="leading-relaxed opacity-90">{block.explanation}</p>
        </div>
      )}

      {/* Hint Accordion */}
      {block.hints && block.hints.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
          </button>
          {showHint && (
            <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              {block.hints.map((hint, idx) => (
                <p key={idx}>• {hint}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
