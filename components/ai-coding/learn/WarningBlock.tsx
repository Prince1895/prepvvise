import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { WarningBlock as WarningBlockType } from '@/lib/content/ai-coding/types'

export function WarningBlock({ block }: { block: WarningBlockType }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        {block.title && <strong className="block font-bold text-amber-600 dark:text-amber-400 mb-1">{block.title}</strong>}
        <span className="whitespace-pre-wrap">{block.text}</span>
      </div>
    </div>
  )
}
