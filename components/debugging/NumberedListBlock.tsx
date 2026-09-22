import React from 'react'
import { NumberedListBlock as NumberedListBlockType } from '@/lib/content/debugging/types'

export function NumberedListBlock({ block }: { block: NumberedListBlockType }) {
  return (
    <ol className="my-3 space-y-2.5">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-muted-foreground">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
            {idx + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  )
}
