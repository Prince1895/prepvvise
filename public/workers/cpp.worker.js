// C++ Execution Worker for Prepwise Debugging & AI Coding Lab

function parseStdinArgs(stdin) {
  const trimmed = stdin.trim();
  if (!trimmed) return [];

  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try { return [JSON.parse(trimmed)]; } catch(e) {}
  }
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return [Number(trimmed)];
  }

  if (trimmed.includes('=') || trimmed.includes('],')) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (char === '[' || char === '{') depth++;
      else if (char === ']' || char === '}') depth--;

      if (char === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());

    if (parts.length > 1 || parts[0].includes('=')) {
      const args = [];
      for (let part of parts) {
        if (part.includes('=')) {
          part = part.split('=').slice(1).join('=').trim();
        }
        if ((part.startsWith('[') && part.endsWith(']')) || (part.startsWith('{') && part.endsWith('}'))) {
          try { args.push(JSON.parse(part)); } catch(e) { args.push(part); }
        } else if (!isNaN(Number(part)) && part !== '') {
          args.push(Number(part));
        } else {
          args.push(part);
        }
      }
      return args;
    }
  }

  return [trimmed];
}

self.onmessage = function (e) {
  const { requestId, payload } = e.data || {};
  if (!payload) return;

  const { sourceCode, stdin = '', functionName = '', functionSignature = '', outputLimitBytes = 102400 } = payload;
  const startTime = performance.now();

  let stdout = '';
  let stderr = '';
  let status = 'success';

  try {
    const code = sourceCode.trim();

    if (!code.includes('solve') && !code.includes('main') && !code.includes('(')) {
      status = 'compile_error';
      stderr = 'C++ compilation error: Missing solve() or main() function.\n';
    } else {
      const result = executeCppCode(code, stdin, functionName, functionSignature);
      stdout = result.stdout;
      stderr = result.stderr;
      status = result.status;
    }
  } catch (err) {
    status = 'runtime_error';
    stderr = err instanceof Error ? err.message : 'C++ execution failed.';
  }

  if (new TextEncoder().encode(stdout).length > outputLimitBytes) {
    status = 'output_limit';
    stderr = 'Output limit exceeded.\n';
    stdout = stdout.slice(0, 1000) + '...';
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  self.postMessage({
    type: 'RESULT',
    requestId,
    payload: {
      status,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      executionTimeMs,
    },
  });
};

function executeCppCode(cppCode, stdin, functionName, functionSignature) {
  let stdout = '';
  let stderr = '';
  let status = 'success';

  try {
    let jsCode = cppCode;

    jsCode = jsCode
      .replace(/#include\s+<[^>]+>/g, '')
      .replace(/using\s+namespace\s+std\s*;/g, '')
      .replace(/(?:auto|int|bool|void|vector<[^>]+>|string)\s+(\w+)\s*\(([^)]*)\)/g, 'function $1($2)')
      .replace(/vector<int>&?\s*(\w+)/g, '$1')
      .replace(/string&?\s*(\w+)/g, '$1')
      .replace(/unordered_set<int>\s+(\w+);?/g, 'const $1 = new Set();')
      .replace(/unordered_map<[\w, ]+>\s+(\w+);?/g, 'const $1 = new Map();')
      .replace(/int\s+/g, 'let ')
      .replace(/char\s+/g, 'let ')
      .replace(/auto\s+/g, 'let ')
      .replace(/(\w+)\.size\(\)/g, '$1.length')
      .replace(/(\w+)\.count\((\w+)\)/g, '$1.has($2)')
      .replace(/(\w+)\.insert\((\w+)\)/g, '$1.add($2)')
      .replace(/cout\s*<<\s*([^;]+)\s*<<\s*endl;/g, '_stdout += String($1) + "\\n";')
      .replace(/cout\s*<<\s*([^;]+);/g, '_stdout += String($1);');

    let targetFnName = functionName;
    if (!targetFnName && functionSignature) {
      const match = functionSignature.match(/^(\w+)\(/);
      if (match) targetFnName = match[1];
    }

    const parsedArgs = parseStdinArgs(stdin);

    const runner = new Function('_parsedArgs', `
      let _stdout = '';
      ${jsCode}

      let _targetFn = null;
      if ("${targetFnName}" && typeof eval("${targetFnName}") === 'function') {
        _targetFn = eval("${targetFnName}");
      } else if (typeof solve === 'function') {
        _targetFn = solve;
      } else {
        const _fnMatches = Array.from(\`${jsCode.replace(/`/g, '\\`')}\`.matchAll(/function\\s+(\\w+)/g));
        for (const _match of _fnMatches) {
          if (_match[1] && typeof eval(_match[1]) === 'function') {
            _targetFn = eval(_match[1]);
            break;
          }
        }
      }

      if (_targetFn) {
        const _res = _targetFn.apply(null, _parsedArgs);
        if (_res !== undefined && _stdout === '') {
          _stdout = typeof _res === 'object' ? JSON.stringify(_res) : String(_res);
        }
      }

      return _stdout;
    `);

    stdout = runner(parsedArgs);
  } catch (err) {
    status = 'runtime_error';
    stderr = 'C++ Runtime Exception: ' + (err.message || 'Error executing C++ solution');
  }

  return { stdout, stderr, status };
}
