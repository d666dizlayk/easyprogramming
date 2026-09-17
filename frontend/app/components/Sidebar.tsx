"use client";

import Link from "next/link";
import styles from "./sidebar.module.css";
import { useEffect, useState } from "react";
import { apiRequest } from "@/src/lib/api";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<"programmer" | "business" | null>(null);
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    apiRequest("/users/me")
      .then((user) => { setIsAdmin(!!user.isAdmin); setRole(user.role === "business" ? "business" : user.role === "programmer" ? "programmer" : null); })
      .catch(() => {});
    apiRequest("/notifications/unread-count")
      .then((data) => setUnread(Number(data) || 0))
      .catch(() => setUnread(0));
    const timer = window.setInterval(() => {
      apiRequest("/notifications/unread-count")
        .then((data) => setUnread(Number(data) || 0))
        .catch(() => {});
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        <img src="/site-logo.png" alt="Старт Комьюнити" className={styles.brandLogo} />
      </Link>
      <nav className={styles.nav}>
        <Link
          href="/"
          className={`${styles.navItem} ${isActive("/") ? styles.active : ""}`}
        >
          <span>⌂</span> Главная
        </Link>

        <Link
          href={role === "business" ? "/business" : "/profile"}
          className={`${styles.navItem} ${(role === "business" ? pathname === "/business" : isActive("/users") || isActive("/profile")) ? styles.active : ""}`}
        >
          <span>●</span> Личный кабинет
        </Link>

        {role === "programmer" && (
          <Link
            href="/tasks"
            className={`${styles.navItem} ${isActive("/tasks") ? styles.active : ""}`}
          >
            <span>♧</span> Банк задач
          </Link>
        )}

        <Link
          href="/notifications"
          className={`${styles.navItem} ${isActive("/notifications") ? styles.active : ""}`}
        >
          <span>◔</span> Уведомления {unread > 0 && <b className={styles.badge}>{unread > 99 ? "99+" : unread}</b>}
        </Link>

        <Link
          href="/rating"
          className={`${styles.navItem} ${isActive("/rating") ? styles.active : ""}`}
        >
          <span>↗</span> Рейтинг
        </Link>

        {role === "business" && (
          <Link
            href="/business/tasks"
            className={`${styles.navItem} ${pathname === "/business/tasks" ? styles.active : ""}`}
          >
            <span>↳</span> Мои задачи
          </Link>
        )}

        {isAdmin && (
          <Link
          href="/admin/submissions"
          className={`${styles.navItem} ${isActive("/admin/submissions") ? styles.active : ""}`}
          >
          <span>✉</span> Ответы
          </Link>
        )}

        {/* <Link href="/admin/submissions" className={styles.navItem}>
          <span>✉</span> Ответы
        </Link> */}


        {isAdmin && (
          <Link
            href="/admin/tasks"
            className={`${styles.navItem} ${isActive("/admin/tasks") ? styles.active : ""}`}
          >
            <span>⚙</span> Админ панель
          </Link>

          // <Link 
          // href="/admin/submissions" 
          // className={`${styles.navItem} ${isActive("/admin") ? styles.active : ""}`}
          // >
          //   <span>✉</span> Ответы
          // </Link>


        )}
      </nav>

      <button
        className={styles.logout}
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
      >
        <span>▯</span> Выход
      </button>
    </aside>
  );
}