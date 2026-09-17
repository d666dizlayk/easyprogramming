"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";
import styles from "../../admin.module.css";
import { TASK_LANGUAGES } from "@/src/lib/task-options";

export default function NewTaskPage() {
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [conditions, setConditions] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [language, setLanguage] = useState("Python");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/users/me")
      .then((user) => {
        setMe(user);
        if (!user?.isAdmin) router.replace("/profile");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function save() {
    setError("");
    setLoading(true);

    try {
      const created = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || null,
          goal: goal || null,
          conditions: conditions || null,
          difficulty,
          language,
        }),
      });

      router.push(`/admin/tasks/${created.id}`);
    } catch (e: any) {
      setError(e?.message || "Ошибка создания задачи");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (!me?.isAdmin) return null;

  return (
    <main className={styles.page}>
      <div className={styles.bgGlow} />

      {/* <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <Link className={styles.navItem} href="/">
            <span>⌂</span> Главная
          </Link>

          <Link className={styles.navItem} href="/tasks">
            <span>♧</span> Задачи
          </Link>

          <Link className={styles.navItem} href="/profile">
            <span>●</span> Личный кабинет
          </Link>

          <Link className={`${styles.navItem} ${styles.adminLink}`} href="/admin/tasks">
            <span>⚙</span> Админ панель
          </Link>
        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          <span>▯</span> Выход
        </button>   

        </aside> */}

      <section className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Новая задача</h1>
          <Link href="/admin/tasks" className={styles.secondaryButton}>Назад</Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <section className={`${styles.card} ${styles.formCard}`}>
          <div className={`${styles.cardInner} ${styles.formGrid}`}>
            <div className={styles.full}>
              <label className={styles.label}>Название</label>
              <input className={styles.field} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className={styles.label}>Сложность</label>
              <select className={styles.select} value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">Легко</option>
                <option value="medium">Средне</option>
                <option value="hard">Сложно</option>
              </select>
            </div>

            <div>
              <label className={styles.label}>Язык программирования</label>
              <select className={styles.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                {TASK_LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className={styles.full}>
              <label className={styles.label}>Описание</label>
              <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className={styles.full}>
              <label className={styles.label}>Цель</label>
              <textarea className={styles.textarea} value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>

            <div className={styles.full}>
              <label className={styles.label}>Условия</label>
              <textarea className={styles.textarea} value={conditions} onChange={(e) => setConditions(e.target.value)} />
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button className={styles.button} onClick={save} disabled={loading}>
            {loading ? "Сохраняем..." : "Создать"}
          </button>

          <button className={styles.secondaryButton} onClick={() => router.push("/admin/tasks")}>
            Отмена
          </button>
        </div>
      </section>
    </main>
  );
}