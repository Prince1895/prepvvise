import React from 'react'
import { ArrowRight } from 'lucide-react'
import { WorkflowBlock as WorkflowBlockType } from '@/lib/content/ai-coding/types'

export function WorkflowBlock({ block }: { block: WorkflowBlockType }) {
  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
      {block.title && <h4 className="text-sm sm:text-base font-bold text-foreground">{block.title}</h4>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {block.steps.map((step, idx) => (
          <div key={idx} className="relative p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {step.badge || `STEP ${step.number || idx + 1}`}
                </span>
                {idx < block.steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10" />
                )}
              </div>
              <h5 className="font-bold text-foreground text-xs sm:text-sm">{step.title}</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
