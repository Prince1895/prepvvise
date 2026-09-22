import React from 'react'
import { BulletListBlock as BulletListBlockType } from '@/lib/content/ai-coding/types'

export function BulletListBlock({ block }: { block: BulletListBlockType }) {
  return (
    <ul className="space-y-2 my-3 pl-1">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}
