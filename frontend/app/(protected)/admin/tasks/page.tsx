"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";

const difficultyLabel: Record<string,string> = { easy: "Небольшая", medium: "Средняя", hard: "Чуть сложнее" };

export default function AdminTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    apiRequest("/users/me").then(u => { if (!u?.isAdmin) return router.replace("/profile"); setReady(true); }).catch(() => router.replace("/login"));
    apiRequest("/tasks/admin/all").then(d => setTasks(Array.isArray(d) ? d : [])).catch(() => setTasks([]));
  }, [router]);
  if (!ready) return null;
  return (
    <main className="ep-dashboard ep-admin-page">
      <div className="ep-dash-wrap">
        <div className="ep-dash-head">
          <div><div className="ep-eyebrow">МОДЕРАЦИЯ / TASKS</div><h1>Задачи.</h1><p>Проверяйте публикации бизнеса и управляйте банком задач платформы.</p></div>
          <Link href="/admin/tasks/new" className="ep-button">+ Создать задачу</Link>
        </div>
        <div className="ep-admin-tabs"><Link href="/admin/tasks">Задачи</Link><Link href="/admin/submissions">Ответы</Link></div>
        <div className="ep-admin-summary"><span><b>{tasks.length}</b> всего</span><span>Проверка публикаций</span><span>Проверка решений отдельно</span></div>
        <div className="ep-dash-list">
          {tasks.length ? tasks.map((t,i) => <Link href={`/admin/tasks/${t.id}`} className="ep-dash-row ep-dash-row-rich" key={t.id}><span>{String(i+1).padStart(2,"0")}</span><div><strong>{t.title}</strong><small>ID {t.id} · {t.language || t.programmingLanguage || "язык не указан"}</small></div><em className={t.difficulty}>{difficultyLabel[t.difficulty] || t.difficulty || "—"}</em><b>→</b></Link>) : <div className="ep-empty">Задач пока нет.</div>}
        </div>
      </div>
    </main>
  );
}
