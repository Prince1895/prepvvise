'use client'

import React, { useState } from 'react'
import { Check, Copy, Code2 } from 'lucide-react'
import { CodeBlock as CodeBlockType } from '@/lib/content/ai-coding/types'

export function CodeBlock({ block }: { block: CodeBlockType }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const titleOrFilename = block.title || block.filename || `${block.language.toUpperCase()} Snippet`

  return (
    <div className="my-4 rounded-xl border border-border bg-slate-950 text-slate-100 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-slate-300 font-medium">{titleOrFilename}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-400">
            {block.language}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-medium"
          aria-label="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed">
        <pre className="whitespace-pre text-slate-200">{block.code}</pre>
      </div>

      {block.caption && (
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
          {block.caption}
        </div>
      )}
    </div>
  )
}
