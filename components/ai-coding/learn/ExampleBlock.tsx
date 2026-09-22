'use client'

import React from 'react'
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ExampleBlock as ExampleBlockType } from '@/lib/content/ai-coding/types'

export function ExampleBlock({ block }: { block: ExampleBlockType }) {
  return (
    <div className="my-5 rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
      {block.title && (
        <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base border-b border-border/80 pb-2.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{block.title}</span>
        </div>
      )}

      {block.description && (
        <p className="text-xs sm:text-sm text-muted-foreground">{block.description}</p>
      )}

      {/* Weak Prompt vs Strong Prompt Case */}
      {(block.weakPrompt || block.strongPrompt) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {block.weakPrompt && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-950 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Weak / Vague Approach</span>
              </div>
              <p className="font-mono leading-relaxed bg-background/60 p-2.5 rounded border border-rose-500/20 whitespace-pre-wrap">
                {block.weakPrompt}
              </p>
            </div>
          )}

          {block.strongPrompt && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Structured / High-Precision Approach</span>
              </div>
              <p className="font-mono leading-relaxed bg-background/60 p-2.5 rounded border border-emerald-500/20 whitespace-pre-wrap">
                {block.strongPrompt}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Why It Fails or Explanation */}
      {(block.whyItFails || block.explanation) && (
        <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs sm:text-sm space-y-1">
          <strong className="text-foreground font-semibold block">Key Architectural Rationale:</strong>
          <p className="text-muted-foreground leading-relaxed">
            {block.whyItFails || block.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
