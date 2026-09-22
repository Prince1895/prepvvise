import 'server-only'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { type ExecutionLanguage } from '@/lib/execution/client'

export type TestCaseResult = {
  name: string
  passed: boolean
  expected?: string
  received?: string
  stderr?: string
  hidden: boolean
}

export type ExecutionRunResult = {
  status: 'passed' | 'failed' | 'error' | 'timed_out'
  results: TestCaseResult[]
  rawStdout?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

const compilerMap: Record<ExecutionLanguage, string> = {
  python: 'python-3.14',
  cpp: 'g++-15',
  c: 'gcc-15',
  java: 'openjdk-25',
  javascript: 'node',
}

function runLocally(input: {
  language: ExecutionLanguage
  sourceCode: string
  stdin?: string
}): { stdout: string; stderr: string; status: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exec-local-'))
  const lang = input.language.toLowerCase() as ExecutionLanguage
  const stdin = input.stdin ?? ''

  try {
    if (lang === 'python') {
      const filePath = path.join(tmpDir, 'solution.py')
      let code = input.sourceCode
      if (!code.includes('sys.stdin') && !code.includes('if __name__') && code.includes('def solve')) {
        code += '\nimport sys, json\ntry:\n    raw = sys.stdin.read().strip()\n    inp = json.loads(raw) if raw.startswith("[") or raw.startswith("{") else raw\n    res = solve(inp) if isinstance(inp, list) else solve(inp)\n    print(res)\nexcept Exception as e:\n    pass\n'
      }
      fs.writeFileSync(filePath, code)
      const res = spawnSync('python3', [filePath], { input: stdin, timeout: 4000, encoding: 'utf8' })
      return { stdout: res.stdout || '', stderr: res.stderr || '', status: 'finished' }
    }

    if (lang === 'javascript') {
      const filePath = path.join(tmpDir, 'solution.js')
      let code = input.sourceCode
      if (!code.includes('process.stdin') && !code.includes('readline') && code.includes('solve')) {
        code += '\nconst fs = require("fs");\ntry {\n  const raw = fs.readFileSync(0, "utf8").trim();\n  const input = raw.startsWith("[") || raw.startsWith("{") ? JSON.parse(raw) : raw;\n  console.log(Array.isArray(input) ? solve(input) : solve(input));\n} catch(e) {}\n'
      }
      fs.writeFileSync(filePath, code)
      const res = spawnSync('node', [filePath], { input: stdin, timeout: 4000, encoding: 'utf8' })
      return { stdout: res.stdout || '', stderr: res.stderr || '', status: 'finished' }
    }

    if (lang === 'java') {
      let fullCode = input.sourceCode
      if (!fullCode.includes('public class Solution') && !fullCode.includes('public class Main')) {
        fullCode = [
          'import java.util.*;',
          'import java.lang.reflect.*;',
          '',
          'public class Solution {',
          '  ' + input.sourceCode,
          '',
          '  public static void main(String[] args) throws Exception {',
          '    Scanner sc = new Scanner(System.in);',
          '    if (!sc.hasNextLine()) return;',
          '    String raw = sc.nextLine().trim();',
          '    Method target = null;',
          '    for (Method m : Solution.class.getDeclaredMethods()) {',
          '      if (Modifier.isStatic(m.getModifiers()) && !m.getName().equals("main")) {',
          '        target = m; break;',
          '      }',
          '    }',
          '    if (target == null) return;',
          '    Class<?>[] params = target.getParameterTypes();',
          '    Object[] argValues = new Object[params.length];',
          '    for (int i = 0; i < params.length; i++) {',
          '      Class<?> p = params[i];',
          '      if (p == String.class) {',
          '        argValues[i] = raw.replace(String.valueOf((char)34), "").trim();',
          '      } else if (p == int[].class) {',
          '        String clean = raw.replace("[", "").replace("]", "").trim();',
          '        if (clean.isEmpty()) { argValues[i] = new int[0]; continue; }',
          '        String[] tokens = clean.split(",");',
          '        int[] arr = new int[tokens.length];',
          '        for (int k = 0; k < tokens.length; k++) arr[k] = Integer.parseInt(tokens[k].trim());',
          '        argValues[i] = arr;',
          '      } else if (p == int.class || p == Integer.class) {',
          '        argValues[i] = Integer.parseInt(raw.replaceAll("[^0-9-]", "").trim());',
          '      }',
          '    }',
          '    Object res = target.invoke(null, argValues);',
          '    if (res instanceof int[]) System.out.println(Arrays.toString((int[]) res));',
          '    else System.out.println(res);',
          '  }',
          '}'
        ].join('\n')
      }
      fs.writeFileSync(path.join(tmpDir, 'Solution.java'), fullCode)
      const compile = spawnSync('javac', ['Solution.java'], { cwd: tmpDir, timeout: 4000, encoding: 'utf8' })
      if (compile.status !== 0) return { stdout: '', stderr: compile.stderr || 'Compilation failed', status: 'error' }
      const run = spawnSync('java', ['Solution'], { cwd: tmpDir, input: stdin, timeout: 4000, encoding: 'utf8' })
      return { stdout: run.stdout || '', stderr: run.stderr || '', status: 'finished' }
    }

    if (lang === 'cpp' || lang === 'c') {
      let fullCode = input.sourceCode
      if (!fullCode.includes('int main')) {
        fullCode = '#include <iostream>\n#include <vector>\n#include <unordered_set>\n#include <sstream>\nusing namespace std;\n' + input.sourceCode + '\nint main() {\n  string line;\n  if(!getline(cin, line)) return 0;\n  for(char &c : line) if(c==\'[\' || c==\']\' || c==\',\') c=\' \';\n  stringstream ss(line);\n  vector<int> a;\n  int x;\n  while(ss >> x) a.push_back(x);\n  cout << solve(a) << endl;\n  return 0;\n}'
      }
      fs.writeFileSync(path.join(tmpDir, 'solution.cpp'), fullCode)
      const compiler = lang === 'c' ? 'gcc' : 'g++'
      const compile = spawnSync(compiler, ['solution.cpp', '-o', 'solution.out'], { cwd: tmpDir, timeout: 4000, encoding: 'utf8' })
      if (compile.status !== 0) return { stdout: '', stderr: compile.stderr || 'Compilation failed', status: 'error' }
      const run = spawnSync('./solution.out', [], { cwd: tmpDir, input: stdin, timeout: 4000, encoding: 'utf8' })
      return { stdout: run.stdout || '', stderr: run.stderr || '', status: 'finished' }
    }

    return { stdout: '', stderr: 'Unsupported language', status: 'error' }
  } catch (err) {
    return { stdout: '', stderr: err instanceof Error ? err.message : 'Execution failed', status: 'error' }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

/**
 * Executes source code via OnlineCompiler.io with automatic local runner fallback.
 */
export async function runOnce(input: {
  submissionId: string
  language: ExecutionLanguage
  sourceCode: string
  stdin?: string
}): Promise<{ stdout: string; stderr: string; status: string }> {
  const baseUrl = (process.env.EXECUTION_SERVICE_URL || 'https://api.onlinecompiler.io').trim().replace(/"/g, '')
  const token = (process.env.EXECUTION_SERVICE_TOKEN || '').trim().replace(/"/g, '')

  if (token && token.length > 0 && !token.includes('demo')) {
    try {
      const endpoint = baseUrl.includes('/api/run-code-sync')
        ? baseUrl
        : `${baseUrl.replace(/\/$/, '')}/api/run-code-sync/`

      const compiler = compilerMap[input.language] || input.language

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          compiler,
          code: input.sourceCode,
          input: input.stdin ?? '',
        }),
        cache: 'no-store',
      })

      if (response.ok) {
        const payload: unknown = await response.json().catch(() => ({}))
        if (isRecord(payload)) {
          return {
            stdout: asString(payload.stdout) ?? asString(payload.output) ?? '',
            stderr: asString(payload.stderr) ?? '',
            status: asString(payload.status) ?? 'finished',
          }
        }
      }
    } catch {
      // Fallback to local runner on network or API errors
    }
  }

  // Local execution fallback
  return runLocally(input)
}
