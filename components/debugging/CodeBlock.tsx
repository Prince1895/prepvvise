'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { CodeBlock as CodeBlockType } from '@/lib/content/debugging/types'

export function CodeBlock({ block }: { block: CodeBlockType }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 rounded-xl border border-border bg-slate-950 text-slate-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700 inline-block" />
          {block.filename || block.language.toUpperCase()}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
        <pre className="m-0">
          <code>{block.code}</code>
        </pre>
      </div>
      {block.caption && (
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 text-xs text-slate-400 italic">
          {block.caption}
        </div>
      )}
    </div>
  )
}
