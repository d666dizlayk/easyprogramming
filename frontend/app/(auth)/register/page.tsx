"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {apiRequest} from "@/src/lib/api";

type Role = "programmer" | "business";

export default function RegisterPage(){
 const router=useRouter();
 const searchParams=useSearchParams();
 const initialRole=searchParams.get("role") === "business" ? "business" : "programmer";
 const [role,setRole]=useState<Role>(initialRole);
 const [username,setUsername]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [showConfirm,setShowConfirm]=useState(false);
 const [agree,setAgree]=useState(false);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault(); setError("");
  if(password!==confirm)return setError("Пароли не совпадают");
  if(password.length<8||password.length>128)return setError("Пароль должен содержать от 8 до 128 символов");
  if(/^\s|\s$/.test(password))return setError("Пароль не должен начинаться или заканчиваться пробелом");
  if(!/[A-Za-zА-Яа-яЁё]/.test(password))return setError("Пароль должен содержать хотя бы одну букву");
  if(!/[0-9]/.test(password))return setError("Пароль должен содержать хотя бы одну цифру");
  if(!agree)return setError("Необходимо принять Пользовательское соглашение и подтвердить согласие на обработку персональных данных");
  setLoading(true);
  try{
   const d=await apiRequest("/auth/register",{method:"POST",body:JSON.stringify({email,username,password,role})});
   const token=d?.token||d?.access_token;
   if(!token)throw new Error("Сервер не вернул токен");
   localStorage.setItem("token",token);
   router.replace(d?.user?.role === "business" ? "/business/tasks" : "/profile");
  }catch(e:any){setError(e?.message||"Не удалось создать аккаунт")}finally{setLoading(false)}
 }
 return <main className="ep-auth"><div className="ep-auth-grid"><section className="ep-auth-intro"><Link href="/" className="ep-brand"><img src="/site-logo.png" alt="Старт Комьюнити" className="ep-platform-logo" /></Link><div><div className="ep-eyebrow">НАЧНИТЕ СЕЙЧАС</div><h1>Первый шаг<br/><span>к реальному опыту.</span></h1><p>{role==="programmer"?"Решайте реальные задачи, развивайте стек и собирайте портфолио.":"Размещайте задачи, находите разработчиков и получайте готовые решения."}</p></div><Link href="/" className="ep-back">← На главную</Link></section><section className="ep-auth-panel"><div className="ep-auth-card"><div className="ep-eyebrow">НОВЫЙ АККАУНТ</div><h2>Регистрация</h2><p className="ep-auth-muted">Выберите формат аккаунта.</p><div className="ep-role-switch"><button type="button" className={role==="programmer"?"ep-role ep-role-active":"ep-role"} onClick={()=>setRole("programmer")}><strong>01</strong><span>Программист</span><small>решать задачи и строить портфолио</small></button><button type="button" className={role==="business"?"ep-role ep-role-active ep-role-business":"ep-role"} onClick={()=>setRole("business")}><strong>02</strong><span>Стартап / бизнес</span><small>размещать задачи и находить исполнителей</small></button></div><form onSubmit={submit} className="ep-form"><label>Имя пользователя<input value={username} onChange={e=>setUsername(e.target.value)} required placeholder={role==="business"?"company_name":"your_username"}/></label><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></label><label>Пароль<div className="ep-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Минимум 8 символов, буква + цифра"/><button type="button" className="ep-password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7"/></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a18.6 18.6 0 0 1-3.1 3.7M6.1 6.9C3.2 8.7 2 12 2 12a18.4 18.4 0 0 0 6.4 4.8A10.4 10.4 0 0 0 12 18c1.1 0 2.1-.2 3-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> }</button></div></label><p className="ep-auth-muted ep-password-hint">8–128 символов · буква + цифра · без пробелов по краям</p><label>Повторите пароль<div className="ep-password-field"><input type={showConfirm ? "text" : "password"} value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="••••••••"/><button type="button" className="ep-password-toggle" onClick={()=>setShowConfirm(v=>!v)} aria-label={showConfirm ? "Скрыть пароль" : "Показать пароль"} title={showConfirm ? "Скрыть пароль" : "Показать пароль"}>{showConfirm ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7"/></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a18.6 18.6 0 0 1-3.1 3.7M6.1 6.9C3.2 8.7 2 12 2 12a18.4 18.4 0 0 0 6.4 4.8A10.4 10.4 0 0 0 12 18c1.1 0 2.1-.2 3-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> }</button></div></label><label className="ep-check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>Я принимаю <a href="/legal/user-agreement.docx" target="_blank" rel="noreferrer">Пользовательское соглашение</a> и даю <a href="/legal/personal-data-consent.docx" target="_blank" rel="noreferrer">согласие на обработку персональных данных</a>. <a href="/legal/privacy-policy.docx" target="_blank" rel="noreferrer">Политика обработки ПД</a>.</span></label>{error&&<div className="ep-error">{error}</div>}<button className="ep-button" disabled={loading}>{loading?"Создаём…":"Создать аккаунт →"}</button></form><p className="ep-auth-bottom">Уже есть аккаунт? <Link href="/login">Войти</Link></p></div></section></div></main>
}
