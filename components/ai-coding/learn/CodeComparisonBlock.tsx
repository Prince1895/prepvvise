'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { CodeComparisonBlock as CodeComparisonBlockType } from '@/lib/content/ai-coding/types'

export function CodeComparisonBlock({ block }: { block: CodeComparisonBlockType }) {
  const [copiedLeft, setCopiedLeft] = useState(false)
  const [copiedRight, setCopiedRight] = useState(false)

  const copyCode = (text: string, isLeft: boolean) => {
    navigator.clipboard.writeText(text)
    if (isLeft) {
      setCopiedLeft(true)
      setTimeout(() => setCopiedLeft(false), 2000)
    } else {
      setCopiedRight(true)
      setTimeout(() => setCopiedRight(false), 2000)
    }
  }

  return (
    <div className="my-5 space-y-3">
      {block.title && (
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {block.title}
        </h4>
      )}

      {block.description && (
        <p className="text-xs text-muted-foreground">{block.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side */}
        <div className="rounded-xl border border-rose-500/30 bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
          <div className="px-3.5 py-2 bg-rose-950/40 border-b border-rose-900/40 flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-300 flex items-center gap-1.5">
              <span className="text-rose-400">✕</span> {block.leftTitle}
            </span>
            <button
              onClick={() => copyCode(block.leftCode, true)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 text-[11px] flex items-center gap-1"
            >
              {copiedLeft ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed flex-1">
            <pre className="whitespace-pre text-slate-200">{block.leftCode}</pre>
          </div>
        </div>

        {/* Right Side */}
        <div className="rounded-xl border border-emerald-500/30 bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
          <div className="px-3.5 py-2 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> {block.rightTitle}
            </span>
            <button
              onClick={() => copyCode(block.rightCode, false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 text-[11px] flex items-center gap-1"
            >
              {copiedRight ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed flex-1">
            <pre className="whitespace-pre text-slate-200">{block.rightCode}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
