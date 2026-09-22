import React from 'react'
import { HeadingBlock as HeadingBlockType } from '@/lib/content/debugging/types'

export function HeadingBlock({ block }: { block: HeadingBlockType }) {
  const level = block.level || 2

  if (level === 1) {
    return <h1 className="text-2xl font-bold tracking-tight text-foreground mt-8 mb-4">{block.text}</h1>
  }
  if (level === 3) {
    return <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">{block.text}</h3>
  }
  if (level === 4) {
    return <h4 className="text-base font-medium text-foreground mt-4 mb-2">{block.text}</h4>
  }
  return <h2 className="text-xl font-bold tracking-tight text-foreground mt-7 mb-3 pb-2 border-b border-border/40">{block.text}</h2>
}
