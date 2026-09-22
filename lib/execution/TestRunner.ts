import {
  SubmissionResult,
  SubmissionVerdict,
  TestCase,
  TestResult,
} from '@/lib/execution/types/execution.types'
import { executionManager } from '@/lib/execution/ExecutionManager'
import { compareOutputs, normalizeOutput } from '@/lib/execution/utils/normalizeOutput'

export interface RunTestOptions {
  language: string
  sourceCode: string
  testCases: TestCase[]
  functionName?: string
  functionSignature?: string
  stopOnFirstFailure?: boolean
  onStatusUpdate?: (message: string) => void
}

export class TestRunner {
  /**
   * Executes code against multiple test cases and calculates the aggregate verdict.
   */
  public async runTests(options: RunTestOptions): Promise<SubmissionResult> {
    const { language, sourceCode, testCases, functionName, functionSignature, stopOnFirstFailure = false, onStatusUpdate } = options
    const testResults: TestResult[] = []
    let totalTimeMs = 0
    let passedCount = 0

    let criticalStatus: SubmissionVerdict | null = null

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i]
      if (onStatusUpdate) {
        onStatusUpdate(`Running test ${i + 1} of ${testCases.length}...`)
      }

      const execResult = await executionManager.execute(
        {
          language,
          sourceCode,
          stdin: tc.input,
          functionName,
          functionSignature,
        },
        onStatusUpdate
      )

      const timeTaken = execResult.executionTimeMs || 0
      totalTimeMs += timeTaken

      if (execResult.status === 'compile_error') {
        criticalStatus = 'compile_error'
      } else if (execResult.status === 'runtime_error') {
        criticalStatus = criticalStatus || 'runtime_error'
      } else if (execResult.status === 'timeout') {
        criticalStatus = criticalStatus || 'timeout'
      } else if (execResult.status === 'output_limit') {
        criticalStatus = criticalStatus || 'output_limit'
      } else if (execResult.status === 'unsupported') {
        criticalStatus = criticalStatus || 'unsupported'
      } else if (execResult.status === 'execution_error') {
        criticalStatus = criticalStatus || 'execution_error'
      }

      const actualOut = normalizeOutput(execResult.stdout)
      const expectedOut = normalizeOutput(tc.expectedOutput)
      const passed = execResult.status === 'success' && compareOutputs(actualOut, expectedOut)

      if (passed) {
        passedCount++
      }

      testResults.push({
        testCaseId: tc.id || `tc_${i + 1}`,
        name: tc.name || `Case ${i + 1}`,
        passed,
        actualOutput: actualOut,
        expectedOutput: expectedOut,
        status: execResult.status,
        stderr: execResult.stderr || undefined,
        executionTimeMs: timeTaken,
        hidden: tc.hidden ?? false,
      })

      if (!passed && stopOnFirstFailure) {
        break
      }
    }

    let verdict: SubmissionVerdict = 'accepted'
    if (criticalStatus) {
      verdict = criticalStatus
    } else if (passedCount < testCases.length) {
      verdict = 'wrong_answer'
    }

    return {
      verdict,
      passed: passedCount,
      total: testCases.length,
      testResults,
      totalExecutionTimeMs: totalTimeMs,
    }
  }
}

export const testRunner = new TestRunner()
