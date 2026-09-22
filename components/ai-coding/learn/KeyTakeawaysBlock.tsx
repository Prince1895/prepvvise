import React from 'react'
import { Award, CheckCircle2 } from 'lucide-react'
import { KeyTakeawaysBlock as KeyTakeawaysBlockType } from '@/lib/content/ai-coding/types'

export function KeyTakeawaysBlock({ block }: { block: KeyTakeawaysBlockType }) {
  return (
    <div className="my-6 p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
        <Award className="w-5 h-5 text-primary" />
        <span>Key Takeaways</span>
      </div>
      <ul className="space-y-2">
        {block.items.map((takeaway, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{takeaway}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
