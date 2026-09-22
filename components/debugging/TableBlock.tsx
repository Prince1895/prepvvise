import React from 'react'
import { TableBlock as TableBlockType } from '@/lib/content/debugging/types'

export function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full text-left text-xs md:text-sm border-collapse">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            {block.headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3 font-semibold text-foreground border-r last:border-r-0 border-border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {block.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 text-muted-foreground border-r last:border-r-0 border-border leading-relaxed">
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
