// Python Pyodide Worker for Prepwise Debugging & AI Coding Lab

let pyodide = null;
let pyodideReadyPromise = null;

async function loadPyodideRuntime() {
  if (pyodide) return pyodide;
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
    // @ts-ignore
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });
    return pyodide;
  })();

  return pyodideReadyPromise;
}

self.onmessage = async function (e) {
  const { requestId, payload } = e.data || {};
  if (!payload) return;

  const { sourceCode, stdin = '', functionName = '', functionSignature = '', outputLimitBytes = 102400 } = payload;
  const startTime = performance.now();

  try {
    self.postMessage({ type: 'STATUS_UPDATE', requestId, statusMessage: 'Loading Python runtime (Pyodide)...' });
    const py = await loadPyodideRuntime();

    self.postMessage({ type: 'STATUS_UPDATE', requestId, statusMessage: 'Executing Python code...' });

    let targetFnName = functionName;
    if (!targetFnName && functionSignature) {
      const match = functionSignature.match(/^(\w+)\(/);
      if (match) targetFnName = match[1];
    }

    const pyCode = `
import sys, io, json, re, inspect

class StringStdin(io.StringIO):
    def readline(self, size=-1):
        return super().readline(size)

__stdin_data = ${JSON.stringify(stdin)}
sys.stdin = StringStdin(__stdin_data)

__stdout_buffer = io.StringIO()
__stderr_buffer = io.StringIO()
sys.stdout = __stdout_buffer
sys.stderr = __stderr_buffer

__exec_status = "success"
__solved_res = None

def parse_python_args(raw):
    trimmed = raw.strip()
    if not trimmed: return []
    if (trimmed.startswith("[") and trimmed.endswith("]")) or (trimmed.startswith("{") and trimmed.endswith("}")):
        try: return [json.loads(trimmed)]
        except Exception: pass
    if trimmed.isdigit():
        return [int(trimmed)]

    if "=" in trimmed or "]," in trimmed:
        parts = []
        depth = 0
        curr = ""
        for char in trimmed:
            if char in "[{": depth += 1
            elif char in "]}": depth -= 1
            if char == "," and depth == 0:
                if curr.strip(): parts.append(curr.strip())
                curr = ""
            else:
                curr += char
        if curr.strip(): parts.append(curr.strip())

        if len(parts) > 1 or "=" in parts[0]:
            args = []
            for p in parts:
                if "=" in p:
                    p = p.split("=", 1)[1].strip()
                if (p.startswith("[") and p.endswith("]")) or (p.startswith("{") and p.endswith("}")):
                    try: args.append(json.loads(p))
                    except Exception: args.append(p)
                elif p.isdigit():
                    args.append(int(p))
                else:
                    args.append(p)
            return args
    return [trimmed]

try:
    __user_globals = {"sys": sys, "json": json, "re": re}
    exec(${JSON.stringify(sourceCode)}, __user_globals)

    target_fn = None
    explicit_name = ${JSON.stringify(targetFnName)}

    if explicit_name and explicit_name in __user_globals and callable(__user_globals[explicit_name]):
        target_fn = __user_globals[explicit_name]
    elif "solve" in __user_globals and callable(__user_globals["solve"]):
        target_fn = __user_globals["solve"]
    else:
        for name, obj in __user_globals.items():
            if callable(obj) and not name.startswith("__") and name not in ("sys", "json", "re", "parse_python_args"):
                target_fn = obj
                break

    if target_fn:
        args = parse_python_args(__stdin_data)
        try:
            __solved_res = target_fn(*args)
        except TypeError:
            __solved_res = target_fn(__stdin_data)

except SyntaxError as e:
    __exec_status = "compile_error"
    sys.stderr.write(f"SyntaxError: {e}\\n")
except Exception as e:
    __exec_status = "runtime_error"
    import traceback
    sys.stderr.write(traceback.format_exc())

__out_val = __stdout_buffer.getvalue()
if not __out_val.strip() and __solved_res is not None:
    if isinstance(__solved_res, (dict, list)):
        __out_val = json.dumps(__solved_res)
    else:
        __out_val = str(__solved_res)

__err_val = __stderr_buffer.getvalue()
(__exec_status, __out_val, __err_val)
`;

    const pyResult = py.runPython(pyCode);
    const [status, rawStdout, rawStderr] = pyResult.toJs();

    let finalStdout = String(rawStdout || '');
    let finalStderr = String(rawStderr || '');
    let finalStatus = status;

    if (new TextEncoder().encode(finalStdout).length > outputLimitBytes) {
      finalStatus = 'output_limit';
      finalStderr = 'Output limit exceeded.\n';
      finalStdout = finalStdout.slice(0, 1000) + '...';
    }

    const executionTimeMs = Math.round(performance.now() - startTime);

    self.postMessage({
      type: 'RESULT',
      requestId,
      payload: {
        status: finalStatus,
        stdout: finalStdout.trim(),
        stderr: finalStderr.trim(),
        executionTimeMs,
      },
    });
  } catch (err) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    self.postMessage({
      type: 'RESULT',
      requestId,
      payload: {
        status: 'execution_error',
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Python execution failed.',
        executionTimeMs,
      },
    });
  }
};
