"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";
import { TASK_LANGUAGES } from "@/src/lib/task-options";
import { getLevelInfo } from "@/src/lib/levels";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState<any>({ easy: 0, medium: 0, hard: 0 });
  const [solved, setSolved] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      apiRequest("/users/me"),
      apiRequest("/submissions/me/stats"),
      apiRequest("/submissions/me/solved/tasks"),
      apiRequest("/tasks"),
    ])
      .then(([user, userStats, solvedTasks, publicTasks]) => {
        if (!alive) return;
        if (user?.role === "business") {
          router.replace("/business");
          return;
        }
        setMe(user);
        setStack(Array.isArray(user?.stack) ? user.stack.filter((x: unknown): x is string => typeof x === "string") : []);
        setBio(user?.bio || "");
        setStats(userStats || {});
        setSolved(Array.isArray(solvedTasks) ? solvedTasks : []);
        setTasks(Array.isArray(publicTasks) ? publicTasks : []);
      })
      .catch(() => router.replace("/login"));
    return () => { alive = false; };
  }, [router]);

  const level = getLevelInfo(Number(me?.exp ?? 0));
  const completedCount = solved.length;
  const normalizedStack = useMemo(() => new Set(stack.map((item) => item.trim().toLowerCase())), [stack]);
  const activeTasks = useMemo(() => {
    const solvedIds = new Set(solved.map((item) => Number(item.id)));
    return tasks
      .filter((task) => !solvedIds.has(Number(task.id)))
      .filter((task) => {
        if (!normalizedStack.size) return false;
        const language = String(task.language || task.programmingLanguage || "").trim().toLowerCase();
        return normalizedStack.has(language);
      })
      .slice(0, 5);
  }, [tasks, solved, normalizedStack]);

  function addStackItem() {
    if (!selectedLanguage) return;
    if (!stack.some((item) => item.toLowerCase() === selectedLanguage.toLowerCase())) {
      setStack((current) => [...current, selectedLanguage]);
    }
    setSelectedLanguage("");
  }

  function removeStackItem(item: string) {
    setStack((current) => current.filter((value) => value !== item));
  }

  async function saveProfile() {
    if (!me) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiRequest("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ bio, stack }),
      });
      setMe(updated);
      setStack(Array.isArray(updated?.stack) ? updated.stack.filter((x: unknown): x is string => typeof x === "string") : []);
      setBio(updated?.bio ?? bio);
      setMessage("Профиль сохранён.");
    } catch (error: any) {
      setMessage(error?.message || "Не удалось сохранить профиль.");
    } finally {
      setSaving(false);
    }
  }

  if (!me) {
    return <main className="ep-dashboard"><div className="ep-dash-wrap">Загрузка кабинета…</div></main>;
  }

  return (
    <main className="ep-dashboard ep-programmer-cabinet">
      <div className="ep-dash-wrap">
        <div className="ep-dash-head">
          <div>
            <div className="ep-eyebrow">ЛИЧНЫЙ КАБИНЕТ / ПРОГРАММИСТ</div>
            <h1>Ваш профиль.</h1>
            <p>Заполните стек, следите за прогрессом и переходите к задачам, которые подходят вашему опыту.</p>
          </div>
          <div className="ep-actions-row">
            <Link href="/tasks" className="ep-button">Открыть банк задач →</Link>
            <Link href={`/users/${me.username}`} className="ep-outline-button">Публичный профиль</Link>
          </div>
        </div>

        <section className="ep-profile-stats ep-business-metrics ep-programmer-metrics">
          <div><strong>{level.level}</strong><span>текущий уровень</span></div>
          <div><strong>{Number(me.exp ?? 0)}</strong><span>XP</span></div>
          <div><strong>{completedCount}</strong><span>решено</span></div>
          <div><strong>{activeTasks.length}</strong><span>подходит по стеку</span></div>
        </section>

        <div className="ep-business-dashboard-grid ep-programmer-dashboard-grid">
          <section className="ep-panel">
            <div className="ep-eyebrow">МОЙ СТЕК</div>
            <div className="ep-section-heading compact">
              <div><h2>Технологии</h2><p className="ep-muted-copy">Выберите технологии, с которыми готовы брать задачи.</p></div>
            </div>
            <div className="ep-stack-editor">
              <div className="ep-stack-list ep-stack-list-large">
                {stack.length ? stack.map((item) => (
                  <button key={item} type="button" className="ep-stack-chip" onClick={() => removeStackItem(item)} title="Убрать из стека">
                    {item}<span>×</span>
                  </button>
                )) : <div className="ep-empty">Пока стек не указан.</div>}
              </div>
              <div className="ep-stack-add-row">
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                  <option value="">Добавить технологию…</option>
                  {TASK_LANGUAGES.filter((item) => !stack.some((x) => x.toLowerCase() === item.toLowerCase())).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button type="button" className="ep-outline-button" onClick={addStackItem} disabled={!selectedLanguage}>Добавить</button>
              </div>
              <button type="button" className="ep-button ep-button-small" onClick={saveProfile} disabled={saving}>
                {saving ? "Сохраняю…" : "Сохранить профиль"}
              </button>
              {message && <div className="ep-task-message success">{message}</div>}
            </div>
          </section>

          <aside className="ep-panel">
            <div className="ep-eyebrow">ПРОГРЕСС</div>
            <div className="ep-level-ring" style={{ "--progress": `${level.progress}%` } as React.CSSProperties}>
              <div className="ep-level-ring-inner"><strong>{Math.round(level.progress)}%</strong></div>
            </div>
            <div className="ep-level-copy">
              <strong>Уровень {level.level}</strong>
              <span>{level.max === Infinity ? "Максимальный уровень" : `${Math.max(0, level.max + 1 - Number(me.exp ?? 0))} XP до следующего`}</span>
            </div>
            <div className="ep-progress"><span style={{ width: `${level.progress}%` }} /></div>
          </aside>
        </div>

        <section className="ep-panel ep-programmer-recommendations">
          <div className="ep-section-heading compact">
            <div>
              <div className="ep-eyebrow">ПО СТЕКУ</div>
              <h2>Подходящие задачи.</h2>
            </div>
            <Link href="/tasks" className="ep-outline-button">Все задачи →</Link>
          </div>
          {activeTasks.length ? (
            <div className="ep-dash-list">
              {activeTasks.map((task, index) => (
                <Link href={`/tasks/${task.id}`} key={task.id} className="ep-dash-row ep-dash-row-rich ep-programmer-task-row">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{task.title}</strong><small>{task.language || "Язык не указан"} · {task.difficulty || "—"}</small></div>
                  <em>Подходит</em>
                  <b>→</b>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ep-empty">
              {stack.length ? "Пока нет открытых задач по вашему стеку. Загляните в банк задач позже." : "Добавьте стек выше — здесь появятся подходящие задачи."}
            </div>
          )}
        </section>

        <section className="ep-panel ep-programmer-bio-panel">
          <div className="ep-section-heading compact"><div><div className="ep-eyebrow">О СЕБЕ</div><h2>Профиль разработчика.</h2></div></div>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="ep-profile-bio-edit" placeholder="Коротко расскажите о себе, своём опыте и интересах…" />
        </section>

        <section className="ep-profile-card ep-programmer-portfolio-panel">
          <div className="ep-section-heading compact">
            <div><div className="ep-eyebrow">ПОРТФОЛИО</div><h2>Выполненные задачи.</h2></div>
            <Link href={`/users/${me.username}`} className="ep-outline-button">Открыть публичный профиль →</Link>
          </div>
          <div className="ep-portfolio-list">
            {solved.length ? solved.slice(0, 8).map((task: any, index: number) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="ep-portfolio-row ep-portfolio-row-rich">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="ep-portfolio-task"><strong>{task.title}</strong><small>{task.language || "REAL TASK"}</small></div>
                <em>{task.difficulty || "completed"}</em>
                <div className="ep-portfolio-links"><span>{task.githubUrl ? "GH" : ""}</span><b>→</b></div>
              </Link>
            )) : <div className="ep-empty">Здесь появятся задачи, решения которых принял модератор.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
