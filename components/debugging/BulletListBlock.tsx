import React from 'react'
import { BulletListBlock as BulletListBlockType } from '@/lib/content/debugging/types'

export function BulletListBlock({ block }: { block: BulletListBlockType }) {
  return (
    <ul className="my-3 space-y-2 pl-2">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm md:text-base text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
