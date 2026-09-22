"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  FileCode2,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Question {
  id: string;
  position: number;
  prompt: string;
  kind: string;
  content: Record<string, unknown>;
  explanation: string | null;
  options: Array<{
    id: string;
    label: string;
    value: string;
    isCorrect: boolean;
  }>;
}

interface CodingProblem {
  id: string;
  practiceSetId: string | null;
  slug: string;
  title: string;
  statement: string;
  difficulty: string;
  topic?: string | null;
  position?: number;
  marks?: number;
  languages: string[];
  starterCode: Record<string, string>;
  buggyCode: Record<string, string>;
  explanation?: string | null;
  testCases: Array<{
    name: string;
    stdin: string;
    expectedOutput: string;
    hidden: boolean;
  }>;
}

interface PracticeSet {
  id: string;
  setNumber: number;
  name: string;
  access: "free" | "premium";
  type: "focused" | "mixed" | "mock" | "daily";
  attemptLimit: number | null;
  status: "draft" | "published";
  category: string | null;
  difficulty: string | null;
  durationMinutes: number | null;
  totalMarks: number | null;
  availableDate: string | null;
  questions: Question[];
  codingProblems?: CodingProblem[];
}

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  learningSections: Array<{
    id: string;
    position: number;
    title: string;
    summary: string;
    content: string;
    durationMinutes: number;
    access: "free" | "premium";
  }>;
  sets: PracticeSet[];
}

interface AdminData {
  modules: Module[];
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: "student" | "admin";
    plan: "free" | "premium";
    createdAt: string;
  }>;
  offers: Array<{
    id: string;
    name: string;
    description: string | null;
    amountPaise: number;
    currency: string;
    active: boolean;
  }>;
  plans: Array<{
    id: string;
    slug: "free" | "premium";
    displayName: string;
    practiceSetAccessLimit: number | null;
    mockAccessLimit: number | null;
    dailyAccessLimit: number | null;
    unlimitedAttempts: boolean;
    aiAnalysis: boolean;
    aiAnalysisDailyLimit: number | null;
    aiCoachDailyLimit: number | null;
    pricePaise: number;
  }>;
  codingProblems: CodingProblem[];
  counts: {
    modules: number;
    sets: number;
    questions: number;
    users: number;
    payments: number;
    codingProblems: number;
  };
}

const emptyData: AdminData = {
  modules: [],
  users: [],
  offers: [],
  plans: [],
  codingProblems: [],
  counts: { modules: 0, sets: 0, questions: 0, users: 0, payments: 0, codingProblems: 0 },
};
type AdminResponse = { data: AdminData; error?: string };

