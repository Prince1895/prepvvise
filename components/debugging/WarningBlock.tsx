import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { WarningBlock as WarningBlockType } from '@/lib/content/debugging/types'

export function WarningBlock({ block }: { block: WarningBlockType }) {
  return (
    <div className="my-4 flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 text-xs md:text-sm">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div className="space-y-1">
        {block.title && <h5 className="font-semibold text-amber-900 dark:text-amber-300">{block.title}</h5>}
        <p className="leading-relaxed text-amber-900/90 dark:text-amber-200/90">{block.text}</p>
      </div>
    </div>
  )
}
