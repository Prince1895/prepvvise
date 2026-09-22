import React from 'react'
import { Info } from 'lucide-react'
import { NoteBlock as NoteBlockType } from '@/lib/content/debugging/types'

export function NoteBlock({ block }: { block: NoteBlockType }) {
  return (
    <div className="my-4 flex items-start gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200 text-xs md:text-sm">
      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
      <div className="space-y-1">
        {block.title && <h5 className="font-semibold text-blue-900 dark:text-blue-300">{block.title}</h5>}
        <p className="leading-relaxed text-blue-900/90 dark:text-blue-200/90">{block.text}</p>
      </div>
    </div>
  )
}
