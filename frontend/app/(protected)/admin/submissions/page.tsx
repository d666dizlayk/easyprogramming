"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";

const statusLabel: Record<string, string> = { pending: "На проверке", passed: "Принято", failed: "Возвращено на доработку" };
export default function AdminSubmissions() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    apiRequest("/users/me").then((u) => { if (!u?.isAdmin) return router.replace("/profile"); setReady(true); }).catch(() => router.replace("/login"));
    apiRequest("/submissions").then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, [router]);
  if (!ready) return <main className="ep-dashboard"><div className="ep-empty ep-dash-wrap">Проверяем доступ…</div></main>;
  return (
    <main className="ep-dashboard ep-admin-page"><div className="ep-dash-wrap">
      <div className="ep-dash-head"><div><div className="ep-eyebrow">МОДЕРАЦИЯ / SUBMISSIONS</div><h1>Ответы.</h1><p>Проверяйте решения разработчиков и подтверждайте реальный опыт.</p></div></div>
      <div className="ep-admin-tabs"><Link href="/admin/tasks">Задачи</Link><Link className="is-active" href="/admin/submissions">Ответы</Link></div>
      <div className="ep-admin-summary"><span><b>{items.filter((x) => x.status === "pending").length}</b> ждут проверки</span><span>{items.length} всего решений</span><span>Решение → профиль разработчика после принятия</span></div>
      <div className="ep-dash-list">{items.length ? items.map((x, i) => <Link href={`/admin/submissions/${x.id}`} className="ep-dash-row ep-dash-row-rich" key={x.id}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{x.task?.title || "Без названия"}</strong><small>{x.user?.username || x.user?.email || "Пользователь"} · #{x.id}</small></div><em className={`ep-status ${x.status || "pending"}`}>{statusLabel[x.status] || x.status || "На проверке"}</em><b>→</b></Link>) : <div className="ep-empty">Ответов пока нет.</div>}</div>
    </div></main>
  );
}
