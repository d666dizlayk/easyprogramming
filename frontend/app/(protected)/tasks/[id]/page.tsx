"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiRequest } from "@/src/lib/api";

const xp = (d: string) => d === "hard" ? 450 : d === "medium" ? 250 : 120;
const difficulty = (d: string) => d === "hard" ? "Сложная" : d === "medium" ? "Средняя" : "Небольшая";

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [applyMessage, setApplyMessage] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadApplication(user: any) {
    if (user?.role !== "programmer") return;
    try { setApplication(await apiRequest(`/tasks/${id}/my-application`)); } catch { setApplication(null); }
  }

  useEffect(() => {
    Promise.all([
      apiRequest(`/tasks/${id}`).then(setT).catch(() => setT(null)),
      apiRequest("/users/me").then(setMe).catch(() => setMe(null)),
    ]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!me) return;
    apiRequest(`/audit/tasks/${id}`).then((data) => setHistory(Array.isArray(data) ? data : [])).catch(() => setHistory([]));
    loadApplication(me);
    if (me?.role === "programmer") {
      apiRequest(`/submissions/me/task/${id}`)
        .then((data) => setMySubmissions(Array.isArray(data) ? data : []))
        .catch(() => setMySubmissions([]));
    }
  }, [me, id]);

  async function apply(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setBusy(true);
    try {
      const data = await apiRequest(`/tasks/${id}/apply`, { method: "POST", body: JSON.stringify({ message: applyMessage }) });
      setApplication(data); setMsg("Заявка отправлена бизнесу на рассмотрение.");
    } catch (e: any) { setMsg(e?.message || "Не удалось отправить заявку"); }
    finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    if (!url.trim()) return setMsg("Укажите ссылку на GitHub репозиторий");
    setBusy(true);
    try {
      const d = await apiRequest(`/tasks/${id}/submit`, { method: "POST", body: JSON.stringify({ githubUrl: url }) });
      setMsg(d?.message || "Решение отправлено на проверку"); setUrl("");
      const history = await apiRequest(`/submissions/me/task/${id}`);
      setMySubmissions(Array.isArray(history) ? history : []);
    } catch (e: any) { setMsg(e?.message || "Не удалось отправить решение"); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="ep-task-detail"><div className="ep-task-wrap">Загрузка…</div></main>;
  if (!t) return <main className="ep-task-detail"><div className="ep-task-wrap"><h1>Задача не найдена</h1><Link href="/tasks" className="ep-outline-button">← К задачам</Link></div></main>;

  const assigned = t.assignedProgrammer?.id;
  return <main className="ep-task-detail"><div className="ep-task-wrap">
    <div className="ep-task-head"><div className="ep-task-topline"><Link href="/tasks" className="ep-back">← Каталог задач</Link><div className="ep-task-xp"><strong>{xp(t.difficulty)}</strong><span>XP ЗА ПРИНЯТОЕ РЕШЕНИЕ</span></div></div>
      <div className="ep-eyebrow" style={{marginTop:24}}>ЗАДАЧА #{t.id}</div><div className="ep-task-hero-line"/><h1>{t.title}</h1>
      <div className="ep-task-meta"><span>{difficulty(t.difficulty)}</span><span>{t.language || "Язык не указан"}</span><span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString("ru-RU") : ""}</span></div>
    </div>
    <div className="ep-task-layout"><article className="ep-task-card"><div className="ep-eyebrow">ОПИСАНИЕ</div><div className="ep-task-copy">{t.description || "Описание задачи пока не добавлено."}</div>{t.goal && <><div className="ep-eyebrow ep-task-label">ЦЕЛЬ</div><div className="ep-task-copy">{t.goal}</div></>}{t.conditions && <><div className="ep-eyebrow ep-task-label">УСЛОВИЯ</div><div className="ep-task-copy">{t.conditions}</div></>}</article>
      <aside className="ep-submit-card">
        {!me ? <><div className="ep-eyebrow">НАЧАТЬ РЕШАТЬ</div><h2>Нужен аккаунт</h2><p>Войдите как программист, чтобы подать заявку на задачу.</p><Link href="/login" className="ep-button">Войти →</Link></>
        : me?.isAdmin ? <><div className="ep-eyebrow">РЕЖИМ АДМИНИСТРАТОРА</div><h2>Модерация задачи</h2><p>Полный контроль над публикациями и решениями находится в административном разделе.</p><Link href="/admin/tasks" className="ep-button">Открыть в админ-панели →</Link></>
        : me?.role === "business" ? <><div className="ep-eyebrow">РЕЖИМ БИЗНЕСА</div><h2>{t.business?.id === me.id ? "Ваша задача" : "Просмотр задачи"}</h2><p>{t.business?.id === me.id ? "Управляйте кандидатами и решениями из личного кабинета бизнеса." : "Бизнес-пользователи могут просматривать задачи, но не подают решения."}</p>{t.business?.id === me.id ? <Link href="/business/tasks" className="ep-button">Управлять задачами →</Link> : <Link href="/business" className="ep-outline-button">В личный кабинет →</Link>}</>
        : t.status === "completed" ? <><div className="ep-eyebrow">ЗАДАЧА ЗАВЕРШЕНА</div><h2>Решение принято</h2><p>Эта задача уже завершена и решение прошло модерацию.</p></>
        : application?.status === "accepted" || (t.status === "in_progress" && assigned === me?.id) ? <><div className="ep-eyebrow">НАЗНАЧЕНА ВАМ</div><h2>Готовое решение</h2><p>Загрузите решение в GitHub и отправьте ссылку на репозиторий. После отправки решение попадёт на проверку модератору.</p>{t.status === "review" ? <div className="ep-business-readonly"><strong>Решение на проверке</strong><p>Дождитесь результата модерации.</p></div> : <><form onSubmit={submit}><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://github.com/user/repository"/><button className="ep-button" disabled={busy}>{busy ? "Отправляем…" : "Отправить решение →"}</button></form>{[...mySubmissions].filter((s) => s.status === "failed" && s.moderationMessage).slice(0,1).map((s) => <div className="ep-error-inline" key={s.id}><strong>Решение возвращено на доработку</strong><div>{s.moderationMessage}</div></div>)}</>}</>
        : application ? <><div className="ep-eyebrow">ЗАЯВКА</div><h2>{application.status === "declined" ? "Заявка отклонена" : "Заявка на рассмотрении"}</h2><p>{application.status === "declined" ? "Бизнес отклонил эту заявку. Можно подать новую." : "Бизнес ещё не принял решение по вашей заявке."}</p>{application.status === "declined" && <form onSubmit={apply}><textarea value={applyMessage} onChange={e=>setApplyMessage(e.target.value)} placeholder="Коротко расскажите, почему вы подходите для задачи"/><button className="ep-button" disabled={busy}>Подать заявку снова →</button></form>}</>
        : <><div className="ep-eyebrow">ЗАЯВКА НА ЗАДАЧУ</div><h2>Хотите решить эту задачу?</h2><p>Сначала подайте заявку. После назначения бизнесом появится возможность отправить GitHub-решение.</p><form onSubmit={apply}><textarea value={applyMessage} onChange={e=>setApplyMessage(e.target.value)} placeholder="Коротко расскажите о релевантном опыте"/><button className="ep-button" disabled={busy}>{busy ? "Отправляем…" : "Подать заявку →"}</button></form></>}
        {msg && <div className="ep-task-message">{msg}</div>}
      </aside>
    </div>
    {history.length > 0 && (
      <section className="ep-task-history">
        <div className="ep-eyebrow">ИСТОРИЯ ЗАДАЧИ</div>
        <div className="ep-history-list">
          {history.map((event) => (
            <div className="ep-history-row" key={event.id}>
              <div className="ep-history-dot" />
              <div>
                <strong>{String(event.action || "").replaceAll("_", " ")}</strong>
                {event.message && <p>{event.message}</p>}
                <span>{event.createdAt ? new Date(event.createdAt).toLocaleString("ru-RU") : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}
  </div></main>;
}
