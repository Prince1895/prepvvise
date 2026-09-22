import React from 'react'
import { HeadingBlock as HeadingBlockType } from '@/lib/content/ai-coding/types'

export function HeadingBlock({ block }: { block: HeadingBlockType }) {
  const level = block.level || 2

  switch (level) {
    case 1:
      return (
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-6 mb-3">
          {block.text}
        </h1>
      )
    case 3:
      return (
        <h3 className="text-lg sm:text-xl font-bold text-foreground mt-5 mb-2">
          {block.text}
        </h3>
      )
    case 4:
      return (
        <h4 className="text-base font-semibold text-foreground mt-4 mb-2">
          {block.text}
        </h4>
      )
    case 2:
    default:
      return (
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-6 mb-3 border-b border-border pb-2">
          {block.text}
        </h2>
      )
  }
}
