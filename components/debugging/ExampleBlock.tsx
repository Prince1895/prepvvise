'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Code2, Copy, Check } from 'lucide-react'
import { ExampleBlock as ExampleBlockType } from '@/lib/content/debugging/types'

export function ExampleBlock({ block }: { block: ExampleBlockType }) {
  const [activeTab, setActiveTab] = useState<'buggy' | 'correct'>('buggy')
  const [copied, setCopied] = useState(false)

  // Language support if string or Record<string, string>
  const buggyMap = typeof block.buggyCode === 'object' && block.buggyCode ? block.buggyCode : null
  const correctMap = typeof block.correctCode === 'object' && block.correctCode ? block.correctCode : null

  const availableLangs = buggyMap ? Object.keys(buggyMap) : correctMap ? Object.keys(correctMap) : ['code']
  const [selectedLang, setSelectedLang] = useState<string>(availableLangs[0] || 'code')

  const buggyText = buggyMap ? buggyMap[selectedLang] || Object.values(buggyMap)[0] || '' : typeof block.buggyCode === 'string' ? block.buggyCode : ''
  const correctText = correctMap ? correctMap[selectedLang] || Object.values(correctMap)[0] || '' : typeof block.correctCode === 'string' ? block.correctCode : ''

  const currentCode = activeTab === 'buggy' ? buggyText : correctText

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-5 border border-border rounded-xl bg-card overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm md:text-base text-foreground">
              {block.title || 'Code Comparison Example'}
            </h4>
          </div>

          {availableLangs.length > 1 && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    selectedLang === lang
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {block.description && (
          <p className="text-xs md:text-sm text-muted-foreground mt-2">{block.description}</p>
        )}
      </div>

      {/* Code Tabs Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {buggyText && (
            <button
              onClick={() => setActiveTab('buggy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'buggy'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Buggy Code
            </button>
          )}

          {correctText && (
            <button
              onClick={() => setActiveTab('correct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Correct Code
            </button>
          )}
        </div>

        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Display */}
      <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
        <pre className="m-0">
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Explanation Section */}
      {(block.whyItFails || block.explanation) && (
        <div className="p-4 bg-muted/20 border-t border-border space-y-2 text-xs md:text-sm">
          {block.whyItFails && (
            <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong className="font-semibold">Why it fails: </strong>
                <span className="text-foreground">{block.whyItFails}</span>
              </div>
            </div>
          )}

          {block.explanation && (
            <div className="flex items-start gap-2 text-primary">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong className="font-semibold">Explanation: </strong>
                <span className="text-muted-foreground">{block.explanation}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
