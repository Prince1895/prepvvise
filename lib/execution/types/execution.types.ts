export type ExecutionStatus =
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'output_limit'
  | 'unsupported'
  | 'execution_error'

export type SubmissionVerdict =
  | 'accepted'
  | 'wrong_answer'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'output_limit'
  | 'unsupported'
  | 'execution_error'

export type ExecutionState =
  | 'IDLE'
  | 'LOADING'
  | 'COMPILING'
  | 'RUNNING'
  | 'PASSED'
  | 'WRONG_ANSWER'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIMEOUT'
  | 'OUTPUT_LIMIT'
  | 'UNSUPPORTED'
  | 'EXECUTION_ERROR'

export interface CodeExecutionRequest {
  language: string
  sourceCode: string
  stdin?: string
  functionName?: string
  functionSignature?: string
  timeoutMs?: number
  outputLimitBytes?: number
}

export interface CodeExecutionResult {
  status: ExecutionStatus
  stdout: string
  stderr: string
  exitCode?: number
  executionTimeMs?: number
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  hidden?: boolean
  name?: string
}

export interface TestResult {
  testCaseId: string
  name?: string
  passed: boolean
  actualOutput?: string
  expectedOutput?: string
  status: ExecutionStatus
  stderr?: string
  executionTimeMs?: number
  hidden?: boolean
}

export interface SubmissionResult {
  verdict: SubmissionVerdict
  passed: number
  total: number
  testResults?: TestResult[]
  totalExecutionTimeMs?: number
}

export type WorkerMessageType = 'EXECUTE' | 'STOP'
export type WorkerResponseType = 'RESULT' | 'STATUS_UPDATE' | 'ERROR'

export interface WorkerMessage {
  type: WorkerMessageType
  requestId: string
  payload?: CodeExecutionRequest
}

export interface WorkerResponse {
  type: WorkerResponseType
  requestId: string
  payload?: CodeExecutionResult
  statusMessage?: string
  error?: string
}
