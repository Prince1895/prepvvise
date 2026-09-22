import { compareOutputs, normalizeOutput } from '../utils/normalizeOutput'
import { isOutputLimitExceeded, truncateToLimit } from '../utils/limits'

function parseStdinArgs(stdin: string): any[] {
  const trimmed = stdin.trim()
  if (!trimmed) return []

  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try { return [JSON.parse(trimmed)] } catch(e) {}
  }
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return [Number(trimmed)]
  }

  if (trimmed.includes('=') || trimmed.includes('],')) {
    const parts: string[] = []
    let depth = 0
    let current = ''
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i]
      if (char === '[' || char === '{') depth++
      else if (char === ']' || char === '}') depth--

      if (char === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    if (current.trim()) parts.push(current.trim())

    if (parts.length > 1 || parts[0].includes('=')) {
      const args: any[] = []
      for (let part of parts) {
        if (part.includes('=')) {
          part = part.split('=').slice(1).join('=').trim()
        }
        if ((part.startsWith('[') && part.endsWith(']')) || (part.startsWith('{') && part.endsWith('}'))) {
          try { args.push(JSON.parse(part)) } catch(e) { args.push(part) }
        } else if (!isNaN(Number(part)) && part !== '') {
          args.push(Number(part))
        } else {
          args.push(part)
        }
      }
      return args
    }
  }

  return [trimmed]
}

function executeJsHarness(sourceCode: string, stdin: string, functionSignature: string) {
  const parsedArgs = parseStdinArgs(stdin)
  let stdout = ''

  function formatArg(arg: any) {
    if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg)
    return String(arg)
  }

  const customConsole = {
    log: (...args: any[]) => { stdout += args.map(formatArg).join(' ') + '\n' }
  }

  const wrappedCode = `
    ${sourceCode}

    let _solvedResult = undefined;
    let _targetFn = null;

    if ("${functionSignature}") {
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

    if (_targetFn) {
      _solvedResult = _targetFn.apply(null, _parsedArgs);
    }

    return _solvedResult;
  `

  const runner = new Function('console', 'stdin', 'getInput', 'readStdin', '_parsedArgs', wrappedCode)
  const result = runner(customConsole, stdin, () => stdin, () => stdin, parsedArgs)

  if (result !== undefined && stdout.trim() === '') {
    if (typeof result === 'object' && result !== null) {
      stdout += JSON.stringify(result)
    } else {
      stdout += String(result)
    }
  }

  return stdout.trim()
}

function runTests() {
  console.log('Testing output normalization...')

  const crlfString = 'line1\r\nline2\r\nline3\r\n'
  const normalized = normalizeOutput(crlfString)
  if (normalized !== 'line1\nline2\nline3') {
    throw new Error(`CRLF normalization failed: ${JSON.stringify(normalized)}`)
  }

  console.log('Testing dynamic function execution (twoSum, isAnagram, solve)...')

  // Test Two Sum with twoSum(nums, target) function signature
  const twoSumCode = `
    function twoSum(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
      }
    }
  `
  const twoSumOut = executeJsHarness(twoSumCode, 'nums=[2,7,11,15], target=9', 'twoSum(nums, target)')
  if (twoSumOut !== '[0,1]') {
    throw new Error(`Two Sum execution failed: expected [0,1], got ${twoSumOut}`)
  }
  console.log('✓ twoSum(nums, target) executed successfully! Result:', twoSumOut)

  // Test Valid Anagram
  const anagramCode = `
    function isAnagram(s, t) {
      return s.split('').sort().join('') === t.split('').sort().join('');
    }
  `
  const anagramOut = executeJsHarness(anagramCode, 's="anagram", t="nagaram"', 'isAnagram(s, t)')
  if (anagramOut !== 'true') {
    throw new Error(`Valid Anagram execution failed: expected true, got ${anagramOut}`)
  }
  console.log('✓ isAnagram(s, t) executed successfully! Result:', anagramOut)

  console.log('All execution harness tests passed successfully!')
}

runTests()
