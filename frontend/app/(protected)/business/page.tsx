"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";

const statusLabel: Record<string, string> = {
  pending: "На модерации",
  approved: "Опубликована",
  rejected: "Отклонена",
};

export default function BusinessCabinetPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/users/me"), apiRequest("/tasks/business/mine"), apiRequest("/submissions/business/mine")])
      .then(([user, ownTasks, ownSubmissions]) => {
        if (user?.role !== "business") {
          router.replace("/profile");
          return;
        }
        setMe(user);
        setTasks(Array.isArray(ownTasks) ? ownTasks : []);
        setSubmissions(Array.isArray(ownSubmissions) ? ownSubmissions : []);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = useMemo(() => ({
    total: tasks.length,
    published: tasks.filter((t) => t.status === "approved").length,
    moderation: tasks.filter((t) => t.status === "pending").length,
    rejected: tasks.filter((t) => t.status === "rejected").length,
    answers: submissions.length,
    pendingAnswers: submissions.filter((s) => s.status === "pending").length,
  }), [tasks, submissions]);

  if (loading) return <main className="ep-dashboard"><div className="ep-dash-wrap">Загрузка кабинета…</div></main>;
  if (!me) return null;

  const recentTasks = tasks.slice(0, 5);
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <main className="ep-dashboard">
      <div className="ep-dash-wrap">
        <div className="ep-dash-head">
          <div>
            <div className="ep-eyebrow">МОИ АКТИВНЫЕ ЗАДАЧИ</div>
            <h1>Задачи бизнеса</h1>
            <p>Размещайте реальные IT-задачи, следите за их статусом и смотрите решения разработчиков.</p>
          </div>
          <Link href="/business/tasks" className="ep-button">+ Разместить задачу</Link>
        </div>

        <section className="ep-profile-stats ep-business-metrics">
          <div><strong>{stats.total}</strong><span>всего задач</span></div>
          <div><strong>{stats.published}</strong><span>опубликовано</span></div>
          <div><strong>{stats.moderation}</strong><span>на модерации</span></div>
          <div><strong>{stats.answers}</strong><span>ответов</span></div>
        </section>

        <div className="ep-business-dashboard-grid">
          <section className="ep-panel">
            <div className="ep-eyebrow">АКТИВНЫЕ ЗАДАЧИ</div>
            <div className="ep-section-heading compact"><h2>Активные задачи</h2><Link href="/business/tasks" className="ep-outline-button">Все мои задачи →</Link></div>
            <div className="ep-dash-list">
              {recentTasks.length ? recentTasks.map((task, index) => (
                <div className="ep-dash-row ep-dash-row-rich" key={task.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{task.title}</strong><small>#{task.id} · {task.language || "Язык не указан"}</small></div>
                  <em className={`ep-status ep-status-${task.status}`}>{statusLabel[task.status] || task.status}</em>
                  <Link href={`/business/tasks?task=${task.id}`} className="ep-business-arrow">→</Link>
                </div>
              )) : <div className="ep-empty">Пока нет активных задач — создайте первую слева.</div>}
            </div>
          </section>

          <aside className="ep-panel">
            <div className="ep-eyebrow">СТАТУС ЗАДАЧ</div>
            <h2>Что требует внимания</h2>
            <div className="ep-business-attention">
              <div><span>На модерации</span><strong>{stats.moderation}</strong></div>
              <div><span>Отклонено</span><strong>{stats.rejected}</strong></div>
              <div><span>Решений на проверке</span><strong>{stats.pendingAnswers}</strong></div>
            </div>
            <div className="ep-business-note-card">
              <strong>Решения проверяет модератор</strong>
              <span>Каждое решение проходит проверку модератором. Вы видите отправленный GitHub-репозиторий и статус проверки.</span>
            </div>
          </aside>
        </div>

        <section className="ep-panel ep-business-submissions">
          <div className="ep-eyebrow">ВЫПОЛНЕННЫЕ ЗАДАЧИ</div>
          <div className="ep-section-heading compact"><h2>Решения разработчиков</h2><Link href="/business/tasks" className="ep-outline-button">К моим задачам →</Link></div>
          <div className="ep-dash-list">
            {recentSubmissions.length ? recentSubmissions.map((submission, index) => (
              <Link href={`/business/tasks?task=${submission.task?.id || ""}`} className="ep-dash-row ep-dash-row-rich" key={submission.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{submission.task?.title || "Задача"}</strong><small>{submission.user?.username || "Разработчик"} · {submission.githubUrl ? "GitHub" : "без ссылки"}</small></div>
                <em className={`ep-status ep-status-${submission.status === "passed" ? "approved" : submission.status === "failed" ? "rejected" : "pending"}`}>{submission.status === "passed" ? "Принято" : submission.status === "failed" ? "Отклонено" : "На проверке"}</em>
                <b>→</b>
              </Link>
            )) : <div className="ep-empty">Здесь появятся решения разработчиков по вашим задачам.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
