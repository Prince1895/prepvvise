import React from 'react'
import { SubheadingBlock as SubheadingBlockType } from '@/lib/content/ai-coding/types'

export function SubheadingBlock({ block }: { block: SubheadingBlockType }) {
  return (
    <h3 className="text-base sm:text-lg font-bold text-foreground mt-4 mb-2">
      {block.text}
    </h3>
  )
}
