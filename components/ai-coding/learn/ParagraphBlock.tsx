import React from 'react'
import { ParagraphBlock as ParagraphBlockType } from '@/lib/content/ai-coding/types'

export function ParagraphBlock({ block }: { block: ParagraphBlockType }) {
  return (
    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed my-2">
      {block.text}
    </p>
  )
}