export default function AdminPage() {
  const [data, setData] = useState<AdminData>(emptyData);
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [keyError, setKeyError] = useState("");

  function readStoredKey() {
    if (typeof window === "undefined") return "";
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("key") ?? params.get("adminKey") ?? "";
      const fromStorage = window.localStorage.getItem("admin_key") ?? "";
      return (fromUrl || fromStorage).trim();
    } catch {
      return "";
    }
  }

  function persistKey(value: string) {
    try {
      if (value) {
        window.localStorage.setItem("admin_key", value);
        document.cookie = `admin_key=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } else {
        window.localStorage.removeItem("admin_key");
        document.cookie = "admin_key=; path=/; max-age=0; SameSite=Lax";
      }
    } catch {
      // storage unavailable
    }
  }

  function authHeaders(): Record<string, string> {
    return adminKey ? { "x-admin-key": adminKey } : {};
  }

  function withKey(payload: Record<string, unknown>) {
    return adminKey ? { ...payload, adminKey } : payload;
  }

  const [tab, setTab] = useState<"catalog" | "debugging" | "users" | "offers">("catalog");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [moduleForm, setModuleForm] = useState({ name: "", slug: "", description: "" });
  const [setForm, setSetForm] = useState({
    moduleId: "",
    name: "",
    setNumber: "1",
    type: "focused",
    access: "free",
    attemptLimit: null as number | null,
    availableDate: null as string | null,
    durationMinutes: null as number | null,
    totalMarks: null as number | null,
  });

  const [debuggingSetForm, setDebuggingSetForm] = useState({
    name: "",
    setNumber: "",
    type: "focused",
    access: "free",
    difficulty: "medium",
    durationMinutes: "20",
    attemptLimit: null as number | null,
    status: "published" as "draft" | "published",
  });

  const [questionForm, setQuestionForm] = useState({
    practiceSetId: "",
    prompt: "",
    kind: "mcq",
    position: "1",
    topic: "AI Fundamentals",
    content: '{"topic":"AI Fundamentals","answerType":"single_choice"}',
    explanation: "",
    options: [
      { label: "A", value: "", isCorrect: false },
      { label: "B", value: "", isCorrect: true },
      { label: "C", value: "", isCorrect: false },
      { label: "D", value: "", isCorrect: false },
    ] as Array<{ label: string; value: string; isCorrect: boolean }>,
  });

  const [bulkQuestionForm, setBulkQuestionForm] = useState({
    practiceSetId: "",
    questions: '[\n  {\n    "position": 1,\n    "prompt": "Which component in an LLM system determines context window size?",\n    "kind": "mcq",\n    "content": {\n      "topic": "LLM Concepts",\n      "answerType": "single_choice"\n    },\n    "explanation": "Context window limits are defined by the model architecture and positional embeddings.",\n    "options": [\n      { "label": "A", "value": "Tokenizer dictionary size", "isCorrect": false },\n      { "label": "B", "value": "Positional embeddings and model architecture", "isCorrect": true },\n      { "label": "C", "value": "Sampling temperature", "isCorrect": false },\n      { "label": "D", "value": "System prompt length", "isCorrect": false }\n    ]\n  }\n]',
  });

  // Debugging & Coding Problem Form State
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<string>("python");
  const [testLang, setTestLang] = useState<string>("python");
  const [testRunning, setTestRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<any>(null);

  const [codingProblemForm, setCodingProblemForm] = useState({
    practiceSetId: "",
    slug: "",
    title: "",
    statement: "",
    topic: "Arrays · Boundary",
    difficulty: "easy",
    marks: 10,
    position: 1,
    languages: ["c", "cpp", "java", "python", "javascript"] as string[],
    starterCode: {
      c: "// C Starter Code\n",
      cpp: "// C++ Starter Code\n",
      java: "public class Solution {\n    public static void main(String[] args) {}\n}\n",
      python: "# Python Starter Code\n",
      javascript: "// JS Starter Code\n",
    } as Record<string, string>,
    buggyCode: {
      c: "// C Buggy Code\n",
      cpp: "// C++ Buggy Code\n",
      java: "// Java Buggy Code\n",
      python: "# Python Buggy Code\n",
      javascript: "// JS Buggy Code\n",
    } as Record<string, string>,
    explanation: "",
    testCases: [
      { name: "Sample Test 1", stdin: "5\n3 8 2 15 6", expectedOutput: "15", hidden: false },
      { name: "Hidden Test 1", stdin: "1\n42", expectedOutput: "42", hidden: true },
    ] as Array<{ name: string; stdin: string; expectedOutput: string; hidden: boolean }>,
  });

  const debuggingModule = data.modules.find((m) => m.slug === "debugging");
  const debuggingSets = debuggingModule?.sets || [];

  function selectedSetModuleSlug(practiceSetId: string): string | null {
    if (!practiceSetId) return null;
    for (const module of data.modules) {
      if (module.sets.some((set) => set.id === practiceSetId)) return module.slug;
    }
    return null;
  }

  function checkTechnicalQuestionForm(): string | null {
    if (selectedSetModuleSlug(questionForm.practiceSetId) !== "technical") return null;
    if (questionForm.kind !== "mcq") return "Technical module only allows kind=mcq.";
    if (questionForm.options.length !== 4) return "Technical MCQ must have exactly 4 options (A, B, C, D).";
    const labels = questionForm.options.map((o) => o.label);
    if (!["A", "B", "C", "D"].every((l) => labels.includes(l))) return "Technical MCQ options must be labeled A, B, C, D.";
    if (questionForm.options.filter((o) => o.isCorrect).length !== 1) return "Technical MCQ must have exactly 1 correct option.";
    return null;
  }

  async function load(providedKey?: string) {
    const key = (providedKey ?? adminKey).trim();
    setLoading(true);
    setError("");
    setKeyError("");
    const adminResponse = await fetch("/api/admin", {
      cache: "no-store",
      headers: key ? { "x-admin-key": key } : {},
    });
    const result = (await adminResponse.json()) as AdminData & { error?: string };
    if (!adminResponse.ok) {
      if (adminResponse.status === 403) {
        setUnlocked(false);
        setKeyError(result.error ?? "Invalid admin key.");
      } else {
        setError(result.error ?? "Unable to load admin panel.");
      }
    } else {
      setData(result);
      setUnlocked(true);
      setMessage("");
      if (key && key !== adminKey) setAdminKey(key);
      persistKey(key);
    }
    setLoading(false);
  }

  useEffect(() => {
    const stored = readStoredKey();
    if (stored) {
      setAdminKey(stored);
      void load(stored);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    await load(adminKey);
  }

  function lock() {
    persistKey("");
    setAdminKey("");
    setUnlocked(false);
    setData(emptyData);
    setError("");
    setKeyError("");
  }

  async function save(payload: Record<string, unknown>) {
    setMessage("");
    setError("");
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(withKey(payload)),
    });
    const result = (await response.json()) as AdminResponse;
    if (!response.ok) {
      setError(result.error ?? "Unable to save changes.");
      return false;
    }
    setData(result.data);
    setMessage("Saved successfully.");
    return true;
  }

  async function remove(
    resource: "module" | "learning-section" | "set" | "question" | "offer" | "coding-problem",
    id: string,
  ) {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    const response = await fetch("/api/admin", {
      method: "DELETE",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(withKey({ resource, id })),
    });
    const result = (await response.json()) as AdminResponse;
    if (!response.ok) setError(result.error ?? "Unable to delete item.");
    else {
      setData(result.data);
      setMessage("Deleted successfully.");
    }
  }

  async function createSet(event: React.FormEvent) {
    event.preventDefault();
    if (
      await save({
        action: "create-set",
        ...setForm,
        setNumber: Number(setForm.setNumber),
      })
    )
      setSetForm({ ...setForm, name: "" });
  }

  async function createDebuggingSet(event: React.FormEvent) {
    event.preventDefault();
    if (!debuggingSetForm.name.trim()) {
      setError("Set name is required.");
      return;
    }

    const setNum = debuggingSetForm.setNumber ? Number(debuggingSetForm.setNumber) : undefined;

    const payload = {
      action: "create-set",
      moduleId: debuggingModule?.id ?? undefined,
      slug: "debugging",
      setNumber: setNum,
      name: debuggingSetForm.name.trim(),
      type: debuggingSetForm.type,
      access: debuggingSetForm.access,
      setDifficulty: debuggingSetForm.difficulty,
      setDurationMinutes: Number(debuggingSetForm.durationMinutes) || 20,
      attemptLimit: debuggingSetForm.attemptLimit,
      setStatus: debuggingSetForm.status,
    };

    if (await save(payload)) {
      setDebuggingSetForm({
        name: "",
        setNumber: "",
        type: "focused",
        access: "free",
        difficulty: "medium",
        durationMinutes: "20",
        attemptLimit: null,
        status: "published",
      });
    }
  }

  async function createQuestion(event: React.FormEvent) {
    event.preventDefault();
    if (!questionForm.practiceSetId) {
      setError("Please choose a practice set.");
      return;
    }
    if (!questionForm.prompt.trim()) {
      setError("Question prompt is required.");
      return;
    }

    const technicalCheck = checkTechnicalQuestionForm();
    if (technicalCheck) {
      setError(technicalCheck);
      return;
    }

    let content: Record<string, unknown> = {};
    try {
      content = JSON.parse(questionForm.content);
    } catch {
      content = { topic: questionForm.topic || "General", answerType: "single_choice" };
    }

    const payload = {
      action: "create-question",
      practiceSetId: questionForm.practiceSetId,
      position: Number(questionForm.position),
      prompt: questionForm.prompt,
      kind: questionForm.kind,
      content,
      explanation: questionForm.explanation,
      options: questionForm.options,
    };

    if (await save(payload)) {
      setQuestionForm({
        ...questionForm,
        prompt: "",
        position: String(Number(questionForm.position) + 1),
        explanation: "",
        options: [
          { label: "A", value: "", isCorrect: false },
          { label: "B", value: "", isCorrect: true },
          { label: "C", value: "", isCorrect: false },
          { label: "D", value: "", isCorrect: false },
        ],
      });
    }
  }

  async function createBulkQuestions(event: React.FormEvent) {
    event.preventDefault();
    if (!bulkQuestionForm.practiceSetId) {
      setError("Please choose a practice set for bulk import.");
      return;
    }
    let parsedQuestions: any[] = [];
    try {
      parsedQuestions = JSON.parse(bulkQuestionForm.questions);
      if (!Array.isArray(parsedQuestions)) {
        setError("Bulk JSON must be an array of question objects.");
        return;
      }
    } catch {
      setError("Invalid JSON format. Check syntax and try again.");
      return;
    }

    const payload = {
      action: "bulk-create-questions",
      practiceSetId: bulkQuestionForm.practiceSetId,
      questions: parsedQuestions,
    };

    if (await save(payload)) {
      setMessage(`Successfully imported ${parsedQuestions.length} questions!`);
    }
  }

  function loadSampleBulkJson() {
    setBulkQuestionForm({
      ...bulkQuestionForm,
      questions: JSON.stringify(
        [
          {
            position: 1,
            prompt: "Which technique is most effective to ensure an LLM produces structured JSON output?",
            kind: "mcq",
            content: {
              topic: "Prompt Engineering",
              answerType: "single_choice"
            },
            explanation: "Providing a JSON schema in the prompt along with system constraints forces the model to adhere to the required output format.",
            options: [
              { label: "A", value: "Ask the model open-ended questions", isCorrect: false },
              { label: "B", value: "Specify the exact JSON schema and output constraints", isCorrect: true },
              { label: "C", value: "Increase the sampling temperature to max", isCorrect: false },
              { label: "D", value: "Omit instructions and rely on default behavior", isCorrect: false }
            ]
          },
          {
            position: 2,
            prompt: "What is the primary risk of relying on an LLM for factual claims without verification?",
            kind: "mcq",
            content: {
              topic: "Responsible AI",
              answerType: "single_choice"
            },
            explanation: "LLMs predict likely next tokens rather than retrieving facts from a real-time database, making hallucination a key risk.",
            options: [
              { label: "A", value: "High latency during generation", isCorrect: false },
              { label: "B", value: "Model hallucinations presenting plausible falsehoods", isCorrect: true },
              { label: "C", value: "Excessive API token costs", isCorrect: false },
              { label: "D", value: "Incompatibility with web browsers", isCorrect: false }
            ]
          }
        ],
        null,
        2
      ),
    });
  }

  async function runAdminCompilerTest() {
    setTestRunning(true);
    setTestOutput(null);
    setError("");
    try {
      const codeToTest = codingProblemForm.buggyCode[testLang] || codingProblemForm.starterCode[testLang] || "";
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders() },
        body: JSON.stringify(
          withKey({
            action: "test-coding-problem",
            language: testLang,
            sourceCode: codeToTest,
            testCases: codingProblemForm.testCases,
          }),
        ),
      });
      const resData = await response.json();
      if (!response.ok) {
        setError(resData.error || "Compiler test failed.");
      } else {
        setTestOutput(resData);
      }
    } catch {
      setError("Compiler test execution error.");
    } finally {
      setTestRunning(false);
    }
  }

  async function saveCodingProblemForm(event: React.FormEvent) {
    event.preventDefault();
    if (!codingProblemForm.practiceSetId) {
      setError("Choose a practice set for this coding problem.");
      return;
    }
    if (!codingProblemForm.title.trim() || !codingProblemForm.statement.trim()) {
      setError("Title and problem statement are required.");
      return;
    }
    if (codingProblemForm.languages.length === 0) {
      setError("Select at least one supported language.");
      return;
    }
    if (codingProblemForm.testCases.length === 0) {
      setError("Add at least one test case.");
      return;
    }

    const slug = codingProblemForm.slug.trim() || codingProblemForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const action = editingProblemId ? "update-coding-problem" : "create-coding-problem";

    const payload = {
      action,
      ...(editingProblemId ? { id: editingProblemId } : {}),
      practiceSetId: codingProblemForm.practiceSetId,
      slug,
      name: codingProblemForm.title,
      statement: codingProblemForm.statement,
      topic: codingProblemForm.topic,
      difficulty: codingProblemForm.difficulty,
      marks: Number(codingProblemForm.marks),
      position: Number(codingProblemForm.position),
      languages: codingProblemForm.languages,
      starterCode: codingProblemForm.starterCode,
      buggyCode: codingProblemForm.buggyCode,
      explanation: codingProblemForm.explanation,
      testCases: codingProblemForm.testCases,
    };

    if (await save(payload)) {
      setEditingProblemId(null);
      setCodingProblemForm({
        practiceSetId: codingProblemForm.practiceSetId,
        slug: "",
        title: "",
        statement: "",
        topic: "Arrays · Boundary",
        difficulty: "easy",
        marks: 10,
        position: codingProblemForm.position + 1,
        languages: ["c", "cpp", "java", "python", "javascript"],
        starterCode: {},
        buggyCode: {},
        explanation: "",
        testCases: [
          { name: "Sample Test 1", stdin: "5\n3 8 2 15 6", expectedOutput: "15", hidden: false },
          { name: "Hidden Test 1", stdin: "1\n42", expectedOutput: "42", hidden: true },
        ],
      });
      setTestOutput(null);
    }
  }

  function editProblem(prob: CodingProblem) {
    setEditingProblemId(prob.id);
    setCodingProblemForm({
      practiceSetId: prob.practiceSetId || "",
      slug: prob.slug,
      title: prob.title,
      statement: prob.statement,
      topic: prob.topic || "Debugging",
      difficulty: prob.difficulty || "easy",
      marks: prob.marks || 10,
      position: prob.position || 1,
      languages: prob.languages || ["python"],
      starterCode: prob.starterCode || {},
      buggyCode: prob.buggyCode || {},
      explanation: prob.explanation || "",
      testCases: prob.testCases || [],
    });
    setTab("debugging");
  }

  async function duplicateProblem(id: string) {
    await save({ action: "duplicate-coding-problem", id });
  }

  return (
    <div className="admin-container min-h-screen p-6 bg-background text-foreground">
      {!unlocked ? (
        <div className="max-w-md mx-auto mt-20 p-6 border border-line rounded-2xl bg-card shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel Access</h1>
          </div>
          {keyError && <p className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">{keyError}</p>}
          <form onSubmit={(e) => void unlock(e)} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Enter ADMIN_SECRET_KEY"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="p-3 border border-line rounded-xl text-sm bg-background"
            />
            <button className="primary-button p-3 text-sm font-semibold rounded-xl">Unlock Admin Panel</button>
          </form>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between pb-6 mb-6 border-b border-line">
            <div>
              <p className="eyebrow">Admin Dashboard</p>
              <h1 className="text-2xl font-bold">PrepVvise Content & Lab Management</h1>
            </div>
            <button className="secondary-button text-xs" onClick={lock}>Lock Session</button>
          </header>

          {message && <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg mb-4">{message}</div>}
          {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">{error}</div>}

          <nav className="flex gap-2 mb-6 border-b border-line pb-2">
            <button className={`admin-tab ${tab === "catalog" ? "active" : ""}`} onClick={() => setTab("catalog")}>
              <BookOpen className="w-4 h-4" /> MCQ Catalog
            </button>
            <button className={`admin-tab ${tab === "debugging" ? "active" : ""}`} onClick={() => setTab("debugging")}>
              <Code2 className="w-4 h-4" /> Debugging Lab Admin
            </button>
            <button className={`admin-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
              <Users className="w-4 h-4" /> Users & Plans
            </button>
            <button className={`admin-tab ${tab === "offers" ? "active" : ""}`} onClick={() => setTab("offers")}>
              <Tag className="w-4 h-4" /> Offers
            </button>
          </nav>

          {tab === "catalog" && (
            <div className="admin-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-6">
                <div className="p-5 border border-line rounded-2xl bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="eyebrow">MCQ Catalog Management</p>
                      <h2 className="text-lg font-bold">Modules & Practice Sets</h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.modules.map((module) => (
                      <article className="border border-line rounded-xl bg-background overflow-hidden" key={module.id}>
                        <button
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-card/50 transition-colors"
                          onClick={() => setExpanded(expanded === module.id ? null : module.id)}
                        >
                          <div>
                            <strong className="text-sm font-bold">{module.name}</strong>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {module.slug} · {module.sets.length} practice sets
                            </p>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expanded === module.id ? "rotate-180" : ""}`} />
                        </button>

                        {expanded === module.id && (
                          <div className="p-4 border-t border-line space-y-3 bg-card/30">
                            {module.sets.map((set) => (
                              <div className="p-3 border border-line rounded-lg bg-background" key={set.id}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <strong className="text-xs font-semibold">
                                      Set {String(set.setNumber).padStart(2, "0")} · {set.name}
                                    </strong>
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                      ({set.type} · {set.access.toUpperCase()} · {set.questions.length} questions)
                                    </span>
                                  </div>
                                  <button
                                    className="text-red-500 hover:underline text-xs"
                                    onClick={() => remove("set", set.id)}
                                  >
                                    Delete Set
                                  </button>
                                </div>

                                {set.questions.length > 0 && (
                                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                                    {set.questions.map((question) => (
                                      <div className="p-2 border border-line/60 rounded bg-card text-xs flex items-center justify-between gap-2" key={question.id}>
                                        <div className="truncate">
                                          <b>#{question.position}</b> {question.prompt}
                                          {question.explanation && <span className="text-[10px] text-green-600 block truncate">Explanation: {question.explanation}</span>}
                                        </div>
                                        <button
                                          className="text-red-500 hover:underline text-[11px] shrink-0"
                                          onClick={() => remove("question", question.id)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                {/* Form 1: Add Practice Set */}
                <form onSubmit={createSet} className="p-5 border border-line rounded-2xl bg-card space-y-3 text-xs">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Practice Set
                  </h3>
                  <select
                    required
                    value={setForm.moduleId}
                    onChange={(e) => setSetForm({ ...setForm, moduleId: e.target.value })}
                    className="w-full p-2 border border-line rounded-lg bg-background"
                  >
                    <option value="">Select Module</option>
                    {data.modules.map((module) => (
                      <option key={module.id} value={module.id}>{module.name}</option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder="Set Name (e.g. AI Fundamentals)"
                    value={setForm.name}
                    onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                    className="w-full p-2 border border-line rounded-lg bg-background"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Set Number"
                      value={setForm.setNumber}
                      onChange={(e) => setSetForm({ ...setForm, setNumber: e.target.value })}
                      className="p-2 border border-line rounded-lg bg-background"
                    />
                    <select
                      value={setForm.access}
                      onChange={(e) => setSetForm({ ...setForm, access: e.target.value })}
                      className="p-2 border border-line rounded-lg bg-background"
                    >
                      <option value="free">Free Access</option>
                      <option value="premium">Premium Only</option>
                    </select>
                  </div>
                  <button className="primary-button w-full py-2">Create Practice Set</button>
                </form>

                {/* Form 2: Add Single MCQ Question */}
                <form onSubmit={createQuestion} className="p-5 border border-line rounded-2xl bg-card space-y-3 text-xs">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add MCQ Question (Single)
                  </h3>
                  <select
                    required
                    value={questionForm.practiceSetId}
                    onChange={(e) => setQuestionForm({ ...questionForm, practiceSetId: e.target.value })}
                    className="w-full p-2 border border-line rounded-lg bg-background"
                  >
                    <option value="">Select Practice Set</option>
                    {data.modules.flatMap((m) => m.sets.map((s) => (
                      <option key={s.id} value={s.id}>{m.name} · Set {s.setNumber} ({s.name})</option>
                    )))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Position"
                      value={questionForm.position}
                      onChange={(e) => setQuestionForm({ ...questionForm, position: e.target.value })}
                      className="p-2 border border-line rounded-lg bg-background"
                    />
                    <input
                      placeholder="Topic (e.g. Prompt Engineering)"
                      value={questionForm.topic}
                      onChange={(e) => {
                        const top = e.target.value;
                        setQuestionForm({
                          ...questionForm,
                          topic: top,
                          content: JSON.stringify({ topic: top || "General", answerType: "single_choice" }),
                        });
                      }}
                      className="p-2 border border-line rounded-lg bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Question Statement / Prompt</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter question statement..."
                      value={questionForm.prompt}
                      onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                      className="w-full p-2 border border-line rounded-lg bg-background font-sans"
                    />
                  </div>

                  <div className="space-y-2 border-t border-b border-line py-2 my-2">
                    <label className="font-semibold block">MCQ Options (Select 1 correct answer)</label>
                    {questionForm.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-bold w-4 text-center">{opt.label}</span>
                        <input
                          required
                          placeholder={`Option ${opt.label} text`}
                          value={opt.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestionForm({
                              ...questionForm,
                              options: questionForm.options.map((o, i) => (i === idx ? { ...o, value: val } : o)),
                            });
                          }}
                          className="w-full p-1.5 border border-line rounded bg-background"
                        />
                        <label className="flex items-center gap-1 cursor-pointer shrink-0 text-[11px]">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() => {
                              setQuestionForm({
                                ...questionForm,
                                options: questionForm.options.map((o, i) => ({ ...o, isCorrect: i === idx })),
                              });
                            }}
                          />
                          Correct
                        </label>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Explanation of Correct Answer</label>
                    <textarea
                      rows={2}
                      placeholder="Explain why the correct answer is right..."
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      className="w-full p-2 border border-line rounded-lg bg-background"
                    />
                  </div>

                  <button className="primary-button w-full py-2">Create MCQ Question</button>
                </form>

                {/* Form 3: Bulk Questions Importer (JSON Format) */}
                <form onSubmit={createBulkQuestions} className="p-5 border border-line rounded-2xl bg-card space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Import Questions (JSON)
                    </h3>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-semibold"
                      onClick={loadSampleBulkJson}
                    >
                      Load Sample Template
                    </button>
                  </div>

                  <select
                    required
                    value={bulkQuestionForm.practiceSetId}
                    onChange={(e) => setBulkQuestionForm({ ...bulkQuestionForm, practiceSetId: e.target.value })}
                    className="w-full p-2 border border-line rounded-lg bg-background"
                  >
                    <option value="">Select Practice Set</option>
                    {data.modules.flatMap((m) => m.sets.map((s) => (
                      <option key={s.id} value={s.id}>{m.name} · Set {s.setNumber} ({s.name})</option>
                    )))}
                  </select>

                  <textarea
                    required
                    rows={8}
                    className="w-full p-2 border border-line rounded-lg bg-background font-mono text-[11px]"
                    value={bulkQuestionForm.questions}
                    onChange={(e) => setBulkQuestionForm({ ...bulkQuestionForm, questions: e.target.value })}
                    placeholder="Paste array of JSON question objects..."
                  />

                  <p className="text-[11px] text-muted-foreground">
                    Import multiple questions at once. Each question supports prompt, topic, options (A–D with 1 correct), and explanation.
                  </p>

                  <button className="primary-button w-full py-2">Import Questions JSON</button>
                </form>
              </aside>
            </div>
          )}

          {tab === "debugging" && (
            <div className="admin-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-6">
                <div className="p-5 border border-line rounded-2xl bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="eyebrow">Debugging Module</p>
                      <h2 className="text-lg font-bold">Practice Sets ({debuggingSets.length})</h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {debuggingSets.map((set) => (
                      <div key={set.id} className="p-4 border border-line rounded-xl bg-background">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <strong>Set {String(set.setNumber).padStart(2, "0")} · {set.name}</strong>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                              <span>{set.access.toUpperCase()}</span>
                              <span>· {set.status.toUpperCase()}</span>
                              <span>· {set.durationMinutes || 20} mins</span>
                              <span>· Attempt limit: {set.attemptLimit ?? "Unlimited"}</span>
                            </div>
                          </div>
                          <button className="icon-danger p-2" onClick={() => remove("set", set.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 pl-3 border-l-2 border-line space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Problems in this set:</p>
                          {data.codingProblems.filter((p) => p.practiceSetId === set.id).map((prob) => (
                            <div key={prob.id} className="flex items-center justify-between p-2 border border-line rounded-lg text-xs bg-card">
                              <span>
                                <b>#{prob.position || 1}</b> {prob.title} ({prob.topic || prob.difficulty})
                              </span>
                              <div className="flex gap-2">
                                <button className="text-primary hover:underline" onClick={() => editProblem(prob)}>Edit</button>
                                <button className="text-primary hover:underline" onClick={() => void duplicateProblem(prob.id)}>Duplicate</button>
                                <button className="text-red-500 hover:underline" onClick={() => remove("coding-problem", prob.id)}>Delete</button>
                              </div>
                            </div>
                          ))}
                          {data.codingProblems.filter((p) => p.practiceSetId === set.id).length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No problems added to this set yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                {/* Form 1: Add Debugging Practice Set */}
                <form onSubmit={createDebuggingSet} className="p-5 border border-line rounded-2xl bg-card space-y-3 text-xs">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Debugging Practice Set
                  </h3>
                  <input
                    required
                    placeholder="Set Name (e.g. Arrays & Strings Debugging)"
                    value={debuggingSetForm.name}
                    onChange={(e) => setDebuggingSetForm({ ...debuggingSetForm, name: e.target.value })}
                    className="w-full p-2 border border-line rounded-lg bg-background"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold block mb-0.5">Set Number</label>
                      <input
                        type="number"
                        min="1"
                        placeholder={`Auto (${debuggingSets.length + 1})`}
                        value={debuggingSetForm.setNumber}
                        onChange={(e) => setDebuggingSetForm({ ...debuggingSetForm, setNumber: e.target.value })}
                        className="w-full p-2 border border-line rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold block mb-0.5">Access Level</label>
                      <select
                        value={debuggingSetForm.access}
                        onChange={(e) => setDebuggingSetForm({ ...debuggingSetForm, access: e.target.value })}
                        className="w-full p-2 border border-line rounded-lg bg-background"
                      >
                        <option value="free">Free Access</option>
                        <option value="premium">Premium Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold block mb-0.5">Difficulty</label>
                      <select
                        value={debuggingSetForm.difficulty}
                        onChange={(e) => setDebuggingSetForm({ ...debuggingSetForm, difficulty: e.target.value })}
                        className="w-full p-2 border border-line rounded-lg bg-background"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold block mb-0.5">Duration (Mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        placeholder="20"
                        value={debuggingSetForm.durationMinutes}
                        onChange={(e) => setDebuggingSetForm({ ...debuggingSetForm, durationMinutes: e.target.value })}
                        className="w-full p-2 border border-line rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <button className="primary-button w-full py-2">Create Debugging Set</button>
                </form>

                {/* Form 2: Add/Edit Debugging Problem */}
                <form onSubmit={saveCodingProblemForm} className="p-5 border border-line rounded-2xl bg-card space-y-4">
                  <h3 className="font-bold text-md flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {editingProblemId ? "Edit Problem" : "Add Debugging Problem"}
                  </h3>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Practice Set</label>
                    <select
                      required
                      value={codingProblemForm.practiceSetId}
                      onChange={(e) => setCodingProblemForm({ ...codingProblemForm, practiceSetId: e.target.value })}
                      className="w-full p-2 border border-line rounded-lg text-xs bg-background"
                    >
                      <option value="">Choose set</option>
                      {debuggingSets.map((s) => (
                        <option key={s.id} value={s.id}>
                          Set {s.setNumber} · {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold block mb-1">Title</label>
                      <input
                        required
                        placeholder="Problem title"
                        value={codingProblemForm.title}
                        onChange={(e) => setCodingProblemForm({ ...codingProblemForm, title: e.target.value })}
                        className="w-full p-2 border border-line rounded-lg text-xs bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Topic</label>
                      <input
                        placeholder="e.g. Arrays · Boundary"
                        value={codingProblemForm.topic}
                        onChange={(e) => setCodingProblemForm({ ...codingProblemForm, topic: e.target.value })}
                        className="w-full p-2 border border-line rounded-lg text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Statement / Problem Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe the problem and input/output format..."
                      value={codingProblemForm.statement}
                      onChange={(e) => setCodingProblemForm({ ...codingProblemForm, statement: e.target.value })}
                      className="w-full p-2 border border-line rounded-lg text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Supported Languages</label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {["c", "cpp", "java", "python", "javascript"].map((lang) => (
                        <label key={lang} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={codingProblemForm.languages.includes(lang)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCodingProblemForm({ ...codingProblemForm, languages: [...codingProblemForm.languages, lang] });
                              } else {
                                setCodingProblemForm({
                                  ...codingProblemForm,
                                  languages: codingProblemForm.languages.filter((l) => l !== lang),
                                });
                              }
                            }}
                          />
                          {lang.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold">Buggy Code Editor</label>
                      <div className="flex gap-1 text-xs">
                        {codingProblemForm.languages.map((l) => (
                          <button
                            type="button"
                            key={l}
                            className={`px-2 py-0.5 rounded border ${activeCodeLang === l ? "bg-primary text-primary-foreground" : "bg-background"}`}
                            onClick={() => setActiveCodeLang(l)}
                          >
                            {l.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      className="w-full p-2 border border-line rounded-lg text-xs font-mono bg-background"
                      value={codingProblemForm.buggyCode[activeCodeLang] || ""}
                      onChange={(e) =>
                        setCodingProblemForm({
                          ...codingProblemForm,
                          buggyCode: { ...codingProblemForm.buggyCode, [activeCodeLang]: e.target.value },
                        })
                      }
                      placeholder={`Enter buggy code for ${activeCodeLang.toUpperCase()}...`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold">Test Cases ({codingProblemForm.testCases.length})</label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={() =>
                          setCodingProblemForm({
                            ...codingProblemForm,
                            testCases: [
                              ...codingProblemForm.testCases,
                              { name: `Test ${codingProblemForm.testCases.length + 1}`, stdin: "", expectedOutput: "", hidden: false },
                            ],
                          })
                        }
                      >
                        <Plus className="w-3 h-3" /> Add Test Case
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {codingProblemForm.testCases.map((tc, idx) => (
                        <div key={idx} className="p-2 border border-line rounded bg-background space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <input
                              className="p-1 border border-line rounded w-1/2"
                              value={tc.name}
                              placeholder="Test Case Name"
                              onChange={(e) =>
                                setCodingProblemForm({
                                  ...codingProblemForm,
                                  testCases: codingProblemForm.testCases.map((t, i) => (i === idx ? { ...t, name: e.target.value } : t)),
                                })
                              }
                            />
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.hidden}
                                onChange={(e) =>
                                  setCodingProblemForm({
                                    ...codingProblemForm,
                                    testCases: codingProblemForm.testCases.map((t, i) => (i === idx ? { ...t, hidden: e.target.checked } : t)),
                                  })
                                }
                              />
                              Hidden
                            </label>
                            <button
                              type="button"
                              className="text-red-500 hover:underline"
                              onClick={() =>
                                setCodingProblemForm({
                                  ...codingProblemForm,
                                  testCases: codingProblemForm.testCases.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            className="w-full p-1 border border-line rounded font-mono"
                            value={tc.stdin}
                            placeholder="Input stdin (optional)"
                            onChange={(e) =>
                              setCodingProblemForm({
                                ...codingProblemForm,
                                testCases: codingProblemForm.testCases.map((t, i) => (i === idx ? { ...t, stdin: e.target.value } : t)),
                              })
                            }
                          />
                          <input
                            className="w-full p-1 border border-line rounded font-mono"
                            value={tc.expectedOutput}
                            placeholder="Expected output"
                            onChange={(e) =>
                              setCodingProblemForm({
                                ...codingProblemForm,
                                testCases: codingProblemForm.testCases.map((t, i) => (i === idx ? { ...t, expectedOutput: e.target.value } : t)),
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border border-line rounded-lg bg-background space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <Play className="w-3 h-3 text-primary" /> Online Compiler Test
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={testLang}
                        onChange={(e) => setTestLang(e.target.value)}
                        className="p-1 border border-line rounded text-xs bg-card"
                      >
                        {codingProblemForm.languages.map((l) => (
                          <option key={l} value={l}>{l.toUpperCase()}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="secondary-button text-xs py-1 px-3"
                        onClick={() => void runAdminCompilerTest()}
                        disabled={testRunning}
                      >
                        {testRunning ? "Running..." : "Test Code"}
                      </button>
                    </div>

                    {testOutput && (
                      <div className="text-xs font-mono p-2 border border-line rounded bg-card max-h-32 overflow-y-auto">
                        <p className={testOutput.passed === testOutput.total ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                          Result: {testOutput.passed} / {testOutput.total} test cases passed
                        </p>
                        {testOutput.results?.map((r: any, i: number) => (
                          <div key={i} className={r.passed ? "text-green-600" : "text-red-500"}>
                            {r.name}: {r.passed ? "✓ Passed" : `✕ Failed (Received: ${r.received || r.stderr || "mismatch"})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingProblemId && (
                      <button
                        type="button"
                        className="secondary-button w-1/2 text-xs py-2"
                        onClick={() => setEditingProblemId(null)}
                      >
                        Cancel
                      </button>
                    )}
                    <button className="primary-button w-full text-xs py-2">
                      {editingProblemId ? "Update Problem" : "Save Problem"}
                    </button>
                  </div>
                </form>
              </aside>
            </div>
          )}

          {tab === "users" && (
            <section className="p-5 border border-line rounded-2xl bg-card">
              <div className="mb-4">
                <p className="eyebrow">Access control</p>
                <h2 className="text-lg font-bold">Users & premium access</h2>
              </div>
              <div className="space-y-2">
                {data.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-line rounded-xl bg-background text-xs">
                    <div>
                      <strong>{user.name || "Unnamed user"}</strong>
                      <p className="text-muted-foreground">{user.email || "No email"} · joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.plan}
                        onChange={(e) => void save({ action: "update-user", userId: user.id, plan: e.target.value })}
                        className="p-1 border border-line rounded bg-card"
                      >
                        <option value="free">Free Plan</option>
                        <option value="premium">Premium Plan</option>
                      </select>
                      <select
                        value={user.role}
                        onChange={(e) => void save({ action: "update-user", userId: user.id, role: e.target.value })}
                        className="p-1 border border-line rounded bg-card"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "offers" && (
            <section className="p-5 border border-line rounded-2xl bg-card">
              <div className="mb-4">
                <p className="eyebrow">Promotions</p>
                <h2 className="text-lg font-bold">Early Access Offers</h2>
              </div>
              <div className="space-y-2">
                {data.offers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 border border-line rounded-xl bg-background text-xs">
                    <div>
                      <strong>{offer.name}</strong>
                      <p className="text-muted-foreground">₹{offer.amountPaise / 100} · {offer.active ? "Active" : "Inactive"}</p>
                    </div>
                    <button
                      className="secondary-button text-xs py-1 px-3"
                      onClick={() => void save({ action: "update-offer", id: offer.id, active: !offer.active })}
                    >
                      {offer.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
