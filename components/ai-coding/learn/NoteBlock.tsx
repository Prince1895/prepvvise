import React from 'react'
import { Info } from 'lucide-react'
import { NoteBlock as NoteBlockType } from '@/lib/content/ai-coding/types'

export function NoteBlock({ block }: { block: NoteBlockType }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
      <div>
        {block.title && <strong className="block font-bold text-blue-600 dark:text-blue-300 mb-1">{block.title}</strong>}
        <span>{block.text}</span>
      </div>
    </div>
  )
}
