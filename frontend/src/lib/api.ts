export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function humanizeApiError(status: number, payload: any, fallback: string) {
  const raw = payload?.message ?? payload?.error ?? fallback;
  const message = Array.isArray(raw) ? raw.join("; ") : String(raw);
  const lower = message.toLowerCase();

  if (status === 400 && lower.includes("github")) return "Укажите корректную ссылку на GitHub-репозиторий.";
  if (status === 401) return "Сессия истекла или вы не авторизованы. Войдите снова.";
  if (status === 403) return "У вас недостаточно прав для этого действия.";
  if (status === 404) return "Запрошенный объект не найден или больше недоступен.";
  if (status === 409) return message || "Такие данные уже существуют.";
  if (status >= 500) return "Сервер временно не может выполнить запрос. Попробуйте ещё раз.";

  return message || fallback;
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Не удалось подключиться к серверу. Проверьте, запущен ли backend.", 0);
  }

  const text = await res.text();
  if (!res.ok) {
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
    throw new ApiError(humanizeApiError(res.status, payload, `Ошибка запроса (${res.status}).`), res.status, payload);
  }

  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}
