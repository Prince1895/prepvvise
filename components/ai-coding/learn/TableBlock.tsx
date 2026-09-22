import React from 'react'
import { TableBlock as TableBlockType } from '@/lib/content/ai-coding/types'

export function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead className="bg-muted/80 text-foreground font-bold border-b border-border">
          <tr>
            {block.headers.map((header, idx) => (
              <th key={idx} className="p-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {block.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="p-3 text-muted-foreground leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
