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
