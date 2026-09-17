"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";
import styles from "../../admin.module.css";
import { TASK_LANGUAGES } from "@/src/lib/task-options";

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationMessage, setModerationMessage] = useState("");
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [conditions, setConditions] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [language, setLanguage] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationBusy, setApplicationBusy] = useState<number | null>(null);

  useEffect(() => {
    apiRequest("/users/me")
      .then((user) => {
        setMe(user);
        if (!user?.isAdmin) router.replace("/profile");
      })
      .catch(() => router.replace("/login"));

    apiRequest(`/tasks/${id}/admin`)
      .then((task) => {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setGoal(task.goal || "");
        setConditions(task.conditions || "");
        setDifficulty(task.difficulty || "easy");
        setLanguage(task.language || task.programmingLanguage || "");
        setStatus(task.status || "pending");
      })
      .catch((e: any) => setError(e?.message || "Не удалось загрузить задачу"));

    apiRequest(`/tasks/${id}/applications`)
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]));
  }, [id, router]);

  async function save() {
    setError("");
    setSaving(true);

    try {
      await apiRequest(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description: description || null,
          goal: goal || null,
          conditions: conditions || null,
          difficulty,
          language,
        }),
      });

      router.push("/admin/tasks");
    } catch (e: any) {
      setError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = confirm("Удалить задачу?");
    if (!ok) return;

    setDeleting(true);
    setError("");

    try {
      await apiRequest(`/tasks/${id}`, { method: "DELETE" });
      router.push("/admin/tasks");
    } catch (e: any) {
      setError(e?.message || "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  async function moderate(nextStatus: "approved" | "rejected") {
    setError("");
    setModerating(true);
    try {
      const updated = await apiRequest(`/tasks/${id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          message: moderationMessage.trim() || undefined,
        }),
      });
      setStatus(updated?.status || nextStatus);
      setModerationMessage("");
    } catch (e: any) {
      setError(e?.message || "Не удалось изменить статус модерации");
    } finally {
      setModerating(false);
    }
  }

  async function decideApplication(applicationId: number, nextStatus: "accepted" | "declined") {
    setError("");
    setApplicationBusy(applicationId);
    try {
      await apiRequest(`/tasks/${id}/applications/${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const updated = await apiRequest(`/tasks/${id}/applications`);
      setApplications(Array.isArray(updated) ? updated : []);
      if (nextStatus === "accepted") {
        setStatus("in_progress");
      }
    } catch (e: any) {
      setError(e?.message || "Не удалось обработать заявку");
    } finally {
      setApplicationBusy(null);
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
          <h1 className={styles.title}>Редактирование задачи #{id}</h1>
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

        {(status === "pending" || status === "rejected") && <section className={`${styles.card} ${styles.formCard}`}>
          <div className={styles.cardInner}>
            <div className={styles.label}>РЕШЕНИЕ МОДЕРАЦИИ · ТЕКУЩИЙ СТАТУС: {status}</div>
            <textarea
              className={styles.textarea}
              placeholder="Причина отклонения или комментарий модератора"
              value={moderationMessage}
              onChange={(e) => setModerationMessage(e.target.value)}
            />
            <div className={styles.actions}>
              <button className={styles.button} onClick={() => moderate("approved")} disabled={moderating}>
                {moderating ? "Обрабатываем..." : "Одобрить публикацию"}
              </button>
              <button className={styles.dangerButton} onClick={() => moderate("rejected")} disabled={moderating}>
                Отклонить
              </button>
            </div>
          </div>
        </section>}

        <section className={`${styles.card} ${styles.formCard}`}>
          <div className={styles.cardInner}>
            <div className={styles.label}>ЗАЯВКИ РАЗРАБОТЧИКОВ</div>
            <h2 className={styles.title} style={{ fontSize: "28px", marginBottom: "16px" }}>Кандидаты на задачу</h2>
            {applications.length === 0 ? (
              <p>Пока нет заявок.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {applications.map((application) => (
                  <div key={application.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px", border: "1px solid rgba(255,255,255,.08)" }}>
                    <div>
                      <strong>{application.programmer?.username || application.programmer?.email || `Разработчик #${application.programmer?.id || "—"}`}</strong>
                      <p style={{ margin: "6px 0 0", opacity: .7 }}>{application.message || "Без сопроводительного сообщения"}</p>
                      <small style={{ opacity: .55 }}>Статус: {application.status}</small>
                    </div>
                    {application.status === "pending" && !applicationBusy && status === "approved" && (
                      <div className={styles.actions}>
                        <button className={styles.button} onClick={() => decideApplication(application.id, "accepted")}>Назначить</button>
                        <button className={styles.dangerButton} onClick={() => decideApplication(application.id, "declined")}>Отклонить</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className={styles.actions}>
          <button className={styles.button} onClick={save} disabled={saving}>
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </button>

          <button className={styles.dangerButton} onClick={remove} disabled={deleting}>
            {deleting ? "Удаляем..." : "Удалить"}
          </button>
        </div>
      </section>
    </main>
  );
}