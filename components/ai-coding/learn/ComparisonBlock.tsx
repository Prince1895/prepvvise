import React from 'react'
import { ComparisonBlock as ComparisonBlockType } from '@/lib/content/ai-coding/types'

export function ComparisonBlock({ block }: { block: ComparisonBlockType }) {
  return (
    <div className="my-5 space-y-3">
      {block.title && <h4 className="text-sm font-bold text-foreground">{block.title}</h4>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="bg-primary/10 text-primary font-bold border-b border-border">
            <tr>
              {block.columns.map((col, idx) => (
                <th key={idx} className="p-3 font-bold uppercase tracking-wider text-[11px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {block.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className={`p-3 text-muted-foreground leading-relaxed ${cellIdx === 0 ? 'font-bold text-foreground' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
