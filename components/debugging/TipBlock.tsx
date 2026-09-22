import React from 'react'
import { Lightbulb } from 'lucide-react'
import { TipBlock as TipBlockType } from '@/lib/content/debugging/types'

export function TipBlock({ block }: { block: TipBlockType }) {
  return (
    <div className="my-4 flex items-start gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 text-xs md:text-sm">
      <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
      <div className="space-y-1">
        {block.title && <h5 className="font-semibold text-emerald-900 dark:text-emerald-300">{block.title}</h5>}
        <p className="leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">{block.text}</p>
      </div>
    </div>
  )
}
