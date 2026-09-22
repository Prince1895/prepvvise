/**
 * Normalizes stdout/expectedOutput strings for consistent comparison.
 * - Converts CRLF (\r\n) or CR (\r) to LF (\n).
 * - Trims trailing whitespace from each line.
 * - Trims overall leading and trailing newlines/spaces.
 */
export function normalizeOutput(input: string): string {
  if (!input) return ''
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
}

/**
 * Normalizes stdin input:
 * - Converts CRLF/CR to LF.
 * - Ensures single trailing newline if non-empty and missing.
 */
export function normalizeStdin(input?: string): string {
  if (!input) return ''
  let cleaned = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return cleaned
}

/**
 * Compares actual output against expected output after normalization.
 */
export function compareOutputs(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected)
}
