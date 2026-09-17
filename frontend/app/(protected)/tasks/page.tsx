"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/src/lib/api";
import styles from "./tasks.module.css";
import { TASK_LANGUAGES } from "@/src/lib/task-options";

type TaskDifficulty = "easy" | "medium" | "hard";

type Task = {
  id: number;
  title: string;
  description?: string;
  difficulty: TaskDifficulty;
  language?: string;
  programmingLanguage?: string;
  createdAt?: string;
};

const PAGE_SIZE = 10;

const difficultyLabel: Record<TaskDifficulty, string> = {
  easy: "Легко",
  medium: "Средне",
  hard: "Сложно",
};

function getDifficultyClass(difficulty: TaskDifficulty) {
  if (difficulty === "easy") return styles.easy;
  if (difficulty === "medium") return styles.medium;
  return styles.hard;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<"" | TaskDifficulty>("");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    apiRequest("/users/me")
      .then((user) => {
        setMe(user);
        if (user?.role === "business") router.replace("/business/tasks");
      })
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    apiRequest("/tasks")
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));

    apiRequest("/submissions/me/solved")
      .then((ids) => setSolvedIds(Array.isArray(ids) ? ids : []))
      .catch(() => setSolvedIds([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [difficulty, language]);

  const languages = TASK_LANGUAGES;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskLanguage = task.language || task.programmingLanguage || "";

      const normalizedDifficulty = (task.difficulty || (task as any).complexity || "").toString().toLowerCase() as TaskDifficulty;
      const difficultyOk = difficulty ? normalizedDifficulty === difficulty : true;
      const languageOk = language ? taskLanguage.trim().toLowerCase() === language.trim().toLowerCase() : true;

      return difficultyOk && languageOk;
    });
  }, [tasks, difficulty, language]);

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);

  const visibleTasks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, page]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

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
          {me?.isAdmin && (
            <Link className={styles.navItem} href="/admin/tasks">
              <span>⚙</span> Админ панель
            </Link>
          )}

        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          <span>▯</span> Выход
        </button>
      </aside> */}

      <section className={styles.content}>
        <div className={styles.catalog}>
          <h1 className={styles.title}>Каталог задач</h1>

          <div className={styles.tableHeader}>
            <span>Сложность</span>
          </div>

          <div className={styles.tasksList}>
            {loading ? (
              <div className={styles.empty}>Загрузка задач...</div>
            ) : visibleTasks.length > 0 ? (
              visibleTasks.map((task) => {
                const taskLanguage =
                  task.language || task.programmingLanguage || "—";
                const taskDifficulty =
                  (task.difficulty || (task as any).complexity || "easy").toString().toLowerCase() as TaskDifficulty;

                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`${styles.taskCard} gradient-border`}
                  >
                    <div
                      className={`${styles.difficultyDot} ${getDifficultyClass(
                        taskDifficulty
                      )}`}
                    />

                    <div className={styles.taskInfo}>
                      <div className={styles.taskTitle}>
                        {/* <span>Задача | </span> */}
                        <strong>{task.title || "Наименование и описание..."}</strong>

                        {solvedIds.includes(task.id) && (
                          <span className={styles.solved}>✓</span>
                        )}
                      </div>

                      <div className={styles.taskMeta}>
                        <span>Дата публикации: </span>
                        <span>{formatDate(task.createdAt)}</span>

                        <span className={styles.tag}>{taskLanguage}</span>

                        <span className={styles.tag}>
                          {difficultyLabel[taskDifficulty]}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className={styles.empty}>Задачи не найдены</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;

                return (
                  <button
                    key={pageNumber}
                    className={page === pageNumber ? styles.activePage : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className={`${styles.filterPanel} gradient-border`}>
          <h2>Фильтр</h2>
          <div className={styles.filterLine} />

          <div className={styles.filterGroup}>
            <p>Сложность</p>

            <button
              className={`${styles.filterButton} ${
                difficulty === "" ? styles.filterActive : ""
              }`}
              onClick={() => setDifficulty("")}
            >
              Все
            </button>

            <button
              className={`${styles.filterButton} ${
                difficulty === "easy" ? styles.filterActive : ""
              }`}
              onClick={() => setDifficulty("easy")}
            >
              Легко
            </button>

            <button
              className={`${styles.filterButton} ${
                difficulty === "medium" ? styles.filterActive : ""
              }`}
              onClick={() => setDifficulty("medium")}
            >
              Средне
            </button>

            <button
              className={`${styles.filterButton} ${
                difficulty === "hard" ? styles.filterActive : ""
              }`}
              onClick={() => setDifficulty("hard")}
            >
              Сложно
            </button>
          </div>

          <div className={styles.filterGroup}>
            <p>Язык</p>

            <select
              className={styles.select}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">Все языки</option>
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </aside>
      </section>
    </main>
  );
}