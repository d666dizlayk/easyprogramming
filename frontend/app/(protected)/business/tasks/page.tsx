"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/src/lib/api";
import { TASK_LANGUAGES } from "@/src/lib/task-options";

const statusLabel: Record<string, string> = { pending: "На модерации", approved: "Опубликована", rejected: "Отклонена" };
const emptyForm = { title: "", description: "", difficulty: "easy", language: "", goal: "", conditions: "" };

export default function BusinessTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const searchParams = useSearchParams();

  async function load() {
    const me = await apiRequest("/users/me");
    if (me?.role !== "business") throw new Error("FORBIDDEN");
    const data = await apiRequest("/tasks/business/mine");
    setTasks(Array.isArray(data) ? data : []);
    setReady(true);
  }

  useEffect(() => { load().catch((e) => { setMessageType("error"); setMessage(e?.message || "Не удалось загрузить бизнес-раздел"); setReady(true); }); }, []);

  useEffect(() => {
    const taskParam = Number(searchParams.get("task"));
    if (ready && Number.isFinite(taskParam) && taskParam > 0) openSubmissions(taskParam);
  }, [ready, searchParams]);

  async function createOrUpdate(e: React.FormEvent) {
    e.preventDefault(); setMessage(""); setMessageType(""); setSaving(true);
    try {
      const path = editingId ? `/tasks/business/${editingId}` : "/tasks/business";
      await apiRequest(path, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(form) });
      const wasEditing = Boolean(editingId);
      setForm(emptyForm); setEditingId(null);
      setMessageType("success");
      setMessage(wasEditing ? "Изменения отправлены на повторную модерацию." : "Задача отправлена на модерацию.");
      await load();
    } catch (e: any) { setMessageType("error"); setMessage(e?.message || "Не удалось сохранить задачу"); }
    finally { setSaving(false); }
  }

  function editTask(t: any) {
    setEditingId(t.id);
    setForm({ title: t.title || "", description: t.description || "", difficulty: t.difficulty || "easy", language: t.language || "", goal: t.goal || "", conditions: t.conditions || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteTask(id: number) {
    if (!window.confirm("Удалить эту задачу?")) return;
    try { await apiRequest(`/tasks/business/${id}`, { method: "DELETE" }); setMessageType("success"); setMessage("Задача удалена."); await load(); if (selectedId === id) setSelectedId(null); }
    catch (e: any) { setMessageType("error"); setMessage(e?.message || "Не удалось удалить задачу"); }
  }

  async function openSubmissions(id: number) {
    setSelectedId(id); setSubmissions([]); setApplications([]);
    try {
      const [data, apps] = await Promise.all([apiRequest(`/submissions/business/task/${id}`), apiRequest(`/tasks/${id}/applications`)]);
      setSubmissions(Array.isArray(data) ? data : []);
      setApplications(Array.isArray(apps) ? apps : []);
      window.setTimeout(() => document.getElementById("business-submissions")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch (e: any) { setMessageType("error"); setMessage(e?.message || "Не удалось загрузить ответы и заявки"); }
  }

  const pending = useMemo(() => tasks.filter((t) => t.status === "pending").length, [tasks]);
  const approved = useMemo(() => tasks.filter((t) => t.status === "approved").length, [tasks]);
  const selectedTask = tasks.find((t) => t.id === selectedId);

  if (!ready) return <main className="ep-dashboard"><div className="ep-dash-wrap">Загрузка…</div></main>;

  return <main className="ep-dashboard"><div className="ep-dash-wrap">
    <div className="ep-dash-head"><div><div className="ep-eyebrow">МОИ ЗАДАЧИ</div><h1>Мои задачи</h1><p>Размещайте реальные задачи, следите за модерацией и смотрите решения разработчиков.</p></div><Link href="/" className="ep-back">← На главную</Link></div>

    <div className="ep-profile-stats ep-business-metrics"><div><strong>{tasks.length}</strong><span>всего задач</span></div><div><strong>{approved}</strong><span>опубликовано</span></div><div><strong>{pending}</strong><span>на модерации</span></div><div><strong>{submissions.length}</strong><span>ответов выбранной</span></div></div>

    <div className="ep-business-grid">
      <section className="ep-panel"><div className="ep-eyebrow">{editingId ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ ЗАДАЧА"}</div><h2>{editingId ? "Изменить задачу" : "Разместить задачу"}</h2>
        <form className="ep-business-form" onSubmit={createOrUpdate}>
          <label><span>название</span><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="Например: REST API для каталога"/></label>
          <label><span>описание</span><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required placeholder="Что нужно сделать и какой результат ожидается?"/></label>
          <div className="ep-form-row"><label><span>объём задачи</span><select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}><option value="easy">Легко</option><option value="medium">Средне</option><option value="hard">Сложно</option></select></label><label><span>язык программирования</span><select value={form.language} onChange={e=>setForm({...form,language:e.target.value})} required><option value="">Выберите язык</option>{TASK_LANGUAGES.map((item)=><option key={item} value={item}>{item}</option>)}</select></label></div>
          <label><span>цель</span><textarea value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} placeholder="Главная цель задачи"/></label>
          <label><span>условия</span><textarea value={form.conditions} onChange={e=>setForm({...form,conditions:e.target.value})} placeholder="Дополнительные требования"/></label>
          {message && <div role="alert" className={`ep-task-message ${messageType === "error" ? "error" : messageType === "success" ? "success" : ""}`}>{message}</div>}
          <div className="ep-actions-row"><button className="ep-button" disabled={saving}>{saving ? "Сохраняем…" : editingId ? "Отправить на модерацию →" : "Отправить на модерацию →"}</button>{editingId && <button type="button" className="ep-outline-button" onClick={()=>{setEditingId(null);setForm(emptyForm)}}>Отмена</button>}</div>
        </form>
      </section>

      <aside className="ep-panel"><div className="ep-eyebrow">ИСТОРИЯ</div><h2>Ваши публикации</h2><div className="ep-business-list">{tasks.length===0?<div className="ep-empty">Пока нет задач.</div>:tasks.map(t=><article key={t.id} className="ep-business-item"><div><strong>{t.title}</strong><span>#{t.id} · {t.language||"Язык не указан"}</span>{t.moderationMessage&&<span className="ep-business-note">Модератор: {t.moderationMessage}</span>}</div><div className="ep-business-actions"><b className={`ep-status ep-status-${t.status}`}>{statusLabel[t.status]||t.status}</b>{(t.status === "pending" || t.status === "rejected") && <button onClick={()=>editTask(t)} className="ep-mini-action">Изменить</button>}<button onClick={()=>openSubmissions(t.id)} className="ep-mini-action">Ответы</button>{t.status !== "approved" && <button onClick={()=>deleteTask(t.id)} className="ep-mini-action ep-mini-danger">Удалить</button>}</div></article>)}</div></aside>
    </div>

    {selectedTask && <section id="business-submissions" className="ep-panel ep-business-submissions">
      <div className="ep-eyebrow">ЗАЯВКИ И ОТВЕТЫ / TASK #{selectedTask.id}</div><h2>{selectedTask.title}</h2>
      <div className="ep-section-heading compact"><h3 style={{margin:0}}>Кандидаты</h3><span>{applications.filter(a=>a.status === "pending").length} на рассмотрении</span></div>
      <div className="ep-business-list">{applications.length===0?<div className="ep-empty">Пока нет заявок от разработчиков.</div>:applications.map(a=><div className="ep-business-item" key={a.id}><div><strong>{a.programmer?.username || "Разработчик"}</strong><span>{a.message || "Без сопроводительного сообщения"} · {a.status === "pending" ? "на рассмотрении" : a.status === "accepted" ? "назначен" : "отклонена"}</span></div><div className="ep-business-actions"><Link href={`/users/${a.programmer?.username || ""}`} className="ep-mini-action">Публичный профиль →</Link></div></div>)}</div>
      <div className="ep-section-heading compact" style={{marginTop:32}}><h3 style={{margin:0}}>Решения</h3></div>
      <div className="ep-business-list">{submissions.length===0?<div className="ep-empty">Пока нет отправленных решений.</div>:submissions.map(s=><div className="ep-business-item" key={s.id}><div><strong>{s.user?.username || "Разработчик"}</strong><span>{new Date(s.createdAt).toLocaleString("ru-RU")} · {s.status}</span></div>{s.moderationMessage && <span className="ep-business-note">Модератор: {s.moderationMessage}</span>}{s.githubUrl && <a className="ep-mini-action" href={s.githubUrl} target="_blank" rel="noreferrer">GitHub →</a>}</div>)}</div>
    </section>}
  </div></main>;
}
