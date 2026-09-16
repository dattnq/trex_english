"use client";
import { useRef,useState } from "react";
import { z } from "zod";
import { makeQuiz } from "@/lib/learning-data";
import { begin,step,stateSchema,publicState,score,type Command } from "@/lib/session-engine";
import { useLearning } from "./learning-provider";
import { EmptyState } from "./ui";
import SessionPlayer from "./session-player";
import StartButton from "./start-button";
const savedQuiz=z.object({id:z.uuid(),title:z.string(),state:stateSchema});
type SavedQuiz=z.infer<typeof savedQuiz>;
export default function QuestionSession({id}:{id:string;quiz?:boolean}){
 const {decks,ready,update,account}=useLearning(),deck=decks.find(d=>d.id===id);
 const [active,setActive]=useState<SavedQuiz|null>(null),[error,setError]=useState("");const current=useRef<SavedQuiz|null>(null);
 const key=`trex-quiz-session:${id}`;
 function start(){
  if(!deck)return;
  let record:SavedQuiz|null=null;
  try{const raw=localStorage.getItem(key);if(raw){const parsed=savedQuiz.safeParse(JSON.parse(raw));if(parsed.success&&parsed.data.state.phase!=="finished")record=parsed.data;}}catch{setError("Không đọc được phiên cũ. Bài mới sẽ bắt đầu.");}
  if(!record)record={id:crypto.randomUUID(),title:`Quiz: ${deck.title}`,state:begin(makeQuiz(deck).slice(0,100),true,5000,Date.now())};
  try{localStorage.setItem(key,JSON.stringify(record));}catch{setError("Trình duyệt không cho lưu phiên. Hãy cho phép lưu dữ liệu để có thể tiếp tục bài khi tải lại.");return;}
  current.current=record;setActive(record);
 }
 async function execute(command:Command){
  const record=current.current;if(!record)throw Error("Missing quiz");
  // Re-read the shared revision so another tab cannot overwrite confirmed answers.
  const raw=localStorage.getItem(key);if(raw){const parsed=savedQuiz.safeParse(JSON.parse(raw));if(parsed.success&&parsed.data.id===record.id)record.state=parsed.data.state;}
  const next={...record,state:step(record.state,command,Date.now())};localStorage.setItem(key,JSON.stringify(next));current.current=next;
  if(next.state.phase==="finished")update(s=>({...s,attempts:[{id:next.id,title:next.title,date:new Date(next.state.endedAt).toISOString(),questions:next.state.questions,answers:next.state.answers,score:score(next.state)},...s.attempts.filter(a=>a.id!==next.id)]}));
  return publicState(next.state);
 }
 if(!ready)return <main id="main" className="container page-main">Đang tải bộ từ…</main>;
 if(!deck?.words.length)return <main id="main" className="container page-main"><EmptyState title="Chưa có từ để làm quiz" description="Thêm từ vựng hoặc chọn bộ từ khác để bắt đầu." href="/quiz" action="Chọn bộ từ"/></main>;
 if(account)return <main id="main" className="container page-main server-session"><section className="panel"><h1>{deck.title}</h1><p>5 giây mỗi câu. Kết quả lưu vào tài khoản sau khi hoàn thành.</p><StartButton kind="QUIZ" sourceId={id}/></section></main>;
 return <main id="main" className="container page-main server-session">{active?<SessionPlayer key={active.id} id={active.id} title={active.title} execute={execute} local/>:<section className="panel"><span className="badge">QUIZ CÁ NHÂN</span><h1>{deck.title}</h1><p>Mỗi câu có 5 giây. Chọn đáp án để xem đúng/sai; sau 1,5 giây sẽ tự chuyển câu. Thời gian vẫn tính khi rời tab.</p><p>Phiên và kết quả của bộ từ cá nhân này được lưu trên trình duyệt đang dùng.</p><button className="button primary" onClick={start}>Bắt đầu / tiếp tục quiz</button><p role="status">{error}</p></section>}</main>;
}
