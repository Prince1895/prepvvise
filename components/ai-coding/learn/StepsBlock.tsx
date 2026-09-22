import React from 'react'
import { StepsBlock as StepsBlockType } from '@/lib/content/ai-coding/types'

export function StepsBlock({ block }: { block: StepsBlockType }) {
  return (
    <div className="my-5 space-y-3">
      {block.items.map((step, idx) => (
        <div key={idx} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3.5 text-xs sm:text-sm">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs shrink-0 mt-0.5">
            {step.stepNumber || idx + 1}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-bold text-foreground">{step.title}</h4>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            {step.code && (
              <pre className="p-2.5 rounded bg-muted font-mono text-xs overflow-x-auto mt-2 text-foreground">
                {step.code}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
