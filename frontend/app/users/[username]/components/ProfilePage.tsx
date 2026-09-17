"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getLevelInfo } from "@/src/lib/levels";
import { API_URL } from "@/src/lib/api";

export default function ProfilePage({
  user,
  stats,
  solvedTasks,
  businessTasks = [],
  isOwner,
  edit,
  bio,
  setBio,
  setEdit,
  saveProfile,
  uploadAvatar,
  bioRef,
}: any) {
  const isBusiness = user?.role === "business";
  const exp = Number(user?.exp ?? 0);
  const level = getLevelInfo(exp);
  const solved = Array.isArray(solvedTasks) ? solvedTasks : [];
  const publishedTasks = Array.isArray(businessTasks) ? businessTasks.filter((t: any) => t.status === "approved") : [];
  const total = stats?.total ?? solved.length;
  const easy = stats?.easy ?? 0;
  const medium = stats?.medium ?? 0;
  const hard = stats?.hard ?? 0;
  const tasks = useMemo(() => solved.slice(0, 8), [solved]);
  const completedCount = isBusiness ? 0 : solved.length;
  const nextNeed = level.max === Infinity ? 0 : Math.max(0, level.max + 1 - exp);
  const avatar = user?.avatar
    ? (API_URL.startsWith("/") ? `/uploads/${user.avatar}` : `${API_URL}/uploads/${user.avatar}`)
    : "/default-avatar.png";

  return (
    <main className="ep-profile">
      <div className="ep-profile-wrap">
        <div className="ep-profile-topline">
          <div className="ep-profile-nav">
            <Link href="/rating" className="ep-back">← к рейтингу</Link>
            <Link href={isBusiness ? "/business" : "/profile"} className="ep-back">Личный кабинет →</Link>
          </div>
          <span className="ep-eyebrow">EASYPROGRAMMING / PROFILE</span>
        </div>

        <header className="ep-profile-head">
          <label className="ep-profile-avatar">
            <img src={avatar} alt="avatar" />
            {isOwner && <span>Изменить</span>}
            {isOwner && (
              <input type="file" accept="image/*" hidden onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }} />
            )}
          </label>

          <div className="ep-profile-identity">
            <div className="ep-eyebrow">{isBusiness ? "БИЗНЕС / ПРОФИЛЬ" : `ПРОГРАММИСТ / УРОВЕНЬ ${level.level}`}</div>
            <h1>{user?.username || "Пользователь"}</h1>
            {isOwner && edit ? (
              <textarea ref={bioRef} value={bio} onChange={(e) => setBio(e.target.value)} className="ep-profile-bio-edit" placeholder="Расскажите о себе" />
            ) : (
              <p>{user?.bio || (isBusiness ? "Команда, которая публикует реальные задачи для разработчиков." : "Разработчик, который превращает реальные задачи в опыт.")}</p>
            )}
            <div className="ep-tags">
              {isBusiness ? <span>STARTUP / BUSINESS</span> : ((user?.stack || []).slice(0, 10).map((x: string) => <span key={x}>{x}</span>))}
              {!isBusiness && !user?.stack?.length && <span className="ep-tag-muted">СТЕК ПОКА НЕ УКАЗАН</span>}
            </div>
          </div>

          <div className="ep-profile-level">
            {isBusiness ? <><span>ROLE</span><strong>BIZ</strong><small>{publishedTasks.length} TASKS</small></> : <><span>LEVEL</span><strong>{level.level}</strong><small>{exp} XP</small></>}
          </div>
        </header>

        {isOwner && (
          <div className="ep-profile-actions">
            {edit ? <>
              <button className="ep-button ep-button-small" onClick={saveProfile}>Сохранить профиль</button>
              <button className="ep-outline-button ep-button-small" onClick={() => setEdit(false)}>Отмена</button>
            </> : <button className="ep-outline-button ep-button-small" onClick={() => setEdit(true)}>Редактировать профиль</button>}
            <button className="ep-outline-button ep-button-small ep-logout-profile" onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
              Выйти из аккаунта
            </button>
          </div>
        )}

        <section className="ep-profile-dashboard">
          <aside className="ep-profile-sidebar">
            {isBusiness ? (
              <div className="ep-profile-card ep-level-card">
                <div className="ep-eyebrow">АКТИВНОСТЬ</div>
                <div className="ep-profile-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div><strong>{publishedTasks.length}</strong><span>опубликовано</span></div>
                  <div><strong>{businessTasks.length}</strong><span>всего задач</span></div>
                </div>
              </div>
            ) : (
              <div className="ep-profile-card ep-level-card">
                <div className="ep-eyebrow">ПРОГРЕСС</div>
                <div className="ep-level-ring" style={{ "--progress": `${level.progress}%` } as React.CSSProperties}>
                  <div className="ep-level-ring-inner"><strong>{Math.round(level.progress)}%</strong></div>
                </div>
                <div className="ep-level-copy">
                  <strong>Уровень {level.level}</strong>
                  <span>{level.max === Infinity ? "Максимальный уровень" : `${nextNeed} XP до следующего`}</span>
                </div>
                <div className="ep-progress"><span style={{ width: `${level.progress}%` }} /></div>
                <div className="ep-progress-meta"><span>{level.min} XP</span><span>{level.max === Infinity ? "∞" : `${level.max + 1} XP`}</span></div>
              </div>
            )}

            {!isBusiness && <div className="ep-profile-card">
              <div className="ep-eyebrow">ТЕХНОЛОГИИ</div>
              <h2>Стек</h2>
              <div className="ep-stack-list">
                {(user?.stack || []).slice(0, 12).map((x: string) => <span key={x}>{x}</span>)}
                {!user?.stack?.length && <div className="ep-empty">Добавьте технологии в настройках профиля.</div>}
              </div>
            </div>}
          </aside>

          <div className="ep-profile-main">
            {isBusiness ? (
              <section className="ep-profile-card">
                <div className="ep-section-heading compact"><div><div className="ep-eyebrow">ЗАДАЧИ БИЗНЕСА</div><h2>Публичные задачи.</h2></div><div className="ep-xp-big">{publishedTasks.length}<small>TASKS</small></div></div>
                <div className="ep-portfolio-list">
                  {publishedTasks.length ? publishedTasks.map((t: any, i: number) => (
                    <Link href={`/tasks/${t.id}`} className="ep-portfolio-row" key={t.id}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{t.title}</strong><small>{t.language || "REAL TASK"}</small></div><em>{t.difficulty || "task"}</em><b>→</b></Link>
                  )) : <div className="ep-empty">Пока нет опубликованных задач.</div>}
                </div>
              </section>
            ) : (
              <>
                <section className="ep-profile-card">
                  <div className="ep-section-heading compact"><div><div className="ep-eyebrow">СТАТИСТИКА</div><h2>Ваш прогресс.</h2></div><div className="ep-xp-big">{exp}<small>XP</small></div></div>
                  <div className="ep-profile-stats"><div><strong>{completedCount}</strong><span>решено</span></div><div><strong>{easy}</strong><span>лёгких</span></div><div><strong>{medium}</strong><span>средних</span></div><div><strong>{hard}</strong><span>сложных</span></div></div>
                </section>
                <section className="ep-portfolio">
                  <div className="ep-section-heading"><div><div className="ep-eyebrow">ПОРТФОЛИО</div><h2>Работы, которые <span>остались.</span></h2></div><Link href="/tasks" className="ep-outline-button">Открыть задачи →</Link></div>
                  <div className="ep-portfolio-list">{tasks.length ? tasks.map((t: any, i: number) => {
                    const taskHref = `/tasks/${t.taskId || t.id}`;
                    const githubUrl = t.githubUrl || t.github || null;
                    return (
                      <div className="ep-portfolio-row ep-portfolio-row-rich" key={t.id || i}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <Link href={taskHref} className="ep-portfolio-task">
                          <strong>{t.title || t.task?.title || "Задача"}</strong>
                          <small>{t.language || t.task?.language || "REAL TASK"}</small>
                        </Link>
                        <em>{t.difficulty || "completed"}</em>
                        <div className="ep-portfolio-links">
                          {githubUrl ? <a href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub repository">GH</a> : null}
                          <Link href={taskHref} aria-label="Открыть задачу">→</Link>
                        </div>
                      </div>
                    );
                  }) : <div className="ep-empty">Здесь появятся задачи, решения которых принял модератор.</div>}</div>
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
