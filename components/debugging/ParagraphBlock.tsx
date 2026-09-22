import React from 'react'
import { ParagraphBlock as ParagraphBlockType } from '@/lib/content/debugging/types'

export function ParagraphBlock({ block }: { block: ParagraphBlockType }) {
  return (
    <p className="text-sm md:text-base leading-relaxed text-muted-foreground my-3">
      {block.text}
    </p>
  )
}
