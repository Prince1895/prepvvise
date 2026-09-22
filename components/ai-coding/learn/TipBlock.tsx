import React from 'react'
import { Sparkles } from 'lucide-react'
import { TipBlock as TipBlockType } from '@/lib/content/ai-coding/types'

export function TipBlock({ block }: { block: TipBlockType }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
      <div>
        {block.title && <strong className="block font-bold text-emerald-600 dark:text-emerald-400 mb-1">{block.title}</strong>}
        <span>{block.text}</span>
      </div>
    </div>
  )
}
