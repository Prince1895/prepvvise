import React from 'react'
import { ContentBlock as ContentBlockType } from '@/lib/content/debugging/types'
import { HeadingBlock } from './HeadingBlock'
import { ParagraphBlock } from './ParagraphBlock'
import { BulletListBlock } from './BulletListBlock'
import { NumberedListBlock } from './NumberedListBlock'
import { CodeBlock } from './CodeBlock'
import { ExampleBlock } from './ExampleBlock'
import { NoteBlock } from './NoteBlock'
import { WarningBlock } from './WarningBlock'
import { TipBlock } from './TipBlock'
import { TableBlock } from './TableBlock'
import { StepsBlock } from './StepsBlock'
import { QuizBlock } from './QuizBlock'

export function ContentBlock({ block }: { block: ContentBlockType }) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlock block={block} />
    case 'paragraph':
      return <ParagraphBlock block={block} />
    case 'bulletList':
      return <BulletListBlock block={block} />
    case 'numberedList':
      return <NumberedListBlock block={block} />
    case 'code':
      return <CodeBlock block={block} />
    case 'example':
      return <ExampleBlock block={block} />
    case 'note':
      return <NoteBlock block={block} />
    case 'warning':
      return <WarningBlock block={block} />
    case 'tip':
      return <TipBlock block={block} />
    case 'table':
      return <TableBlock block={block} />
    case 'steps':
      return <StepsBlock block={block} />
    case 'quiz':
      return <QuizBlock block={block} />
    default:
      return null
  }
}
