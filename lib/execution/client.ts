import 'server-only'

export const executionLimits = {
  cpuTimeMs: 2_000,
  memoryMb: 256,
  wallTimeMs: 5_000,
  maxOutputBytes: 64_000,
  network: false,
} as const

export type ExecutionLanguage = 'c' | 'cpp' | 'java' | 'python' | 'javascript'

export type ExecutionRequest = {
  submissionId: string
  language: ExecutionLanguage
  sourceCode: string
  problemId: string
  limits: typeof executionLimits
}

export type ExecutionDispatch = {
  providerJobId: string
  status: 'queued' | 'running'
}

export class ExecutionClientError extends Error {}

export async function dispatchExecution(request: ExecutionRequest): Promise<ExecutionDispatch> {
  const serviceUrl = process.env.EXECUTION_SERVICE_URL
  const token = process.env.EXECUTION_SERVICE_TOKEN

  if (!serviceUrl || !token) {
    throw new ExecutionClientError('Code execution service is not configured.')
  }

  let response: Response

  try {
    response = await fetch(`${serviceUrl.replace(/\/$/, '')}/v1/executions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
      cache: 'no-store',
    })
  } catch {
    throw new ExecutionClientError('Code execution service is unavailable.')
  }

  if (!response.ok) {
    throw new ExecutionClientError('Code execution service rejected the submission.')
  }

  const payload: unknown = await response.json()
  const jobId = typeof payload === 'object' && payload !== null && 'jobId' in payload
    ? payload.jobId
    : null

  if (typeof jobId !== 'string' || jobId.length === 0) {
    throw new ExecutionClientError('Code execution service returned an invalid job ID.')
  }

  return {
    providerJobId: jobId,
    status: 'queued',
  }
}