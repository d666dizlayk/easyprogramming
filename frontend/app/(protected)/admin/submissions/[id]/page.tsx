"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";
import styles from "../../admin.module.css";

function statusLabel(status: string) {
  if (status === "pending") return "На проверке";
  if (status === "passed") return "Принято";
  if (status === "failed") return "Возвращено на доработку";
  return status;
}

export default function AdminSubmissionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [error, setError] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");

  useEffect(() => {
    apiRequest("/users/me")
      .then((user) => {
        setMe(user);
        if (!user?.isAdmin) router.replace("/profile");
      })
      .catch(() => router.replace("/login"));

    apiRequest(`/submissions/${id}`)
      .then(setSubmission)
      .catch((e: any) => setError(e?.message || "Не удалось загрузить ответ"));
  }, [id, router]);

  async function approve() {
  setError("");

  try {
    await apiRequest(`/submissions/${id}/approve`, {
      method: "PATCH",
    });

    const updated = await apiRequest(`/submissions/${id}`);
    setSubmission(updated);
  } catch (e: any) {
    setError(e?.message || "Не удалось принять ответ");
  }
}

async function reject() {
  setError("");

  try {
    await apiRequest(`/submissions/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({
        message: rejectMessage.trim() || null,
      }),
    });

    const updated = await apiRequest(`/submissions/${id}`);
    setSubmission(updated);
    setRejectMessage("");
  } catch (e: any) {
    setError(e?.message || "Не удалось отклонить ответ");
  }
}

  if (!me?.isAdmin) return null;

  return (
    <main className={styles.page}>
      <div className={styles.bgGlow} />

      <section className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Ответ #{id}</h1>

          <Link href="/admin/submissions" className={styles.secondaryButton}>
            Назад
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {submission && (
          <section className={`${styles.card} ${styles.formCard}`}>
            <div className={styles.cardInner}>
              <div className={styles.infoGrid}>
                <div>
                  <span className={styles.label}>Пользователь</span>
                  <p>{submission.user?.username || submission.user?.email || "—"}</p>
                </div>

                <div>
                  <span className={styles.label}>Статус</span>
                  <p>{statusLabel(submission.status)}</p>
                </div>

                <div className={styles.full}>
                  <span className={styles.label}>Задача</span>
                  <p>{submission.task?.title || "—"}</p>
                </div>

                <div className={styles.full}>
                  <span className={styles.label}>GitHub</span>
                  {submission.githubUrl ? (
                    <a
                      href={submission.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.link}
                    >
                      {submission.githubUrl}
                    </a>
                  ) : (
                    <p>Ссылка не указана</p>
                  )}
                </div>

                <div className={styles.full}>
                  <span className={styles.label}>Сообщение</span>
                  <p>{submission.message || "—"}</p>
                </div>

                {submission.moderationMessage && (
                  <div className={styles.full}>
                    <span className={styles.label}>Причина возврата</span>
                    <p>{submission.moderationMessage}</p>
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button
                className={styles.button}
                onClick={approve}
                disabled={submission.status === "passed"}
                >
                Принять
                </button>

                <textarea
                  className={styles.textarea}
                  placeholder="Укажите причину возврата на доработку"
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                />

                <button
                className={styles.dangerButton}
                onClick={reject}
                disabled={submission.status === "failed" || !rejectMessage.trim()}
                >
                Вернуть на доработку
                </button>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}