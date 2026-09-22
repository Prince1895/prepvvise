import {
  CodeExecutionRequest,
  CodeExecutionResult,
  WorkerMessage,
  WorkerResponse,
} from '@/lib/execution/types/execution.types'
import { DEFAULT_OUTPUT_LIMIT_BYTES, DEFAULT_TIMEOUT_MS } from '@/lib/execution/utils/limits'

type StatusCallback = (message: string) => void

export class ExecutionManager {
  private activeWorkers: Map<string, Worker> = new Map()
  private activeTimers: Map<string, NodeJS.Timeout> = new Map()
  private activeRequests: Map<string, {
    resolve: (result: CodeExecutionResult) => void
    reject: (error: Error) => void
    onStatusUpdate?: StatusCallback
    language: string
  }> = new Map()

  private getWorkerUrl(language: string): string {
    const lang = language.toLowerCase()
    switch (lang) {
      case 'javascript':
      case 'js':
        return '/workers/javascript.worker.js'
      case 'python':
      case 'py':
        return '/workers/python.worker.js'
      case 'java':
        return '/workers/java.worker.js'
      case 'c':
        return '/workers/c.worker.js'
      case 'cpp':
      case 'c++':
        return '/workers/cpp.worker.js'
      default:
        return '/workers/javascript.worker.js'
    }
  }

  private getOrCreateWorker(language: string): Worker {
    const lang = language.toLowerCase()
    if (!this.activeWorkers.has(lang)) {
      const url = this.getWorkerUrl(lang)
      const worker = new Worker(url)
      this.activeWorkers.set(lang, worker)
    }
    return this.activeWorkers.get(lang)!
  }

  /**
   * Executes code using a dedicated Web Worker with timeout and output limit handling.
   */
  public execute(
    request: CodeExecutionRequest,
    onStatusUpdate?: StatusCallback
  ): Promise<CodeExecutionResult> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return resolve({
          status: 'unsupported',
          stdout: '',
          stderr: 'Code execution is only supported in browser environments.',
        })
      }

      const requestId = 'req_' + Math.random().toString(36).substring(2, 11)
      const lang = request.language.toLowerCase()
      const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS
      const outputLimitBytes = request.outputLimitBytes ?? DEFAULT_OUTPUT_LIMIT_BYTES

      let worker: Worker
      try {
        worker = this.getOrCreateWorker(lang)
      } catch (err) {
        return resolve({
          status: 'unsupported',
          stdout: '',
          stderr: `Execution environment for ${request.language} is unavailable in this browser.`,
        })
      }

      this.activeRequests.set(requestId, { resolve, reject, onStatusUpdate, language: lang })

      const handleMessage = (e: MessageEvent<WorkerResponse>) => {
        const { type, requestId: resId, payload, statusMessage, error } = e.data || {}
        if (resId !== requestId) return

        if (type === 'STATUS_UPDATE' && statusMessage && onStatusUpdate) {
          onStatusUpdate(statusMessage)
          return
        }

        if (type === 'RESULT' && payload) {
          this.cleanupRequest(requestId, lang)
          resolve(payload)
          return
        }

        if (type === 'ERROR' && error) {
          this.cleanupRequest(requestId, lang)
          resolve({
            status: 'execution_error',
            stdout: '',
            stderr: error,
          })
        }
      }

      const handleError = (err: ErrorEvent) => {
        this.cleanupRequest(requestId, lang)
        resolve({
          status: 'execution_error',
          stdout: '',
          stderr: err.message || 'Worker execution error.',
        })
      }

      worker.addEventListener('message', handleMessage)
      worker.addEventListener('error', handleError)

      // Set timeout timer to terminate worker on infinite loops
      const timer = setTimeout(() => {
        this.terminateWorker(lang)
        this.cleanupRequest(requestId, lang)
        resolve({
          status: 'timeout',
          stdout: '',
          stderr: `Execution timed out after ${timeoutMs}ms. Infinite loop or excessive computation detected.`,
          executionTimeMs: timeoutMs,
        })
      }, timeoutMs)

      this.activeTimers.set(requestId, timer)

      const message: WorkerMessage = {
        type: 'EXECUTE',
        requestId,
        payload: {
          ...request,
          timeoutMs,
          outputLimitBytes,
        },
      }

      worker.postMessage(message)
    })
  }

  /**
   * Stops active execution immediately and terminates the language worker.
   */
  public stopExecution(language?: string): void {
    if (language) {
      const lang = language.toLowerCase()
      this.terminateWorker(lang)
    } else {
      for (const lang of Array.from(this.activeWorkers.keys())) {
        this.terminateWorker(lang)
      }
    }

    for (const [reqId, req] of Array.from(this.activeRequests.entries())) {
      if (!language || req.language === language.toLowerCase()) {
        const timer = this.activeTimers.get(reqId)
        if (timer) clearTimeout(timer)
        this.activeTimers.delete(reqId)
        req.resolve({
          status: 'execution_error',
          stdout: '',
          stderr: 'Execution stopped by user.',
        })
        this.activeRequests.delete(reqId)
      }
    }
  }

  private terminateWorker(language: string): void {
    const worker = this.activeWorkers.get(language)
    if (worker) {
      try {
        worker.terminate()
      } catch (e) {
        // ignore
      }
      this.activeWorkers.delete(language)
    }
  }

  private cleanupRequest(requestId: string, language: string): void {
    const timer = this.activeTimers.get(requestId)
    if (timer) {
      clearTimeout(timer)
      this.activeTimers.delete(requestId)
    }
    this.activeRequests.delete(requestId)
  }
}

export const executionManager = new ExecutionManager()
