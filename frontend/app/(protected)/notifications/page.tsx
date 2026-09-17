"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/src/lib/api";

function notificationLabel(type: string) {
  if (type?.startsWith("application")) return "ЗАЯВКА";
  if (type?.startsWith("submission")) return "РЕШЕНИЕ";
  if (type === "task.assigned") return "ЗАДАЧА";
  return "СИСТЕМА";
}

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await apiRequest("/notifications");
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: number) {
    await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
    setItems((list) => list.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAll() {
    await apiRequest("/notifications/read-all", { method: "PATCH" });
    setItems((list) => list.map((n) => ({ ...n, read: true })));
  }

  return (
    <main className="ep-dashboard">
      <div className="ep-dash-wrap">
        <div className="ep-dash-head">
          <div>
            <div className="ep-eyebrow">ЦЕНТР УВЕДОМЛЕНИЙ</div>
            <h1>Уведомления</h1>
            <p>Здесь появляются важные изменения по вашим задачам, заявкам и решениям.</p>
          </div>
          <button className="ep-outline-button" onClick={markAll}>Отметить всё прочитанным</button>
        </div>

        <section className="ep-panel ep-notifications-panel">
          {loading ? <div className="ep-empty">Загрузка…</div> : items.length === 0 ? (
            <div className="ep-empty">Пока новых событий нет.</div>
          ) : items.map((n) => (
            <article key={n.id} className={`ep-notification-row ${n.read ? "is-read" : "is-unread"}`}>
              <div className="ep-notification-dot" />
              <div className="ep-notification-main">
                <div className="ep-notification-top">
                  <span className="ep-eyebrow">{notificationLabel(n.type)}</span>
                  <time>{n.createdAt ? new Date(n.createdAt).toLocaleString("ru-RU") : ""}</time>
                </div>
                <h2>{n.title}</h2>
                <p>{n.message}</p>
                {n.taskId && <Link href={n.type === "application.created.admin" ? `/admin/tasks/${n.taskId}` : `/tasks/${n.taskId}`} className="ep-notification-link">{n.type === "application.created.admin" ? "Открыть заявку →" : "Открыть задачу →"}</Link>}
              </div>
              {!n.read && <button className="ep-notification-read" onClick={() => markRead(n.id)}>Прочитано</button>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
