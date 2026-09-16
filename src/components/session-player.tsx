"use client";
import Link from "next/link";
import "./session-player.css";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { sessionCommand } from "@/actions/attempts";
import type { Command, PublicState } from "@/lib/session-engine";
export default function SessionPlayer({id,title,execute,local=false}:{id:string;title:string;execute?:(command:Command)=>Promise<PublicState>;local?:boolean}) {
 const [state,setState]=useState<PublicState|null>(null),[index,setIndex]=useState(0),[error,setError]=useState("");
 const [pending,setPending]=useState(false),[left,setLeft]=useState(0);
 const latest=useRef<PublicState|null>(null),inFlight=useRef<Promise<PublicState>|null>(null),mutating=useRef(false);
 const clock=useRef({deadline:0,received:0}),heading=useRef<HTMLHeadingElement>(null);
 async function send(type:Command["type"],option?:number,at=index){
  const mutation=type!=="poll";
  if(mutation){if(mutating.current)return;mutating.current=true;setPending(true);try{await inFlight.current;}catch{/* Retry using the last confirmed state. */}}
  else if(inFlight.current||mutating.current)return;
  let request:Promise<PublicState>|null=null;
  try{
   const current=latest.current;
   const command={type,option,index:at,revision:current?.revision??0};
   request=execute?execute(command):sessionCommand(id,command);inFlight.current=request;
   const next=await request;
   latest.current=next;setState(next);setError("");
   clock.current={deadline:Math.max(0,next.deadline-next.serverNow),received:performance.now()};
   setLeft(Math.max(0,Math.ceil((next.deadline-next.serverNow)/1000)));
   if(type==="select"&&next.answers[at]!==option)setError("Lựa chọn chưa được nhận: câu đã hết giờ hoặc bài vừa thay đổi ở tab khác. Kiểm tra trạng thái hiện tại.");
  }catch{setError("Chưa kết nối được. Lựa chọn chưa được xác nhận lưu; thời gian vẫn tiếp tục tính. Hãy thử lại.");}
  finally{if(inFlight.current===request)inFlight.current=null;if(mutation){mutating.current=false;setPending(false);}}
 }
 const lastPoll=useRef(0);
 const poll=useEffectEvent((force=false)=>{const s=latest.current,c=clock.current;const due=c.deadline-(performance.now()-c.received)<=0;if(s?.phase!=="finished"&&(force||!s||due||performance.now()-lastPoll.current>=5000)){lastPoll.current=performance.now();void send("poll");}});
 useEffect(()=>{
  poll(true);const timer=window.setInterval(()=>poll(),500);
  const clockTimer=window.setInterval(()=>{const c=clock.current;setLeft(Math.max(0,Math.ceil((c.deadline-(performance.now()-c.received))/1000)));},100);
  const focus=()=>poll(true);window.addEventListener("focus",focus);window.addEventListener("online",focus);
  return()=>{clearInterval(timer);clearInterval(clockTimer);window.removeEventListener("focus",focus);window.removeEventListener("online",focus);};
 },[]);
 const active=state?.quiz?state.index:index;
 useEffect(()=>{heading.current?.focus();},[active]);
 const backHref=local?"/quiz":"/history";
 if(!state)return <section className="exam-layout"><div className="exam-card exam-loading"><span className="exam-eyebrow">CHUẨN BỊ BÀI LÀM</span><h1>{title}</h1><p role="status">{error||"Đang khôi phục bài làm…"}</p>{error&&<button className="button secondary" onClick={()=>void send("poll")}>Thử lại</button>}</div></section>;
 const answered=state.answers.filter(a=>a>=0).length,total=state.questions.length;
 if(state.phase==="finished")return <section className="exam-layout"><div className="exam-card exam-complete"><span className="exam-complete-icon" aria-hidden="true">✓</span><span className="exam-eyebrow">ĐÃ HOÀN THÀNH</span><h1>{title}</h1><div className="exam-score">{state.score}<span> / {total}</span></div><p>{Math.round((state.score??0)/total*100)}% chính xác · {total-answered} câu chưa trả lời</p><div className="exam-complete-actions"><Link className="button primary" href={`/attempts/${id}`}>Xem đáp án & giải thích →</Link><Link className="exam-text-link" href={backHref}>{local?"Chọn quiz khác":"Về lịch sử làm bài"}</Link></div><small>Kết quả đã lưu {local?"trên trình duyệt này":"vào tài khoản của bạn"}.</small></div></section>;
 const q=state.questions[active!],feedback=state.feedback;
 const urgent=left<=(state.quiz?2:60)&&state.phase!=="feedback";
 return <section className="exam-layout">
  <header className="exam-header">
   <div className="exam-heading"><span className="exam-eyebrow">{state.quiz?"QUIZ TỪ VỰNG":"BÀI KIỂM TRA"}</span><p>{title}</p></div>
   <div className={`exam-clock${urgent?" is-urgent":""}`}><span>{state.phase==="feedback"?"CHUYỂN CÂU":state.quiz?"MỖI CÂU 5 GIÂY":"CÒN LẠI"}</span><strong role="timer" aria-live="off">{state.phase==="feedback"?"•••":`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`}</strong></div>
  </header>
  <div className="exam-progress"><progress aria-label="Tiến độ làm bài" max={total} value={state.quiz?state.index:answered}/></div>
  <div className="exam-card">
   <div className="exam-question-meta"><span>Câu <strong>{String(active!+1).padStart(2,"0")}</strong> / {String(total).padStart(2,"0")}</span><span>{state.quiz?"Chọn một đáp án":`${answered}/${total} đã trả lời`}</span></div>
   <h1 ref={heading} tabIndex={-1} className="exam-question">{q.prompt}</h1>
   <div className="exam-options">{q.options.map((option,i)=>{
    const selected=state.answers[active!]===i;
    const correct=feedback?.answer===i,wrong=!!feedback&&selected&&!correct;
    return <button key={i} className={`exam-option${selected?" is-selected":""}${correct?" is-correct":""}${wrong?" is-wrong":""}`} disabled={pending||state.phase==="feedback"||left===0} aria-pressed={selected} onClick={()=>void send("select",i,active!)}><span className="exam-option-letter">{String.fromCharCode(65+i)}</span><span className="exam-option-text">{option}</span><span className="exam-option-indicator" aria-hidden="true">{correct?"✓":wrong?"×":selected?"●":""}</span></button>;
   })}</div>
   {feedback&&<div role="status" className={`exam-feedback${feedback.correct?" is-correct":""}`}><strong>{state.answers[state.index]===-1?"Hết giờ, chưa trả lời.":feedback.correct?"Chính xác!":"Chưa đúng."}</strong>{!feedback.correct&&<p>Đáp án: {q.options[feedback.answer]}</p>}<p>{feedback.explanation}</p></div>}
   {!state.quiz&&<div className="exam-controls"><button className="exam-text-link" disabled={pending||index===0} onClick={()=>setIndex(i=>i-1)}>← Câu trước</button>{index<total-1?<button className="button secondary" disabled={pending} onClick={()=>setIndex(i=>i+1)}>Câu tiếp →</button>:<span className="exam-last-question">Câu cuối cùng</span>}</div>}
  </div>
  {!state.quiz&&<div className="exam-bottom"><details className="exam-map"><summary>Danh sách câu hỏi <span>{answered}/{total}</span></summary><nav aria-label="Chọn câu hỏi">{state.questions.map((_,i)=><button key={i} disabled={pending} className={state.answers[i]>=0?"is-answered":""} aria-label={`Câu ${i+1}${state.answers[i]>=0?", đã trả lời":", chưa trả lời"}`} aria-current={i===index?"step":undefined} onClick={()=>setIndex(i)}>{i+1}</button>)}</nav><p>Ô xanh: đã trả lời · Ô viền đậm: đang xem</p></details><button className="button primary exam-submit" disabled={pending||left===0} onClick={()=>{if(window.confirm(`Bạn đã chọn ${answered}/${total} câu. Nộp bài để xem điểm và đáp án?`))void send("submit");}}>Nộp bài</button></div>}
  <footer className="exam-footer"><p role="status" className={error?"exam-error":"exam-save"}>{error||(pending?"Đang lưu…":left===0?"Đang xác nhận hết giờ…":"✓ Đã lưu lựa chọn")}</p><Link className="exam-text-link" href={backHref}>Rời bài →</Link></footer>
  <p className="exam-footnote">{state.quiz?"Thời gian vẫn tiếp tục khi bạn rời bài.":"Đáp án hiển thị sau khi nộp. Rời bài không dừng đồng hồ."}</p>
 </section>;
}
