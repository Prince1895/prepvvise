import fs from 'fs'
import path from 'path'
import { validateAiCodingContentData } from '../lib/content/ai-coding/validator'

const fullCurriculum = {
  id: 'ai-coding',
  name: 'AI-Assisted Coding',
  title: 'AI-Assisted Coding Curriculum',
  description: 'A comprehensive, interview-oriented, progressive learning curriculum teaching developers how to effectively use AI assistants for code generation, debugging, testing, refactoring, architecture, and agentic workflows.',
  version: '1.0',
  sections: [
    {
      id: 'sec-1-intro',
      position: 1,
      title: 'Section 1 — Introduction to AI Coding',
      slug: 'introduction-to-ai-coding',
      description: 'Master the fundamentals of AI coding assistants, LLM code models, capabilities, limitations, and essential workflow patterns.',
      level: 'beginner',
      lessons: [
        {
          id: 'les-1-1',
          position: 1,
          title: 'What is AI-Assisted Coding?',
          slug: 'what-is-ai-assisted-coding',
          level: 'beginner',
          durationMinutes: 8,
          objectives: [
            'Understand the core capabilities of AI coding assistants.',
            'Differentiate AI code completion, chat-based generation, and autonomous agents.',
            'Learn the optimal mental model: AI as a high-speed junior pair-programmer.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Understanding AI-Assisted Coding' },
            { type: 'paragraph', text: 'AI-assisted coding is the practice of leveraging Large Language Models (LLMs) trained on billions of lines of source code to assist developers throughout the software development lifecycle. Rather than writing every line manually, developers direct AI assistants to generate boilerplate, explain existing logic, debug stack traces, and suggest optimizations.' },
            {
              type: 'workflow',
              title: 'The AI-Assisted Coding Triad',
              steps: [
                { number: 1, title: 'Developer Intent', description: 'Human developer defines requirements, architecture, constraints, and edge cases.', badge: 'HUMAN' },
                { number: 2, title: 'AI Generation', description: 'AI assistant synthesizes code candidates based on prompt and context.', badge: 'AI' },
                { number: 3, title: 'Verification & Integration', description: 'Developer reviews, tests, verifies, and integrates the generated solution.', badge: 'VERIFIED' }
              ]
            },
            { type: 'subheading', text: 'Key Modalities of AI Coding' },
            {
              type: 'bulletList',
              items: [
                'Inline Code Completion: Ghost-text suggestions predicting your next line or block as you type.',
                'Conversational Coding Chat: Natural language dialog to plan architecture, debug errors, and explore options.',
                'Repository-Aware Assistants: AI tools indexing your codebase for context-aware multi-file edits.',
                'Agentic Workflows: Autonomous AI agents executing tool calls, running terminal commands, and modifying code.'
              ]
            },
            { type: 'tip', title: 'Mindset Shift', text: 'Treat AI as an ultra-fast, eager junior engineer. It can produce draft code in seconds, but you remain the senior tech lead who must inspect, test, and approve every change.' }
          ],
          examples: [
            {
              title: 'Weak vs Strong AI Developer Modality',
              description: 'Comparing passive copy-pasting vs active developer supervision.',
              weakPrompt: 'Copy-pasting generated code directly into production without reading or running unit tests.',
              strongPrompt: 'Reading generated code line-by-line, running local test cases, checking edge cases, and verifying API compatibility before committing.',
              explanation: 'Active verification prevents silent regressions, security vulnerabilities, and subtle logic bugs.'
            }
          ],
          exercise: {
            id: 'ex-1-1',
            title: 'Exercise: Identify the Role of AI Assistant',
            exerciseType: 'select-better',
            description: 'Which of the following describes the most effective usage of AI in professional development?',
            choices: [
              'Relying on AI to decide system architecture without human review.',
              'Using AI to quickly draft repetitive boilerplate and test cases, then conducting rigorous human code review.',
              'Allowing AI to push code directly to production without running CI/CD test suites.',
              'Replacing software testing entirely with AI text explanations.'
            ],
            correctAnswer: 1,
            explanation: 'AI is best used to accelerate routine tasks while human developers maintain control over architecture, correctness, and security verification.'
          },
          quiz: {
            question: 'What is the primary responsibility of a software engineer when using AI coding assistants?',
            options: [
              'Memorizing AI prompt syntax.',
              'Validating correctness, security, performance, and architecture of AI output.',
              'Disabling unit tests since AI generates bug-free code.',
              'Allowing the AI to deploy changes without human supervision.'
            ],
            answerIndex: 1,
            explanation: 'Human developers retain total accountability for code quality, correctness, and security.'
          },
          keyTakeaways: [
            'AI tools augment human software engineers; they do not replace critical thinking.',
            'Verification (testing, inspecting, benchmarking) is mandatory for all AI-generated code.',
            'Always maintain human ownership of the codebase and final technical decisions.'
          ]
        },
        {
          id: 'les-1-2',
          position: 2,
          title: 'How AI Coding Assistants Work',
          slug: 'how-ai-coding-assistants-work',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Understand LLM tokenization, next-token prediction, and context windows.',
            'Learn how context window limits affect code generation accuracy.',
            'Recognize why AI predicts probabilistic code rather than executing actual logic.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Under the Hood of LLM Code Generators' },
            { type: 'paragraph', text: 'AI coding models are transformer-based neural networks trained on vast datasets of source code and technical documentation. At their core, LLMs operate on probabilistic next-token prediction. They do not execute code or reason mathematically like a CPU; instead, they compute probability distributions over possible token completions based on the prompt and surrounding context.' },
            {
              type: 'comparison',
              title: 'Traditional Compiler vs AI Code Assistant',
              columns: ['Dimension', 'Traditional Compiler/IDE', 'AI Coding Model'],
              rows: [
                ['Execution Engine', 'Deterministic state machine (AST & machine instructions)', 'Probabilistic neural network (Token prediction)'],
                ['Guarantees', 'Strict syntax and type check verification', 'No execution guarantees; syntax may look plausible but be incorrect'],
                ['Strengths', 'Exact mathematical execution and static analysis', 'Pattern matching, translation, reasoning from context, synthesis'],
                ['Limitations', 'Requires exact explicit instructions', 'Subject to hallucinations and subtle boundary bugs']
              ]
            },
            { type: 'warning', title: 'Critical Insight: Context Window Constraints', text: 'The context window is the finite amount of text (measured in tokens) an LLM can process at once. If your context lacks file definitions, types, or dependencies, the model will hallucinate plausible-looking names.' }
          ],
          quiz: {
            question: 'Why does an AI model sometimes generate calls to non-existent library functions?',
            options: [
              'The compiler updated automatically.',
              'The model uses probabilistic token prediction based on common patterns rather than validating actual module exports.',
              'The database index failed.',
              'The AI assistant executed the code in a sandbox.'
            ],
            answerIndex: 1,
            explanation: 'AI models predict tokens that look statistically plausible based on training data, without executing runtime import checks unless provided context or external tool verification.'
          },
          keyTakeaways: [
            'LLMs generate code probabilistically, not deterministically.',
            'Context quality directly dictates generation quality.',
            'Never assume an AI model verified that an API function actually exists.'
          ]
        },
        {
          id: 'les-1-3',
          position: 3,
          title: 'AI vs Traditional Programming',
          slug: 'ai-vs-traditional-programming',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Compare deterministic programming logic with probabilistic AI generation.',
            'Identify when to write manual code versus prompting AI.',
            'Learn hybrid development workflows.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Deterministic Code vs Probabilistic Generation' },
            { type: 'paragraph', text: 'Traditional programming requires specifying exact algorithmic steps (`If X then Y`). AI-assisted coding shifts part of the workload from manual implementation to high-level specification and constraint definition. However, core logic, business rules, and security gates still demand deterministic precision.' },
            {
              type: 'codeComparison',
              title: 'Imperative Coding vs AI Prompting Specification',
              leftTitle: 'Traditional Manual Code (TypeScript)',
              rightTitle: 'AI Specification Prompt',
              leftLanguage: 'typescript',
              rightLanguage: 'markdown',
              leftCode: `function filterActiveUsers(users: User[]): User[] {\n  return users.filter(u => u.status === 'active' && u.emailVerified);\n}`,
              rightCode: `Generate a TypeScript function 'filterActiveUsers' that filters an array of User objects.\nConstraints:\n- Only return users where status === 'active' AND emailVerified === true.\n- Keep it immutable and write a unit test with Jest.`,
              description: 'AI prompting turns specifications into code, but the developer must verify the implementation matches requirement boundaries.'
            }
          ],
          keyTakeaways: [
            'Use traditional manual coding for critical business rules and security checks.',
            'Use AI generation for repetitive implementations, boilerplate, data transformations, and tests.',
            'Combine both approaches for maximum efficiency.'
          ]
        },
        {
          id: 'les-1-4',
          position: 4,
          title: 'Benefits of AI-Assisted Development',
          slug: 'benefits-of-ai-assisted-development',
          level: 'beginner',
          durationMinutes: 8,
          objectives: [
            'Quantify productivity gains in boilerplate, documentation, and testing.',
            'Accelerate context switching and learning new frameworks.',
            'Maintain high velocity without sacrificing code standards.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Where AI Delivers High ROI' },
            {
              type: 'bulletList',
              items: [
                'Boilerplate Reduction: Generating schemas, DTOs, mock data, and boilerplate handlers instantly.',
                'Test Coverage Acceleration: Generating edge-case unit test suites for existing functions.',
                'Documentation Generation: Creating structured JSDoc comments, OpenAPI specs, and README documentation.',
                'Framework Onboarding: Rapidly learning syntax and idioms of unfamiliar libraries.'
              ]
            }
          ],
          keyTakeaways: [
            'AI excels at routine boilerplate, unit tests, and syntax translation.',
            'Time saved on boilerplate should be redirected into architectural review and thorough testing.'
          ]
        },
        {
          id: 'les-1-5',
          position: 5,
          title: 'Limitations of AI Coding',
          slug: 'limitations-of-ai-coding',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Identify hallucinated APIs, outdated packages, and incorrect assumptions.',
            'Recognize security hazards in AI generated code.',
            'Avoid over-reliance during technical interviews and production work.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Where AI Coding Models Fail' },
            {
              type: 'warning',
              title: 'Top AI Failure Modes',
              text: '1. Hallucinated APIs and packages.\n2. Insecure default practices (e.g. hardcoded secrets, plain-text queries).\n3. Stale syntax due to training knowledge cutoff.\n4. Silent behavioral shifts during refactoring.'
            }
          ],
          keyTakeaways: [
            'Never blindly trust AI output.',
            'Check package dependencies on npm/PyPI before importing generated libraries.',
            'Review all database and security code for injection hazards.'
          ]
        },
        {
          id: 'les-1-6',
          position: 6,
          title: 'AI Coding Workflow',
          slug: 'ai-coding-workflow-basics',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Master the 5-step professional AI workflow cycle.',
            'Learn incremental implementation tactics.',
            'Avoid dumping huge multi-file prompts blindly.'
          ],
          content: [
            {
              type: 'workflow',
              title: 'Professional 5-Step AI Workflow Cycle',
              steps: [
                { number: 1, title: 'Specify', description: 'Define problem, type signatures, and clear constraints.', badge: 'STEP 1' },
                { number: 2, title: 'Prompt', description: 'Pass exact context and request incremental solution.', badge: 'STEP 2' },
                { number: 3, title: 'Inspect', description: 'Perform line-by-line code review of generated code.', badge: 'STEP 3' },
                { number: 4, title: 'Test', description: 'Run compiler, linter, and unit test cases.', badge: 'STEP 4' },
                { number: 5, title: 'Refine', description: 'Iterately refine prompts to fix errors and optimize.', badge: 'STEP 5' }
              ]
            }
          ],
          keyTakeaways: [
            'Work incrementally function by function, feature by feature.',
            'Always inspect before running, and run tests before committing.'
          ]
        },
        {
          id: 'les-1-7',
          position: 7,
          title: 'Human Reasoning + AI Assistance',
          slug: 'human-reasoning-and-ai-assistance',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Understand how human intuition guides AI generation.',
            'Maintain problem-solving ownership.',
            'Use AI to challenge your assumptions.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'The Symbiosis of Human Judgment and AI Velocity' },
            { type: 'paragraph', text: 'AI assistants process context at blazing speed, but humans provide domain understanding, business logic, empathy, and holistic system design. The best developers use AI to explore alternative algorithms and spot overlooked edge cases while maintaining full command over system state.' }
          ],
          keyTakeaways: [
            'Human reasoning sets the requirements and evaluates output quality.',
            'Use AI to generate options, then evaluate trade-offs critically.'
          ]
        },
        {
          id: 'les-1-8',
          position: 8,
          title: 'Common Mistakes Beginners Make',
          slug: 'common-mistakes-beginners-make',
          level: 'beginner',
          durationMinutes: 12,
          objectives: [
            'Recognize top 10 beginner AI coding pitfalls.',
            'Avoid copy-pasting code without reading.',
            'Learn to debug AI outputs effectively.'
          ],
          content: [
            {
              type: 'checklist',
              title: 'Beginner Pitfalls Checklist',
              items: [
                { text: 'Copying code without reading or understanding every line', checked: false, category: 'Habits' },
                { text: 'Asking AI to write an entire complex system in one prompt', checked: false, category: 'Prompting' },
                { text: 'Ignoring compiler warnings and linter errors', checked: false, category: 'Verification' },
                { text: 'Not providing function types or interface context to AI', checked: false, category: 'Context' },
                { text: 'Trusting AI security defaults for password hashing or SQL', checked: false, category: 'Security' }
              ]
            }
          ],
          keyTakeaways: [
            'Break large problems into small verifiable modules.',
            'Always understand every line of code added to your codebase.'
          ]
        }
      ]
    },
    {
      id: 'sec-2-prompting',
      position: 2,
      title: 'Section 2 — Prompt Engineering for Coding',
      slug: 'prompt-engineering-for-coding',
      description: 'Master structured prompting techniques to generate clean, accurate, constraint-compliant code on the first attempt.',
      level: 'beginner',
      lessons: [
        {
          id: 'les-2-1',
          position: 1,
          title: 'What Makes a Good Coding Prompt?',
          slug: 'what-makes-a-good-coding-prompt',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Learn the universal prompt architecture: Context + Goal + Constraints + Input/Output + Format.',
            'Compare weak vague prompts with structured prompts.',
            'Eliminate ambiguous terminology in instructions.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'The Anatomy of a High-Precision Coding Prompt' },
            { type: 'paragraph', text: 'A good coding prompt leaves no room for ambiguous assumptions. It explicitly communicates the target environment, existing data structures, constraints, required imports, and expected return types.' },
            {
              type: 'workflow',
              title: 'Universal Prompt Structure',
              steps: [
                { number: 1, title: 'Role & Context', description: 'Tech stack, runtime, frameworks, and existing types.', badge: 'CONTEXT' },
                { number: 2, title: 'Goal', description: 'Single, explicit function or module specification.', badge: 'GOAL' },
                { number: 3, title: 'Constraints', description: 'Time/space complexity, error handling, immutability.', badge: 'CONSTRAINTS' },
                { number: 4, title: 'Input / Output', description: 'Sample inputs, expected output shapes, edge case examples.', badge: 'I/O' },
                { number: 5, title: 'Format', description: 'Pure code, JSDoc comments, unit tests included.', badge: 'FORMAT' }
              ]
            },
            {
              type: 'example',
              title: 'Weak vs Strong Prompt Comparison',
              description: 'Vague request vs structured specification',
              weakPrompt: 'Write a function to handle user login.',
              strongPrompt: `You are working on a Node.js + TypeScript backend with Express.\nWrite an async function 'handleUserLogin' that:\n- Accepts { email, password } from req.body.\n- Validates email with z.string().email().\n- Queries MongoDB User model using Mongoose.\n- Compares password with bcrypt.compare().\n- Returns JWT token if valid, or 401 JSON error on failure.\n- Include try/catch block and proper HTTP status codes.`,
              explanation: 'The strong prompt eliminates guesswork, forcing the AI to output production-ready TypeScript with proper validation and error handling.'
            }
          ],
          exercise: {
            id: 'ex-2-1',
            title: 'Exercise: Fix the Weak Prompt',
            exerciseType: 'prompt-improvement',
            description: 'Transform the weak prompt "Fix my array function" into a high-precision prompt.',
            scenario: 'You have a TypeScript function that throws a TypeError when given an empty array.',
            promptOrCode: 'Fix my array function, it throws an error on empty input.',
            choices: [
              'Make it work without errors.',
              'Debug this function: function average(nums: number[]): number { return nums.reduce((a,b)=>a+b)/nums.length; }. It returns NaN or throws when nums is empty. Update it to return 0 if nums.length === 0, add a TypeScript return type, and write a Jest test.',
              'Please rewrite the code to be better.',
              'AI please fix the bug.'
            ],
            correctAnswer: 1,
            explanation: 'Option 2 provides the exact code snippet, describes the exact failure condition, specifies the expected fix (return 0 for empty arrays), and asks for tests.'
          },
          quiz: {
            question: 'Which element is essential in a strong coding prompt to prevent AI hallucinations of non-existent packages?',
            options: [
              'Using polite words like "please" and "thank you".',
              'Explicitly specifying the exact tech stack, frameworks, and installed library versions.',
              'Asking the AI to write 1000 lines at once.',
              'Leaving input shapes unspecified.'
            ],
            answerIndex: 1,
            explanation: 'Specifying exact library versions and stack constraints keeps the model bounded within real exported signatures.'
          },
          keyTakeaways: [
            'Structure prompts using Context + Goal + Constraints + Input/Output + Format.',
            'Provide exact types, signatures, and edge case rules.',
            'Never leave runtime framework or library versions ambiguous.'
          ]
        },
        {
          id: 'les-2-2',
          position: 2,
          title: 'Giving AI Proper Context',
          slug: 'giving-ai-proper-context',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Learn how to supply relevant file snippets, interface definitions, and database schemas.',
            'Avoid context truncation and context clutter.',
            'Master system prompts and workspace rules.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Context is King' },
            { type: 'paragraph', text: 'AI models cannot see code outside their prompt context. If you reference `UserRecord` or `dbClient` without providing their definitions, the model will invent its own structure, causing type mismatches upon integration.' },
            {
              type: 'code',
              language: 'typescript',
              title: 'Example: Passing Interface Context to AI',
              code: `// Interface context provided in prompt:\nexport interface OrderItem {\n  productId: string;\n  quantity: number;\n  unitPriceCents: number;\n}\n\n// Prompt:\n// Generate a helper 'calculateOrderTotal(items: OrderItem[]): number' that calculates total in cents, applying 10% discount if total quantity > 5.`
            }
          ],
          keyTakeaways: [
            'Always paste relevant interfaces, types, and schemas before asking for functions.',
            'Include only necessary context to keep the model focused.'
          ]
        },
        {
          id: 'les-2-3',
          position: 3,
          title: 'Defining Requirements Clearly',
          slug: 'defining-requirements-clearly',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Translate product specs into technical prompt instructions.',
            'Specify immutability, pure functions, and side effects.',
            'Enforce functional and non-functional requirements.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Translating Specs to Prompts' },
            { type: 'paragraph', text: 'Clear requirements eliminate vague implementations. State whether functions must be pure, synchronous/asynchronous, immutable, or thread-safe.' }
          ],
          keyTakeaways: [
            'Be explicit about immutability and side effects.',
            'Differentiate core requirements from optional features.'
          ]
        },
        {
          id: 'les-2-4',
          position: 4,
          title: 'Specifying Input and Output',
          slug: 'specifying-input-and-output',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Specify exact JSON shapes, TypeScript interfaces, and SQL tables.',
            'Include concrete input/output example pairs in prompts.',
            'Guide AI on null/undefined edge handling.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Input / Output Examples (Few-Shot Prompting)' },
            { type: 'paragraph', text: 'Providing 1 or 2 concrete examples of inputs and expected outputs (few-shot prompting) dramatically reduces logic errors.' }
          ],
          keyTakeaways: [
            'Few-shot input/output examples clarify complex string/data manipulation logic.',
            'Specify handling for null, undefined, and empty collections.'
          ]
        },
        {
          id: 'les-2-5',
          position: 5,
          title: 'Constraints and Edge Cases',
          slug: 'constraints-and-edge-cases',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Define time/space complexity bounds (e.g. O(n) time, O(1) space).',
            'Specify boundary cases (empty arrays, negative numbers, overflow).',
            'Enforce zero-external-dependency constraints.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Bounding the Solution Space' },
            { type: 'paragraph', text: 'Without constraints, AI will default to the easiest solution—which might be O(n²) or require extra libraries. Always specify performance and environment boundaries.' }
          ],
          keyTakeaways: [
            'State asymptotic time and space requirements explicitly.',
            'List boundary inputs (0, empty, max value, special characters).'
          ]
        },
        {
          id: 'les-2-6',
          position: 6,
          title: 'Asking for Step-by-Step Reasoning',
          slug: 'asking-for-step-by-step-reasoning',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Apply Chain-of-Thought (CoT) prompting for complex algorithms.',
            'Verify algorithmic logic before code generation.',
            'Reduce logical fallacies in AI output.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Chain-of-Thought Prompting' },
            { type: 'paragraph', text: 'Asking the AI to "think step by step" or explain its approach before outputting code allows the transformer model to devote intermediate token computation to algorithmic logic, drastically lowering bug frequency.' }
          ],
          keyTakeaways: [
            'Use "Explain your logic step-by-step before writing code" for non-trivial algorithms.',
            'Review the intermediate reasoning to spot logical flaws early.'
          ]
        },
        {
          id: 'les-2-7',
          position: 7,
          title: 'Asking for Multiple Approaches',
          slug: 'asking-for-multiple-approaches',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Request Brute Force vs Optimized implementations.',
            'Compare memory vs speed trade-offs.',
            'Select the most maintainable pattern.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Exploring the Design Space' },
            { type: 'paragraph', text: 'Prompt AI to provide 2 or 3 distinct architectural options (e.g. Iterative vs Recursive vs Dynamic Programming), listing time/space complexities and trade-offs for each.' }
          ],
          keyTakeaways: [
            'Never settle for the first candidate solution.',
            'Evaluate trade-offs between readability, performance, and memory usage.'
          ]
        },
        {
          id: 'les-2-8',
          position: 8,
          title: 'Asking AI to Review Its Own Code',
          slug: 'asking-ai-to-review-its-own-code',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Apply reflection prompts to catch self-generated bugs.',
            'Prompt AI for edge-case and vulnerability audits.',
            'Conduct automated self-correction loops.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Self-Reflection Prompts' },
            { type: 'paragraph', text: 'Follow up code generation with: "Review the code above. Are there any edge cases where it fails? Is there any buffer overflow or null pointer dereference risk?" Models often catch their own mistakes when prompted to critique their prior output.' }
          ],
          keyTakeaways: [
            'Reflection prompts uncover edge-case oversights.',
            'Combine self-review with manual inspection.'
          ]
        },
        {
          id: 'les-2-9',
          position: 9,
          title: 'Iterative Prompting',
          slug: 'iterative-prompting',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Build complex features through conversational refinements.',
            'Maintain context across multiple prompt turns.',
            'Course-correct when AI diverges from intent.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Conversational Refinement' },
            { type: 'paragraph', text: 'Rather than trying to generate a 500-line module in one shot, build it iteratively: Step 1: Base interface; Step 2: Core algorithm; Step 3: Error handling; Step 4: Unit tests.' }
          ],
          keyTakeaways: [
            'Iterative prompting keeps code changes small and easily testable.',
            'Guide the AI step by step.'
          ]
        },
        {
          id: 'les-2-10',
          position: 10,
          title: 'Prompt Refinement',
          slug: 'prompt-refinement',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Diagnose why a prompt failed to produce expected results.',
            'Add missing constraints and types to steer the model.',
            'Refine prompts systematically.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Debugging Your Prompts' },
            { type: 'paragraph', text: 'When AI outputs incorrect code, do not just re-submit the same prompt hoping for a better roll. Identify what context or constraint was missing, update the prompt, and resubmit.' }
          ],
          keyTakeaways: [
            'Treat prompt failures as missing specification bugs.',
            'Add explicit anti-patterns (e.g. "Do NOT use nested loops").'
          ]
        },
        {
          id: 'les-2-11',
          position: 11,
          title: 'Common Bad Coding Prompts',
          slug: 'common-bad-coding-prompts',
          level: 'beginner',
          durationMinutes: 10,
          objectives: [
            'Recognize vague, contradictory, or over-broad prompts.',
            'Fix lazy prompts before execution.',
            'Avoid anti-patterns in prompting.'
          ],
          content: [
            {
              type: 'table',
              headers: ['Bad Prompt', 'Why It Fails', 'Improved Prompt'],
              rows: [
                ['"Make a website like Twitter"', 'Overwhelming scope, no stack, no context', '"Create a React component for a single tweet card with props for avatar, username, timestamp, and text."'],
                ['"Fix this error"', 'No code or stack trace provided', 'Pasting exact compiler error + file snippet + line number'],
                ['"Optimize my code"', 'No metric specified (speed vs memory)', '"Optimize this function for O(n) time complexity by replacing nested loop with a Map."']
              ]
            }
          ],
          keyTakeaways: [
            'Avoid lazy single-sentence prompts.',
            'Provide exact context, error messages, and targets.'
          ]
        },
        {
          id: 'les-2-12',
          position: 12,
          title: 'Prompt Templates for Developers',
          slug: 'prompt-templates-for-developers',
          level: 'beginner',
          durationMinutes: 12,
          objectives: [
            'Use reusable prompt templates for generation, debugging, refactoring, and testing.',
            'Standardize team prompting workflows.',
            'Accelerate daily engineering tasks.'
          ],
          content: [
            {
              type: 'code',
              language: 'markdown',
              title: 'Master Code Generation Template',
              code: `[ROLE & STACK]\nYou are an expert {{LANGUAGE/FRAMEWORK}} engineer.\n\n[GOAL]\nWrite a function/module named '{{NAME}}' that {{DESCRIPTION}}.\n\n[INPUT/OUTPUT]\nInput: {{INPUT_TYPE_OR_EXAMPLE}}\nOutput: {{OUTPUT_TYPE_OR_EXAMPLE}}\n\n[CONSTRAINTS]\n- Time Complexity: {{TIME_BOUND}}\n- Space Complexity: {{SPACE_BOUND}}\n- Dependencies: {{ALLOWED_LIBRARIES}}\n- Error Handling: {{ERROR_STRATEGY}}\n\n[FORMAT]\nReturn pure {{LANGUAGE}} code with JSDoc and 3 unit tests.`
            }
          ],
          keyTakeaways: [
            'Bookmark standard prompt templates for routine tasks.',
            'Share prompt templates with your engineering team for consistency.'
          ]
        }
      ]
    },
    {
      id: 'sec-3-codegen',
      position: 3,
      title: 'Section 3 — AI for Code Generation',
      slug: 'ai-for-code-generation',
      description: 'Master practical code generation across functions, classes, APIs, databases, React components, and backend services.',
      level: 'intermediate',
      lessons: [
        {
          id: 'les-3-1',
          position: 1,
          title: 'Generate a Function',
          slug: 'generate-a-function',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Generate pure, typed functions with input validation.',
            'Specify edge cases (null/undefined/empty).',
            'Include JSDoc and return type signatures.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Single Function Generation' },
            { type: 'paragraph', text: 'When generating standalone utility functions, require explicit return types, strict immutability, and boundary validation.' },
            {
              type: 'code',
              language: 'typescript',
              title: 'AI Generated Pure Utility Function',
              code: `/**\n * Formats a currency amount into localized string.\n * @param amountCents Amount in integer cents\n * @param currency ISO currency code (default USD)\n */\nexport function formatCurrency(amountCents: number, currency = 'USD'): string {\n  if (!Number.isInteger(amountCents)) {\n    throw new TypeError('Amount must be an integer in cents');\n  }\n  return new Intl.NumberFormat('en-US', {\n    style: 'currency',\n    currency,\n  }).format(amountCents / 100);\n}`
            }
          ],
          keyTakeaways: [
            'Always request explicit parameter types and return types.',
            'Include runtime assertions for invalid inputs.'
          ]
        },
        {
          id: 'les-3-2',
          position: 2,
          title: 'Generate a Class',
          slug: 'generate-a-class',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Generate OOP classes adhering to SOLID principles.',
            'Enforce encapsulation and interface implementation.',
            'Generate constructors and dependency injection.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Generating Encapsulated Classes' },
            { type: 'paragraph', text: 'Prompt AI to design classes with private/protected fields, immutable state where possible, and dependency injection for external services.' }
          ],
          keyTakeaways: [
            'Use interface abstractions to keep generated classes testable.',
            'Verify member variable visibility (private/public).'
          ]
        },
        {
          id: 'les-3-3',
          position: 3,
          title: 'Generate an API',
          slug: 'generate-an-api',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Generate RESTful endpoints with input validation and error responses.',
            'Apply proper HTTP status codes (200, 201, 400, 401, 404, 500).',
            'Include request payload schemas using Zod or Joi.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Generating Production-Ready API Endpoints' },
            { type: 'paragraph', text: 'A robust API prompt specifies route path, HTTP method, payload validation schema, authentication middleware, status codes, and error formatting.' },
            {
              type: 'code',
              language: 'typescript',
              title: 'Generated Express + Zod API Route',
              code: `import { Request, Response } from 'express';\nimport { z } from 'zod';\n\nconst CreateUserSchema = z.object({\n  email: z.string().email(),\n  name: z.string().min(2),\n});\n\nexport async function createUserHandler(req: Request, res: Response) {\n  const result = CreateUserSchema.safeParse(req.body);\n  if (!result.success) {\n    return res.status(400).json({ error: 'Validation failed', details: result.error.format() });\n  }\n  // Save user logic...\n  return res.status(201).json({ id: 'usr_123', email: result.data.email });\n}`
            }
          ],
          keyTakeaways: [
            'Always enforce strict schema validation on body/query parameters.',
            'Return standard JSON error responses with appropriate status codes.'
          ]
        },
        {
          id: 'les-3-4',
          position: 4,
          title: 'Generate Database Queries',
          slug: 'generate-database-queries',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Generate parameterized SQL and ORM queries (Prisma/Drizzle/Mongoose).',
            'Prevent SQL injection hazards.',
            'Optimize join conditions and indexes.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Safe Query Generation' },
            { type: 'warning', title: 'SQL Injection Warning', text: 'Never allow AI to concatenate raw string variables into SQL queries. Always enforce parameterized query bindings ($1, $2 or ORM abstractions).' }
          ],
          keyTakeaways: [
            'Verify that generated SQL uses parameter bindings.',
            'Check ORM query options to prevent N+1 query problems.'
          ]
        },
        {
          id: 'les-3-5',
          position: 5,
          title: 'Generate React Components',
          slug: 'generate-react-components',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Generate accessible, typed React functional components.',
            'Apply Tailwind CSS or CSS Modules styling.',
            'Handle loading, error, and empty component states.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'React & UI Component Generation' },
            { type: 'paragraph', text: 'Prompt AI for React components with explicit Props interfaces, hooks for local state, accessibility ARIA attributes, and explicit loading/error UI states.' }
          ],
          keyTakeaways: [
            'Specify accessibility (ARIA, semantic HTML) in your prompts.',
            'Request explicit loading and error states for async components.'
          ]
        },
        {
          id: 'les-3-6',
          position: 6,
          title: 'Generate Backend Services',
          slug: 'generate-backend-services',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Build modular backend service layers.',
            'Separate business logic from HTTP transport.',
            'Handle database transactions and retries.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Service Layer Architecture' },
            { type: 'paragraph', text: 'Keep route handlers slim by generating dedicated service classes or modules that encapsulate domain business logic and database interactions.' }
          ],
          keyTakeaways: [
            'Decouple business logic from HTTP framework handlers.',
            'Use dependency injection for database and logger instances.'
          ]
        },
        {
          id: 'les-3-7',
          position: 7,
          title: 'Generate Utility Functions',
          slug: 'generate-utility-functions',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Generate string parsing, date math, array manipulation utilities.',
            'Enforce pure stateless execution.',
            'Include comprehensive unit test suites.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Stateless Utilities' },
            { type: 'paragraph', text: 'Utility functions are ideal candidates for AI generation because their inputs and outputs can be completely isolated and tested automatically.' }
          ],
          keyTakeaways: [
            'Keep utilities pure and stateless.',
            'Pair every generated utility with an automated test.'
          ]
        },
        {
          id: 'les-3-8',
          position: 8,
          title: 'Generate Tests',
          slug: 'generate-tests-basics',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Generate Jest/Vitest/PyTest unit test suites.',
            'Test happy paths, edge cases, and throws/rejections.',
            'Mock external network and database calls.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Automated Test Suite Generation' },
            { type: 'paragraph', text: 'Provide the source implementation to AI and ask it to write unit tests covering: 1. Normal cases; 2. Boundary conditions; 3. Error throwing; 4. Null/undefined inputs.' }
          ],
          keyTakeaways: [
            'AI generates thorough test suites when given exact source code.',
            'Verify that generated tests actually pass when executed.'
          ]
        },
        {
          id: 'les-3-9',
          position: 9,
          title: 'Generate Configuration',
          slug: 'generate-configuration',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Generate Dockerfiles, GitHub Actions workflows, tsconfig.json, and CI/CD pipelines.',
            'Validate security and permissions in config files.',
            'Avoid root execution in containers.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'DevOps & Infra Config Generation' },
            { type: 'warning', title: 'Container Security Check', text: 'Check generated Dockerfiles to ensure they run as a non-root user and multi-stage builds are used to minimize image size.' }
          ],
          keyTakeaways: [
            'Inspect generated CI/CD YAML for exposed secret tokens.',
            'Use multi-stage Docker builds.'
          ]
        },
        {
          id: 'les-3-10',
          position: 10,
          title: 'Generate Complete Features',
          slug: 'generate-complete-features',
          level: 'intermediate',
          durationMinutes: 15,
          objectives: [
            'Orchestrate end-to-end feature generation incrementally.',
            'Combine frontend, API, database, and test layers.',
            'Maintain consistency across feature files.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Full-Stack Feature Generation' },
            { type: 'paragraph', text: 'To build a complete feature (e.g. Password Reset), break it down: 1. DB Migration -> 2. Service Logic -> 3. API Route -> 4. React Form -> 5. Integration Test.' }
          ],
          keyTakeaways: [
            'Never generate a full feature in a single massive prompt.',
            'Build incrementally layer by layer.'
          ]
        }
      ]
    },
    {
      id: 'sec-4-dsa',
      position: 4,
      title: 'Section 4 — AI for DSA',
      slug: 'ai-for-dsa',
      description: 'Master using AI to understand DSA problems, generate brute-force vs optimized solutions, analyze complexities, and practice interview questions responsibly.',
      level: 'intermediate',
      lessons: [
        {
          id: 'les-4-1',
          position: 1,
          title: 'Using AI to Understand a DSA Problem',
          slug: 'using-ai-to-understand-a-dsa-problem',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Prompt AI to break down complex DSA problem statements.',
            'Identify underlying pattern categories (Two Pointers, Sliding Window, DP, Graph).',
            'Ask AI for conceptual analogies before writing code.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Deconstructing DSA Problems' },
            { type: 'paragraph', text: 'When stuck on a DSA problem statement, ask the AI to explain the core mathematical pattern, constraints, and implicit assumptions without revealing the code solution.' },
            {
              type: 'code',
              language: 'markdown',
              title: 'DSA Conceptual Prompt',
              code: `Explain the core pattern of LeetCode 3 "Longest Substring Without Repeating Characters" conceptually.\nRequirements:\n- Do NOT write any code yet.\n- Explain why a Sliding Window with a Set/Map is optimal.\n- Show step-by-step state changes for input "abcabcbb".`
            }
          ],
          keyTakeaways: [
            'Ask for conceptual intuition before code generation.',
            'Identify the core algorithmic pattern first.'
          ]
        },
        {
          id: 'les-4-2',
          position: 2,
          title: 'Generate Brute Force Solution',
          slug: 'generate-brute-force-solution',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Generate baseline brute-force solutions to establish correct correctness behavior.',
            'Analyze brute-force time/space bottlenecks.',
            'Use brute-force code to generate test oracle expectations.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Starting with Brute Force' },
            { type: 'paragraph', text: 'Always start by prompting AI for a simple, readable brute-force solution. This establishes a working baseline and reference implementation for automated testing.' }
          ],
          keyTakeaways: [
            'Brute-force solutions serve as test oracles to verify optimized versions.',
            'Identify the exact bottleneck in the brute-force approach.'
          ]
        },
        {
          id: 'les-4-3',
          position: 3,
          title: 'Generate Optimized Solution',
          slug: 'generate-optimized-solution',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Transform brute-force O(n²) or O(2ⁿ) solutions to O(n log n) or O(n).',
            'Apply Hash Maps, Two Pointers, Monotonic Stacks, or Fast/Slow Pointers.',
            'Verify optimal space-time trade-offs.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Algorithmic Optimization' },
            {
              type: 'codeComparison',
              title: 'Brute Force vs Hash Map Optimization (Two Sum)',
              leftTitle: 'Brute Force O(n²)',
              rightTitle: 'Hash Map O(n)',
              leftLanguage: 'typescript',
              rightLanguage: 'typescript',
              leftCode: `function twoSum(nums: number[], target: number): number[] {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n  return [];\n}`,
              rightCode: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
              description: 'Replacing nested iteration with a Hash Map lookup reduces runtime complexity from quadratic to linear time.'
            }
          ],
          keyTakeaways: [
            'Hash maps trade O(n) space for O(n) time reduction.',
            'Verify index bounds and edge cases after optimization.'
          ]
        },
        {
          id: 'les-4-4',
          position: 4,
          title: 'Compare Multiple Approaches',
          slug: 'compare-multiple-approaches-dsa',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Compare dynamic programming vs recursion with memoization vs space-optimized iteration.',
            'Evaluate trade-offs in memory stack overhead.',
            'Select the optimal approach for production bounds.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Comparative Algorithm Analysis' },
            { type: 'paragraph', text: 'Prompt AI to output a comparison matrix comparing time complexity, space complexity, recursion stack risk, and implementation complexity across different approaches.' }
          ],
          keyTakeaways: [
            'Evaluate recursion stack limits for deep tree or graph traversals.',
            'Prefer iterative solutions when memory overhead is strict.'
          ]
        },
        {
          id: 'les-4-5',
          position: 5,
          title: 'Complexity Analysis',
          slug: 'complexity-analysis-with-ai',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Prompt AI to perform formal Big-O time and space complexity derivation.',
            'Verify loop invariant bounds and auxiliary space allocations.',
            'Spot hidden O(n) operations like string concatenation or Array.shift().'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Deriving Big-O Bounds' },
            { type: 'warning', title: 'Hidden Complexity Trap', text: 'Methods like `Array.prototype.shift()` or `String.substring()` inside a loop introduce implicit O(n) steps, turning apparent O(n) loops into O(n²).' }
          ],
          keyTakeaways: [
            'Ask AI to break down step-by-step Big-O for best, worst, and average cases.',
            'Watch out for hidden built-in array/string operation costs.'
          ]
        },
        {
          id: 'les-4-6',
          position: 6,
          title: 'Generate Test Cases',
          slug: 'generate-test-cases-dsa',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Generate edge cases (empty input, single element, duplicates, sorted, reverse sorted, negative numbers).',
            'Generate adversarial inputs to trigger TLE (Time Limit Exceeded).',
            'Use AI to generate comprehensive test tables.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Adversarial Test Generation' },
            { type: 'paragraph', text: 'Prompt AI: "Generate 8 edge-case inputs for this Graph BFS function, including disconnected graphs, cyclic graphs, single node, and large scale sparse graph."' }
          ],
          keyTakeaways: [
            'Test with minimum bounds, maximum bounds, duplicates, and empty inputs.',
            'Use adversarial test inputs to check for infinite loops.'
          ]
        },
        {
          id: 'les-4-7',
          position: 7,
          title: 'Debug DSA Solutions',
          slug: 'debug-dsa-solutions',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Fix off-by-one errors, index out of bounds, and incorrect pointer increments.',
            'Debug TLE (Time Limit Exceeded) and MLE (Memory Limit Exceeded).',
            'Debug recursion stack overflow.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Debugging Algorithmic Errors' },
            { type: 'paragraph', text: 'Pass the failing test case input, expected output, and actual received output to the AI assistant to pinpoint loop index bugs.' }
          ],
          keyTakeaways: [
            'Provide exact failing inputs to the AI assistant.',
            'Check array index bounds and loop termination conditions.'
          ]
        },
        {
          id: 'les-4-8',
          position: 8,
          title: 'Find Edge Cases',
          slug: 'find-edge-cases-dsa',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Prompt AI to analyze boundary conditions.',
            'Identify integer overflow in binary search (`mid = low + (high - low) / 2`).',
            'Handle null root nodes in binary trees.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Systematic Boundary Audits' },
            { type: 'paragraph', text: 'Ask AI specifically: "What boundary inputs will cause this algorithm to fail or throw an exception?"' }
          ],
          keyTakeaways: [
            'Check tree root null pointers, graph disconnected components, and integer overflow bounds.',
            'Always handle 0 and 1 element collection sizes.'
          ]
        },
        {
          id: 'les-4-9',
          position: 9,
          title: 'Optimize Time Complexity',
          slug: 'optimize-time-complexity',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Apply advanced data structures (Priority Queue/Heap, Trie, Segment Tree, Disjoint Set Union).',
            'Replace linear scans with Binary Search or Fast Hash Lookups.',
            'Apply Dynamic Programming tabulation.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Refactoring Algorithms for Speed' },
            { type: 'paragraph', text: 'Ask AI to replace linear searches with Binary Search or Map indexing to achieve O(log n) or O(1) lookups.' }
          ],
          keyTakeaways: [
            'Choosing the right data structure is key to time optimization.',
            'Benchmark optimized code against large input sets.'
          ]
        },
        {
          id: 'les-4-10',
          position: 10,
          title: 'Optimize Space Complexity',
          slug: 'optimize-space-complexity',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Convert O(n) DP tables to O(1) rolling state variables.',
            'Convert recursive DFS to iterative stack traversal.',
            'Perform in-place array/matrix modifications.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'In-Place & Memory Optimization' },
            {
              type: 'codeComparison',
              title: 'Fibonacci: O(n) Space DP vs O(1) Space Variables',
              leftTitle: 'O(n) Space Array',
              rightTitle: 'O(1) Space Variables',
              leftLanguage: 'typescript',
              rightLanguage: 'typescript',
              leftCode: `function fib(n: number): number {\n  if (n <= 1) return n;\n  const dp = [0, 1];\n  for (let i = 2; i <= n; i++) {\n    dp[i] = dp[i - 1] + dp[i - 2];\n  }\n  return dp[n];\n}`,
              rightCode: `function fib(n: number): number {\n  if (n <= 1) return n;\n  let prev2 = 0, prev1 = 1;\n  for (let i = 2; i <= n; i++) {\n    const curr = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = curr;\n  }\n  return prev1;\n}`,
              description: 'Replacing the full DP array with two state variables optimizes space complexity from O(n) to O(1).'
            }
          ],
          keyTakeaways: [
            'Reduce space by storing only the required previous state variables.',
            'Avoid deep recursive calls to prevent call stack overflow.'
          ]
        },
        {
          id: 'les-4-11',
          position: 11,
          title: 'Use AI Without Losing Problem-Solving Ability',
          slug: 'use-ai-without-losing-problem-solving-ability',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Practice Socratic AI prompting during interview prep.',
            'Ask for progressive hints instead of direct code solutions.',
            'Build muscle memory for technical assessments.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Responsible AI DSA Training' },
            { type: 'paragraph', text: 'During interview preparation, instruct the AI: "Act as a strict interview coach. Give me a progressive hint level 1 to 5 when I ask, but do NOT reveal the code solution unless I explicitly type \'solution\'."' },
            {
              type: 'workflow',
              title: 'Socratic Hinting Workflow',
              steps: [
                { number: 1, title: 'Level 1 Hint', description: 'High level conceptual topic (e.g. "Consider using Two Pointers").', badge: 'HINT 1' },
                { number: 2, title: 'Level 2 Hint', description: 'Data structure pointer strategy (e.g. "Place left pointer at start, right at end").', badge: 'HINT 2' },
                { number: 3, title: 'Level 3 Hint', description: 'Invariant condition explanation.', badge: 'HINT 3' },
                { number: 4, title: 'Level 4 Hint', description: 'Pseudocode outline.', badge: 'HINT 4' },
                { number: 5, title: 'Level 5 Solution', description: 'Full code implementation + complexity analysis.', badge: 'SOLUTION' }
              ]
            }
          ],
          keyTakeaways: [
            'Use Socratic progressive hints during practice so you build problem-solving skill.',
            'Never copy solutions without explaining the logic out loud.'
          ]
        }
      ]
    },
    {
      id: 'sec-5-debugging',
      position: 5,
      title: 'Section 5 — AI for Debugging',
      slug: 'ai-for-debugging',
      description: 'Master AI-assisted root cause analysis, stack trace diagnosis, compilation/runtime/logical error fixing, and minimal reproduction techniques.',
      level: 'intermediate',
      lessons: [
        {
          id: 'les-5-1',
          position: 1,
          title: 'Giving AI an Error Message',
          slug: 'giving-ai-an-error-message',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Pass error messages, surrounding code, and expected behavior to AI.',
            'Avoid sending truncated error messages.',
            'Include environment details (Node version, OS, framework version).'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Effective Error Debugging Prompts' },
            { type: 'paragraph', text: 'A complete error prompt contains: 1. Exact error text; 2. Failing code block; 3. Expected vs actual behavior; 4. Input that triggers the error.' },
            {
              type: 'code',
              language: 'markdown',
              title: 'Master Debugging Prompt Template',
              code: `[ERROR]\nTypeError: Cannot read properties of undefined (reading 'map')\n\n[FAILING CODE]\nfunction renderUserList(users?: User[]) {\n  return users.map(u => <li>{u.name}</li>);\n}\n\n[EXPECTED BEHAVIOR]\nShould render empty list or fallback message when users is undefined/null.\n\n[REQUEST]\nFix the function with optional chaining and default fallback, and explain why it failed.`
            }
          ],
          keyTakeaways: [
            'Provide error message + failing snippet + expected behavior.',
            'Specify fallback behavior for missing data.'
          ]
        },
        {
          id: 'les-5-2',
          position: 2,
          title: 'Giving AI a Stack Trace',
          slug: 'giving-ai-a-stack-trace',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Extract relevant application stack trace lines from framework noise.',
            'Identify origin frame vs library internal frame.',
            'Fix unhandled promise rejections.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Diagnosing Stack Traces' },
            { type: 'paragraph', text: 'When pasting long stack traces, highlight the top-most line originating from your own project code rather than `node_modules` internal frames.' }
          ],
          keyTakeaways: [
            'Locate the first application file frame in the stack trace.',
            'Provide surrounding lines of code for the stack trace origin.'
          ]
        },
        {
          id: 'les-5-3',
          position: 3,
          title: 'Debugging Compilation Errors',
          slug: 'debugging-compilation-errors',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Resolve TypeScript type mismatches, missing properties, and invalid generics.',
            'Fix C++/Java compiler errors.',
            'Understand strict type-checking flags.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Static & Compiler Errors' },
            { type: 'paragraph', text: 'Compiler errors are deterministic. Give AI the exact TypeScript compiler code (e.g. `TS2322`) and type definitions to receive instant type-guard fixes.' }
          ],
          keyTakeaways: [
            'Include full type definitions when solving TypeScript compiler errors.',
            'Use type guards or Zod parsing rather than casting with `as any`.'
          ]
        },
        {
          id: 'les-5-4',
          position: 4,
          title: 'Debugging Runtime Errors',
          slug: 'debugging-runtime-errors',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Fix NullPointerException, TypeError, Segfaults, and IndexOutOfBounds.',
            'Add defensive assertions and optional chaining.',
            'Prevent unhandled runtime exceptions.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Handling Runtime Crashes' },
            { type: 'paragraph', text: 'Runtime crashes occur due to missing safety checks. Prompt AI to introduce defensive guards and meaningful error messages.' }
          ],
          keyTakeaways: [
            'Add null guards and boundary checks.',
            'Log structured error context before throwing exceptions.'
          ]
        },
        {
          id: 'les-5-5',
          position: 5,
          title: 'Debugging Logical Errors',
          slug: 'debugging-logical-errors',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Fix silent bugs where code runs without throwing errors but yields incorrect output.',
            'Use trace tables and state logging.',
            'Verify business logic invariants.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Silent Logic Bugs' },
            { type: 'paragraph', text: 'Logical errors are the hardest to spot because no exception is thrown. Provide the AI with the input, actual output, and expected output to trace variable state transitions.' }
          ],
          keyTakeaways: [
            'State inputs, received outputs, and expected outputs explicitly.',
            'Ask AI to print a variable trace table for state changes.'
          ]
        },
        {
          id: 'les-5-6',
          position: 6,
          title: 'Debugging Wrong Answers',
          slug: 'debugging-wrong-answers',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Troubleshoot test case failures in practice problems.',
            'Identify boundary condition discrepancies.',
            'Compare expected vs actual output diffs.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Fixing Failing Test Cases' },
            { type: 'paragraph', text: 'Pass the exact failing test case input and output diff to AI to quickly locate off-by-one or comparison operator flaws.' }
          ],
          keyTakeaways: [
            'Isolate the minimal failing test case.',
            'Check for strict equality vs relational operators (`<` vs `<=`).'
          ]
        },
        {
          id: 'les-5-7',
          position: 7,
          title: 'Debugging Performance Issues',
          slug: 'debugging-performance-issues',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Fix high CPU usage, event loop blocking, and long-running loops.',
            'Replace linear scans with indexed lookups.',
            'Optimize asynchronous promise handling.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Performance Bottlenecks' },
            { type: 'paragraph', text: 'Prompt AI: "Analyze why this handler causes high CPU usage. Check for nested loops, synchronous I/O on main thread, or unindexed database queries."' }
          ],
          keyTakeaways: [
            'Avoid synchronous file/network I/O in event-driven servers.',
            'Replace sequential `await` calls in loops with `Promise.all()` where safe.'
          ]
        },
        {
          id: 'les-5-8',
          position: 8,
          title: 'Debugging Memory Problems',
          slug: 'debugging-memory-problems',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Identify memory leaks, uncleaned event listeners, and global cache buildup.',
            'Analyze heap snapshots and retainers.',
            'Fix memory leaks in Node.js and React components.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Memory Leak Diagnosis' },
            { type: 'paragraph', text: 'Common causes: 1. `useEffect` without cleanup function; 2. Unbounded global arrays/maps acting as caches; 3. Detached DOM nodes.' }
          ],
          keyTakeaways: [
            'Always clean up event listeners, timers, and subscriptions.',
            'Use LRU caches with maximum item limits instead of unbounded objects.'
          ]
        },
        {
          id: 'les-5-9',
          position: 9,
          title: 'Debugging With Minimal Reproduction',
          slug: 'debugging-with-minimal-reproduction',
          level: 'intermediate',
          durationMinutes: 10,
          objectives: [
            'Create minimal reproducible examples (MREs) for complex bug prompts.',
            'Isolate framework noise from core bug logic.',
            'Speed up AI diagnostic accuracy.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Minimal Reproducible Examples (MRE)' },
            { type: 'paragraph', text: 'Strip away unrelated UI styling, routes, and extra parameters until only 10-20 lines containing the bug remain. Paste this MRE into the AI assistant.' }
          ],
          keyTakeaways: [
            'Minimal code leads to maximum AI accuracy.',
            'Isolating bugs into pure functions makes root cause obvious.'
          ]
        },
        {
          id: 'les-5-10',
          position: 10,
          title: 'AI-Assisted Root Cause Analysis',
          slug: 'ai-assisted-root-cause-analysis',
          level: 'intermediate',
          durationMinutes: 12,
          objectives: [
            'Perform Root Cause Analysis (RCA) across multi-service errors.',
            'Identify systemic race conditions and state corruption.',
            'Generate permanent regression prevention fixes.'
          ],
          content: [
            { type: 'heading', level: 2, text: 'Root Cause Analysis Workflow' },
            { type: 'paragraph', text: 'Do not just fix the symptom. Ask AI: "What is the underlying root cause of this race condition, and how do we refactor the data flow to structurally prevent it from occurring again?"' }
          ],
          keyTakeaways: [
            'Fix the underlying structural flaw, not just the symptom.',
            'Write a regression unit test for every bug fix.'
          ]
        }
      ]
    }
  ]
}

console.log('Validating baseline curriculum structure...')
const res = validateAiCodingContentData(fullCurriculum)
console.log('Validation status:', res)
