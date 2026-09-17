"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/src/lib/api";

const steps = [
  ["01", "Задача", "Стартап публикует реальную задачу и описывает требования."],
  ["02", "Отклик", "Разработчик выбирает подходящую задачу и берёт её в работу."],
  ["03", "Решение", "Готовое решение отправляется на проверку модератору."],
  ["04", "Портфолио", "Принятые работы становятся частью опыта разработчика."],
];

const features = [
  "Реальные задачи вместо учебных кейсов",
  "Понятный процесс от задачи до готового решения",
  "XP и рейтинг за подтверждённый опыт",
];

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [accountRole, setAccountRole] = useState<"programmer" | "business" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return;
    }

    apiRequest("/users/me")
      .then((user) => { setAuthenticated(true); setAccountRole(user?.role ?? null); })
      .catch(() => {
        // Не удаляем токен автоматически: временная недоступность API
        // не должна неожиданно разлогинивать пользователя.
      })
      .finally(() => setReady(true));
  }, []);

  return (
    <main className="ep-home">
      <nav className="ep-nav">
        <Link href="/" className="ep-brand">
          <img src="/site-logo.png" alt="Старт Комьюнити" className="ep-platform-logo" />
        </Link>
        <div className="ep-nav-links">
          <a href="#how">Как это работает</a>
          <Link href="/tasks">Задачи</Link>
          <Link href="/rating">Рейтинг</Link>
        </div>
        <div className="ep-nav-actions">
          {ready && authenticated ? (
            <Link href={accountRole === "business" ? "/business/tasks" : "/profile"} className="ep-button ep-button-small">Личный кабинет</Link>
          ) : (
            <>
              <Link href="/login" className="ep-link-button">Войти</Link>
              <Link href="/register?role=business" className="ep-outline-button ep-button-small">Для бизнеса</Link>
              <Link href="/register" className="ep-button ep-button-small">Регистрация</Link>
            </>
          )}
        </div>
      </nav>

      <section className="ep-hero">
        <div className="ep-hero-copy">
          <div className="ep-eyebrow">ПЛАТФОРМА ДЛЯ РАЗРАБОТЧИКОВ И СТАРТАПОВ</div>
          <h1>Реальные задачи.<br /><span>Реальный опыт.</span></h1>
          <p>
            EasyProgramming соединяет бизнес с разработчиками, которые хотят
            решать настоящие задачи, прокачивать навыки и собирать сильное портфолио.
          </p>
          <div className="ep-hero-actions">
            <Link href="/register" className="ep-button">Начать работать <span>→</span></Link>
            <Link href="/tasks" className="ep-outline-button">Посмотреть задачи</Link>
          </div>
        </div>
        <div className="ep-hero-art" aria-hidden="true">
          <div className="ep-orbit ep-orbit-one" />
          <div className="ep-orbit ep-orbit-two" />
          <div className="ep-code-card">
            <span className="muted">task</span>
            <strong>build something<br />worth showing</strong>
            <span className="line" />
            <span className="green">status: in_progress</span>
          </div>
        </div>
      </section>

      <section className="ep-stats">
        <div><strong>01</strong><span>реальные задачи</span></div>
        <div><strong>04</strong><span>шага до портфолио</span></div>
        <div><strong>XP</strong><span>за подтверждённый опыт</span></div>
        <div><strong>∞</strong><span>возможностей расти</span></div>
      </section>

      <section id="how" className="ep-section">
        <div className="ep-section-heading">
          <div className="ep-eyebrow">КАК ЭТО РАБОТАЕТ</div>
          <h2>От задачи до строчки<br /><span>в портфолио.</span></h2>
        </div>
        <div className="ep-steps">
          {steps.map(([number, title, text]) => (
            <article className="ep-step" key={number}>
              <span className="ep-step-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ep-split">
        <div className="ep-split-card ep-business">
          <div className="ep-eyebrow">ДЛЯ СТАРТАПОВ И БИЗНЕСА</div>
          <h2>Есть задача?<br /><span>Найдите исполнителя.</span></h2>
          <p>Размещайте задачи, получайте решения и находите разработчиков под будущие проекты.</p>
          <Link href="/register?role=business" className="ep-outline-button">Разместить задачу →</Link>
        </div>
        <div className="ep-split-card ep-dev">
          <div className="ep-eyebrow">ДЛЯ СТУДЕНТОВ И JUNIOR</div>
          <h2>Нужен опыт?<br /><span>Начните его создавать.</span></h2>
          <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <Link href="/tasks" className="ep-button">Начать решать →</Link>
        </div>
      </section>

      <section className="ep-partners">
        <div className="ep-eyebrow">ПАРТНЁРСКАЯ ПОДДЕРЖКА</div>
        <div className="ep-support-logos">
          <div className="ep-support-logo ep-support-logo-light">
            <img src="/fasie-logo.png" alt="Фонд содействия инновациям" />
          </div>
          <div className="ep-support-logo ep-support-logo-dark">
            <img src="/platform-logo.svg" alt="EasyProgramming" />
          </div>
        </div>
        <p className="ep-support-text">
          Проект реализован при поддержке Фонда содействия инновациям в рамках программы
          «Студенческий стартап» мероприятия «Платформа университетского технологического
          предпринимательства» федерального проекта «Технологии».
        </p>
      </section>

      <footer className="ep-footer">
        <span>EasyProgramming</span>
        <span>Платформа реального опыта для разработчиков</span>
        <nav className="ep-footer-links" aria-label="Документы">
          <a href="/legal/user-agreement.docx" target="_blank" rel="noreferrer">Соглашение</a>
          <a href="/legal/privacy-policy.docx" target="_blank" rel="noreferrer">Политика ПД</a>
          <a href="/legal/personal-data-consent.docx" target="_blank" rel="noreferrer">Согласие на обработку ПД</a>
          <a href="/legal/personal-data-distribution-consent.docx" target="_blank" rel="noreferrer">Согласие на распространение ПД</a>
        </nav>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
