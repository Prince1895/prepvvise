'use client'

import React, { useState } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { ChecklistBlock as ChecklistBlockType } from '@/lib/content/ai-coding/types'

export function ChecklistBlock({ block }: { block: ChecklistBlockType }) {
  const [items, setItems] = useState(block.items)

  const toggleItem = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    )
  }

  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3">
      {block.title && <h4 className="text-sm font-bold text-foreground">{block.title}</h4>}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => toggleItem(idx)}
            className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${
              item.checked
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                : 'border-border bg-muted/30 text-foreground hover:bg-muted/60'
            }`}
          >
            {item.checked ? (
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <span className={`leading-relaxed ${item.checked ? 'line-through opacity-80' : ''}`}>
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
