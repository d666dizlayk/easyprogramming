"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/src/lib/api";

export default function RatingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    apiRequest("/users/rating")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));

    apiRequest("/users/me").then(setMe).catch(() => setMe(null));
  }, []);

  const cabinetHref = me?.role === "business" ? "/business" : "/profile";

  return (
    <main className="ep-rating">
      <div className="ep-rating-wrap">
        <div className="ep-rating-nav">
          <Link href="/" className="ep-back">← На главную</Link>
          {me && (
            <Link href={cabinetHref} className="ep-outline-button ep-rating-cabinet">
              Личный кабинет →
            </Link>
          )}
        </div>

        <div className="ep-rating-head">
          <div>
            <div className="ep-eyebrow">РЕЙТИНГ РАЗРАБОТЧИКОВ</div>
            <h1>Кто уже создаёт <span>опыт.</span></h1>
            <p>XP начисляется за решения, которые прошли проверку. Поднимайтесь в рейтинге и показывайте результат.</p>
          </div>
          <Link href="/tasks" className="ep-outline-button">К задачам →</Link>
        </div>

        <div className="ep-table">
          <div className="ep-row ep-row-head">
            <span>#</span><span>Разработчик</span><span>Уровень</span><span>XP</span>
          </div>
          {loading ? (
            <div className="ep-row"><span></span><span>Загрузка рейтинга…</span></div>
          ) : users.length ? (
            users.map((u, i) => (
              <Link href={`/users/${u.username}`} className="ep-row" key={u.id}>
                <span className="ep-rank">{String(i + 1).padStart(2, "0")}</span>
                <span className="ep-user">
                  <span className="ep-avatar">{(u.username || "?")[0].toUpperCase()}</span>
                  <span className="ep-user-name">{u.username}</span>
                </span>
                <span className="ep-level">{u.level || "Junior"}</span>
                <span className="ep-xp">{u.exp ?? 0} XP</span>
              </Link>
            ))
          ) : (
            <div className="ep-row"><span></span><span>Пока нет данных для рейтинга.</span></div>
          )}
        </div>
      </div>
    </main>
  );
}
