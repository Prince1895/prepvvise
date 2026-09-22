// JavaScript Execution Worker for Prepwise Debugging & AI Coding Lab

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
  let totalBytes = 0;
  let status = 'success';

  function appendStdout(text) {
    const str = String(text);
    stdout += str;
    totalBytes += new TextEncoder().encode(str).length;
    if (totalBytes > outputLimitBytes) {
      throw new Error('OUTPUT_LIMIT_EXCEEDED');
    }
  }

  function appendStderr(text) {
    const str = String(text);
    stderr += str;
  }

  const customConsole = {
    log: function (...args) {
      appendStdout(args.map(formatArg).join(' ') + '\n');
    },
    info: function (...args) {
      appendStdout(args.map(formatArg).join(' ') + '\n');
    },
    debug: function (...args) {
      appendStdout(args.map(formatArg).join(' ') + '\n');
    },
    warn: function (...args) {
      appendStderr(args.map(formatArg).join(' ') + '\n');
    },
    error: function (...args) {
      appendStderr(args.map(formatArg).join(' ') + '\n');
    },
  };

  function formatArg(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }

  function getInput() {
    return stdin;
  }

  try {
    const parsedArgs = parseStdinArgs(stdin);
    const wrappedCode = `
      ${sourceCode}

      let _solvedResult = undefined;
      let _targetFn = null;

      if ("${functionName}" && typeof eval !== 'undefined') {
        try {
          const fn = eval("${functionName}");
          if (typeof fn === 'function') _targetFn = fn;
        } catch(e) {}
      }

      if (!_targetFn && "${functionSignature}") {
        const _m = "${functionSignature}".match(/^(\\w+)\\(/);
        if (_m && _m[1]) {
          try {
            const fn = eval(_m[1]);
            if (typeof fn === 'function') _targetFn = fn;
          } catch(e) {}
        }
      }

      if (!_targetFn && typeof solve === 'function') {
        _targetFn = solve;
      }

      if (!_targetFn) {
        const _fnMatches = Array.from(\`${sourceCode.replace(/`/g, '\\`')}\`.matchAll(/(?:function\\s+(\\w+)|(?:var|let|const)\\s+(\\w+)\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>))/g));
        for (const _match of _fnMatches) {
          const _name = _match[1] || _match[2];
          if (_name) {
            try {
              const fn = eval(_name);
              if (typeof fn === 'function') {
                _targetFn = fn;
                break;
              }
            } catch(e) {}
          }
        }
      }

      if (_targetFn) {
        _solvedResult = _targetFn.apply(null, _parsedArgs);
      }

      return _solvedResult;
    `;

    const runner = new Function('console', 'stdin', 'getInput', 'readStdin', '_parsedArgs', wrappedCode);
    const result = runner(customConsole, stdin, getInput, getInput, parsedArgs);

    if (result !== undefined && stdout.trim() === '') {
      if (typeof result === 'object' && result !== null) {
        appendStdout(JSON.stringify(result));
      } else {
        appendStdout(String(result));
      }
    }
  } catch (err) {
    if (err && err.message === 'OUTPUT_LIMIT_EXCEEDED') {
      status = 'output_limit';
      appendStderr('Output limit exceeded.\n');
    } else if (err instanceof SyntaxError) {
      status = 'compile_error';
      appendStderr('SyntaxError: ' + err.message + '\n');
    } else {
      status = 'runtime_error';
      appendStderr((err && (err.stack || err.message)) ? String(err.stack || err.message) : 'Runtime error occurred.\n');
    }
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
