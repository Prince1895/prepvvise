import React from 'react'
import { StepsBlock as StepsBlockType } from '@/lib/content/debugging/types'

export function StepsBlock({ block }: { block: StepsBlockType }) {
  return (
    <div className="my-5 space-y-4">
      {block.items.map((item, idx) => (
        <div key={idx} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
            {item.stepNumber || idx + 1}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <h5 className="font-semibold text-foreground text-sm md:text-base">{item.title}</h5>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            {item.code && (
              <div className="mt-2 p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                <pre><code>{item.code}</code></pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
