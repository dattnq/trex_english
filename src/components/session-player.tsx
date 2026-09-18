"use client";
import Link from "next/link";
import { ReadingPassage, QuestionMap } from "./reading-passage";
import "./session-player.css";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { sessionCommand } from "@/actions/attempts";
import type { Command, PublicState } from "@/lib/session-engine";
import { createSessionSync, type SessionView } from "@/lib/session-sync";
export default function SessionPlayer({id,title,execute,local=false}:{id:string;title:string;execute?:(command:Command)=>Promise<PublicState>;local?:boolean}) {
 const [view,setView]=useState<SessionView>({state:null,answers:[],saving:false,submitting:false,error:""});
 const {state,answers,saving:pending,submitting,error}=view;
 const [index,setIndex]=useState(0),[left,setLeft]=useState(0);
 const latest=useRef<PublicState|null>(null),sync=useRef<ReturnType<typeof createSessionSync>|null>(null);
 const executor=useRef(execute);
 useEffect(()=>{executor.current=execute;},[execute]);
 const clock=useRef({deadline:0,received:0}),heading=useRef<HTMLHeadingElement>(null);
 function send(type:Command["type"],option?:number,at=index){
  if(type==="select"&&option!==undefined)sync.current?.select(at,option);
  else if(type==="submit")sync.current?.submit();
  else sync.current?.poll();
 }
 useEffect(()=>{
  latest.current=null;
  const controller=createSessionSync(command=>executor.current?executor.current(command):sessionCommand(id,command),next=>{
   if(next.state&&next.state!==latest.current){
    const sameQuizQuestion=next.state.quiz&&next.state.phase==="answering"&&latest.current?.phase==="answering"&&latest.current.index===next.state.index;
    latest.current=next.state;
    if(!sameQuizQuestion){
    clock.current={deadline:Math.max(0,next.state.deadline-next.state.serverNow),received:performance.now()};
    setLeft(Math.max(0,Math.ceil((next.state.deadline-next.state.serverNow)/1000)));
    }
   }
   setView(next);
  });
  sync.current=controller;
  controller.poll();
  const beforeUnload=(event:BeforeUnloadEvent)=>{if(controller.isSaving()){event.preventDefault();event.returnValue="";}};
  const leave=(event:MouseEvent)=>{
   const link=event.target instanceof Element?event.target.closest("a[href]"):null;
   if(!controller.isSaving()||!link||link.getAttribute("target")==="_blank"||event.ctrlKey||event.metaKey||event.shiftKey||event.button!==0)return;
   if(!window.confirm("Đáp án đang được lưu. Rời trang bây giờ có thể mất lựa chọn chưa gửi. Bạn vẫn muốn rời bài?")){event.preventDefault();event.stopPropagation();}
  };
  window.addEventListener("beforeunload",beforeUnload);document.addEventListener("click",leave,true);
  return()=>{controller.dispose();sync.current=null;window.removeEventListener("beforeunload",beforeUnload);document.removeEventListener("click",leave,true);};
 },[id]);
 const lastPoll=useRef(0);
 const poll=useEffectEvent((force=false)=>{const s=latest.current,c=clock.current;const due=c.deadline-(performance.now()-c.received)<=0;if(s?.phase!=="finished"&&(force||!s||due||(!s.quiz&&performance.now()-lastPoll.current>=5000))){lastPoll.current=performance.now();void send("poll");}});
 useEffect(()=>{
  poll(true);const timer=window.setInterval(()=>poll(),500);
  const clockTimer=window.setInterval(()=>{const c=clock.current;setLeft(Math.max(0,Math.ceil((c.deadline-(performance.now()-c.received))/1000)));},100);
  const focus=()=>poll(true);window.addEventListener("focus",focus);window.addEventListener("online",focus);
  return()=>{clearInterval(timer);clearInterval(clockTimer);window.removeEventListener("focus",focus);window.removeEventListener("online",focus);};
 },[]);
 const active=state?.quiz?state.index:index;
 useEffect(()=>{heading.current?.focus();},[active]);
 const backHref=local?"/quiz":"/history";
 if(!state||state.phase==="ready")return <section className="exam-layout"><div className="exam-card exam-loading"><span className="exam-eyebrow">CHUẨN BỊ BÀI LÀM</span><h1>{title}</h1><p role="status">{error||"Đang khôi phục bài làm…"}</p>{error&&<button className="button secondary" onClick={()=>void send("poll")}>Thử lại</button>}</div></section>;
 const answered=answers.filter(a=>a>=0).length,total=state.questions.length;
 if(state.phase==="finished")return <section className={`exam-layout${state.quiz ? "" : " exam-test"}`}><div className="exam-card exam-complete"><span className="exam-complete-icon" aria-hidden="true">✓</span><span className="exam-eyebrow">ĐÃ HOÀN THÀNH</span><h1>{title}</h1><div className="exam-score">{state.score}<span> / {total}</span></div><p>{Math.round((state.score??0)/total*100)}% chính xác · {total-answered} câu chưa trả lời</p><div className="exam-complete-actions"><Link className="button primary" href={`/attempts/${id}`}>Xem đáp án & giải thích →</Link><Link className="exam-text-link" href={backHref}>{local?"Chọn quiz khác":"Về lịch sử làm bài"}</Link></div><small>Kết quả đã lưu {local?"trên trình duyệt này":"vào tài khoản của bạn"}.</small></div></section>;
 const q=state.questions[active!],feedback=state.feedback;
 const urgent=left<=(state.quiz?3:60)&&state.phase!=="feedback";
 return <section className={`exam-layout${state.quiz ? "" : " exam-test"}`}>
  <header className="exam-header">
   <div className="exam-heading"><span className="exam-eyebrow">{state.quiz?"QUIZ TỪ VỰNG":"BÀI KIỂM TRA"}</span><p>{title}</p></div>
   <div className={`exam-clock${urgent?" is-urgent":""}`}><span>{state.phase==="feedback"?"CHUYỂN CÂU":state.quiz?"MỖI CÂU 10 GIÂY":"CÒN LẠI"}</span><strong role="timer" aria-live="off">{state.phase==="feedback"?"•••":`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`}</strong></div>
  </header>
  <div className="exam-progress"><progress aria-label="Tiến độ làm bài" max={total} value={state.quiz?state.index:answered}/></div>
  {state.quiz&&<div className={`quiz-countdown${urgent?" is-urgent":""}`}><div><span>{state.phase==="feedback"?"Đang hiển thị đáp án":"Thời gian trả lời"}</span><strong>{state.phase==="feedback"?"Tự chuyển sang câu tiếp theo":`${left} / 10 giây`}</strong></div><progress aria-label="Thời gian trả lời còn lại" max={10} value={state.phase==="feedback"?0:Math.min(10,left)}/></div>}
  <div className={state.quiz ? "" : `reading-exam-grid${q.reading ? " has-reading" : ""}`}>
  {!state.quiz && q.reading && <aside className="reading-exam-passage" key={q.reading.id} aria-label="Nội dung bài đọc"><ReadingPassage reading={q.reading}/></aside>}
  <div className="exam-card">
   <div className="exam-question-meta"><span>Câu <strong>{String(q.number ?? active!+1).padStart(2,"0")}</strong></span><span>{state.quiz?"Chọn một đáp án":`${answered}/${total} đã trả lời`}</span></div>
   <h1 ref={heading} tabIndex={-1} className="exam-question">{q.prompt}</h1>
   <div className="exam-options">{q.options.map((option,i)=>{
    const selected=answers[active!]===i;
    const correct=feedback?.answer===i,wrong=!!feedback&&selected&&!correct;
    return <button key={i} className={`exam-option${selected?" is-selected":""}${correct?" is-correct":""}${wrong?" is-wrong":""}`} disabled={submitting||(state.quiz&&pending)||state.phase!=="answering"||left===0} aria-pressed={selected} onClick={()=>void send("select",i,active!)}><span className="exam-option-letter">{String.fromCharCode(65+i)}</span><span className="exam-option-text">{option}</span><span className="exam-option-indicator" aria-hidden="true">{correct?"✓":wrong?"×":selected?"●":""}</span></button>;
   })}</div>
   {feedback&&<div role="status" className={`exam-feedback${feedback.correct?" is-correct":""}`}><strong>{state.answers[state.index]===-1?"Hết giờ, chưa trả lời.":feedback.correct?"Chính xác!":"Chưa đúng."}</strong>{!feedback.correct&&<p>Đáp án: {q.options[feedback.answer]}</p>}<p>{feedback.explanation}</p></div>}
   {!state.quiz&&<div className="exam-controls"><button className="exam-text-link" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>← Câu trước</button>{index<total-1?<button className="button secondary" onClick={()=>setIndex(i=>i+1)}>Câu tiếp →</button>:<span className="exam-last-question">Câu cuối cùng</span>}</div>}
  </div>
  {!state.quiz&&<aside className="reading-exam-navigation">
    <h2>Bảng câu hỏi</h2><p>{answered}/{total} câu đã trả lời</p>
    <QuestionMap numbers={state.questions.map((item,i)=>item.number??i+1)} answered={answers.map(answer=>answer>=0)} active={index} onSelect={setIndex}/>
    <p>Ô xanh: đã chọn đáp án<br/>Ô trắng: chưa trả lời<br/>Viền đậm: đang xem</p>
    <button className="button primary exam-submit" disabled={pending||left===0} onClick={()=>{if(window.confirm(`Bạn đã chọn ${answered}/${total} câu. Nộp bài để xem điểm và đáp án?`))void send("submit");}}>Nộp bài</button>
  </aside>}
  </div>
  <footer className="exam-footer"><p role="status" className={error?"exam-error":"exam-save"}>{error||(submitting?"Đang nộp bài…":pending?(state.quiz?"Đang lưu đáp án…":"Đang lưu đáp án… Bạn có thể tiếp tục làm bài."):left===0?"Đang xác nhận hết giờ…":"✓ Đã lưu lựa chọn")}</p><Link className="exam-text-link" href={backHref}>Rời bài →</Link></footer>
  <p className="exam-footnote">{state.quiz?"Thời gian vẫn tiếp tục khi bạn rời bài.":"Đáp án hiển thị sau khi nộp. Rời bài không dừng đồng hồ."}</p>
 </section>;
}
