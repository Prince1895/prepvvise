import { AILiteracyContentModel } from './types'

export function validateAILiteracyContent(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Root content data must be a valid JSON object.'] }
  }

  const model = data as Partial<AILiteracyContentModel>

  // Module check
  if (!model.module) {
    errors.push('Missing "module" metadata object.')
  } else {
    if (!model.module.id) errors.push('Module metadata missing "id".')
    if (!model.module.name) errors.push('Module metadata missing "name".')
    if (!model.module.description) errors.push('Module metadata missing "description".')
  }

  // Sections check
  if (!Array.isArray(model.sections) || model.sections.length === 0) {
    errors.push('Module must contain a non-empty "sections" array.')
    return { valid: false, errors }
  }

  const sectionIds = new Set<string>()
  const lessonIds = new Set<string>()
  const lessonSlugs = new Set<string>()

  const validLevels = ['beginner', 'intermediate', 'advanced', 'expert']

  model.sections.forEach((section, sIdx) => {
    if (!section.id) errors.push(`Section at index ${sIdx} missing "id".`)
    else if (sectionIds.has(section.id)) errors.push(`Duplicate section ID: "${section.id}".`)
    else sectionIds.add(section.id)

    if (!section.title) errors.push(`Section "${section.id || sIdx}" missing "title".`)
    if (typeof section.position !== 'number') errors.push(`Section "${section.id || sIdx}" missing valid "position" number.`)

    if (!Array.isArray(section.lessons) || section.lessons.length === 0) {
      errors.push(`Section "${section.id || sIdx}" has no lessons.`)
      return
    }

    section.lessons.forEach((lesson, lIdx) => {
      const lessonRef = lesson.id || `section[${sIdx}].lesson[${lIdx}]`

      if (!lesson.id) errors.push(`Lesson at index ${lIdx} in section "${section.id}" missing "id".`)
      else if (lessonIds.has(lesson.id)) errors.push(`Duplicate lesson ID: "${lesson.id}".`)
      else lessonIds.add(lesson.id)

      if (!lesson.slug) errors.push(`Lesson "${lessonRef}" missing "slug".`)
      else if (lessonSlugs.has(lesson.slug)) errors.push(`Duplicate lesson slug: "${lesson.slug}".`)
      else lessonSlugs.add(lesson.slug)

      if (!lesson.title) errors.push(`Lesson "${lessonRef}" missing "title".`)
      if (!validLevels.includes(lesson.level)) errors.push(`Lesson "${lessonRef}" has invalid level "${lesson.level}".`)
      if (typeof lesson.durationMinutes !== 'number' || lesson.durationMinutes <= 0) {
        errors.push(`Lesson "${lessonRef}" missing valid "durationMinutes".`)
      }

      if (!Array.isArray(lesson.objectives) || lesson.objectives.length === 0) {
        errors.push(`Lesson "${lessonRef}" missing "objectives" array.`)
      }

      if (!Array.isArray(lesson.content)) {
        errors.push(`Lesson "${lessonRef}" missing "content" block array.`)
      } else {
        lesson.content.forEach((block, bIdx) => {
          if (!block || typeof block !== 'object' || !block.type) {
            errors.push(`Lesson "${lessonRef}" content block ${bIdx} missing valid "type".`)
          }
        })
      }

      // Quiz check
      if (Array.isArray(lesson.quiz)) {
        lesson.quiz.forEach((q, qIdx) => {
          if (!q.question) errors.push(`Lesson "${lessonRef}" quiz ${qIdx} missing question.`)
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Lesson "${lessonRef}" quiz ${qIdx} must have at least 2 options.`)
          }
          if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length || 0)) {
            errors.push(`Lesson "${lessonRef}" quiz ${qIdx} has invalid answer index ${q.answer}.`)
          }
        })
      }
    })
  })

  // Glossary check
  if (Array.isArray(model.glossary)) {
    model.glossary.forEach((g, idx) => {
      if (!g.term || !g.definition) errors.push(`Glossary entry at ${idx} missing required term or definition.`)
    })
  }

  // Cheat sheets check
  if (Array.isArray(model.cheatSheets)) {
    model.cheatSheets.forEach((cs, idx) => {
      if (!cs.id || !cs.title || !Array.isArray(cs.points)) {
        errors.push(`Cheat sheet at ${idx} missing required id, title, or points.`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
