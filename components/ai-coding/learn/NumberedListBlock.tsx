import React from 'react'
import { NumberedListBlock as NumberedListBlockType } from '@/lib/content/ai-coding/types'

export function NumberedListBlock({ block }: { block: NumberedListBlockType }) {
  return (
    <ol className="space-y-2.5 my-3 pl-1">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-foreground/90">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
            {idx + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  )
}
