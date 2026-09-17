export const TASK_LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "C++",
  "C#",
  "Java",
  "Go",
  "Rust",
  "PHP",
  "Kotlin",
  "Swift",
  "Ruby",
  "Dart",
  "SQL",
] as const;

export type TaskLanguage = (typeof TASK_LANGUAGES)[number];

const LANGUAGE_ALIASES: Record<string, TaskLanguage> = {
  python: "Python",
  py: "Python",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  "c++": "C++",
  cpp: "C++",
  "c#": "C#",
  csharp: "C#",
  java: "Java",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  php: "PHP",
  kotlin: "Kotlin",
  swift: "Swift",
  ruby: "Ruby",
  dart: "Dart",
  sql: "SQL",
};

export function normalizeTaskLanguage(value?: string | null): TaskLanguage | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return LANGUAGE_ALIASES[raw.toLowerCase()] ?? null;
}

export function validateTaskLanguage(value?: string | null): TaskLanguage | null {
  const raw = String(value ?? "").trim();
  if (!raw) throw new Error("Выберите язык программирования");
  const normalized = normalizeTaskLanguage(raw);
  if (!normalized) {
    throw new Error(`Неподдерживаемый язык программирования: ${raw}`);
  }
  return normalized;
}
