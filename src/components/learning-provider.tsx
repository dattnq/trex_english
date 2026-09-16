"use client";
import { createContext,useContext,useEffect,useEffectEvent,useRef,useState,type ReactNode } from "react";
import { z } from "zod";
import { usePathname } from "next/navigation";
import { type Attempt,type Deck } from "@/lib/learning-data";
import { learningInput } from "@/lib/learning-schema";
import { loadLearning,saveLearning } from "@/actions/learning";
const schema=learningInput.extend({name:z.string(),attempts:z.array(z.object({id:z.string(),title:z.string(),date:z.string(),score:z.number(),answers:z.array(z.number()),questions:z.array(z.object({prompt:z.string(),options:z.array(z.string()),answer:z.number(),explanation:z.string()}))}))});
type LearningState=z.infer<typeof schema>;
const initial:LearningState={name:"",goal:10,customDecks:[],known:{},saved:[],activity:{},attempts:[]};
export function dayKey(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
type LearningContext={state:LearningState;ready:boolean;account:boolean;attemptCount:number;decks:Deck[];update:(fn:(s:LearningState)=>LearningState)=>void;markWord:(deckId:string,wordId:string,known:boolean)=>void;addAttempt:(a:Attempt)=>void};
const Context=createContext<LearningContext|null>(null);
export function LearningProvider({children,publicDecks,catalogError=false,userId}:{children:ReactNode;publicDecks:Deck[];catalogError?:boolean;userId?:string}){
 const [state,setState]=useState(initial),[ready,setReady]=useState(false),[message,setMessage]=useState(''),[saving,setSaving]=useState(false),[attemptCount,setAttemptCount]=useState(0),[hasGuest,setHasGuest]=useState(false),[hasDraft,setHasDraft]=useState(false);
 const current=useRef(initial),version=useRef(''),dirty=useRef(false),busy=useRef(false),conflict=useRef(false),alive=useRef(true);
 const pathname=usePathname();
 const draftKey=`trex-learning-draft:${userId}`;
 function publish(s:LearningState){current.current=s;setState(s);}
 async function refresh(){
  if(busy.current||dirty.current)return;
  busy.current=true;
  await Promise.resolve();
  try{if(userId){const data=await loadLearning(userId);if(!alive.current||dirty.current)return;version.current=data.version;publish(data.state);setAttemptCount(data.attemptCount);try{setHasGuest(!!localStorage.getItem('trex-learning-v1')&&!sessionStorage.getItem(`trex-import-dismissed:${userId}`));setHasDraft(!!localStorage.getItem(draftKey));}catch{setHasGuest(false);setHasDraft(false);}}else{const raw=localStorage.getItem('trex-learning-v1');publish(raw?schema.parse(JSON.parse(raw)):initial);}setReady(true);setMessage('');conflict.current=false;}
  catch{setMessage('Chưa tải được dữ liệu học. Hãy kiểm tra kết nối rồi thử tải lại.');}
  finally{busy.current=false;if(dirty.current&&!conflict.current)void flush();}
 }
 async function flush(){
  if(!userId||busy.current||conflict.current||!dirty.current)return;
  busy.current=true;setSaving(true);setMessage('');
  try{while(dirty.current&&alive.current){
   const outgoing=current.current;dirty.current=false;
   const result=await saveLearning(userId,version.current,outgoing);
   if(!alive.current)return;
   if(!result.ok){dirty.current=true;conflict.current=true;setMessage('Dữ liệu đã thay đổi ở nơi khác. Bản đang sửa đã giữ trên thiết bị; tải bản mới trước khi tiếp tục.');setHasDraft(true);break;}
   version.current=result.data.version;setAttemptCount(result.data.attemptCount);
   if(!dirty.current){publish(result.data.state);try{localStorage.removeItem(draftKey);}catch{/* Cloud save succeeded even when browser storage is blocked. */}setHasDraft(false);}
  }}catch{dirty.current=true;setMessage('Chưa đồng bộ được. Bản đang sửa được giữ trên thiết bị nếu trình duyệt cho phép lưu. Bấm Thử đồng bộ lại.');}
  finally{busy.current=false;setSaving(false);}
 }
 function update(fn:(s:LearningState)=>LearningState){
  if(!ready||conflict.current){setMessage('Hãy tải dữ liệu mới trước khi chỉnh sửa.');return;}
  const next=fn(current.current);publish(next);
  try{localStorage.setItem(userId?draftKey:'trex-learning-v1',JSON.stringify(next));}catch{setMessage('Thiết bị không lưu được bản dự phòng. Giữ trang mở cho đến khi đồng bộ xong.');}
  if(userId){dirty.current=true;void flush();}
 }
 const initialize=useEffectEvent(()=>void refresh());
 const focus=useEffectEvent(()=>{if(dirty.current)void flush();else void refresh();});
 useEffect(()=>{alive.current=true;const onFocus=()=>focus();const leave=(e:BeforeUnloadEvent)=>{if(dirty.current||(busy.current&&userId)){e.preventDefault();e.returnValue='';}};window.addEventListener('focus',onFocus);window.addEventListener('online',onFocus);window.addEventListener('beforeunload',leave);return()=>{alive.current=false;window.removeEventListener('focus',onFocus);window.removeEventListener('online',onFocus);window.removeEventListener('beforeunload',leave);};},[userId]);
 useEffect(()=>{let cancelled=false;queueMicrotask(()=>{if(!cancelled)initialize();});return()=>{cancelled=true;};},[pathname]);
 function importGuest(){
  try{const guest=schema.parse(JSON.parse(localStorage.getItem('trex-learning-v1')||'null'));const map=new Map(guest.customDecks.map(d=>[d.id,`import-${userId}-${d.id}`]));
   update(s=>({...s,customDecks:[...s.customDecks,...guest.customDecks.filter(d=>!s.customDecks.some(x=>x.id===map.get(d.id))).map(d=>({...d,id:map.get(d.id)!}))],saved:[...new Set([...s.saved,...guest.saved.map(id=>map.get(id)??id)])],known:Object.fromEntries([...new Set([...Object.keys(s.known),...Object.keys(guest.known).map(id=>map.get(id)??id)])].map(id=>[id,[...new Set([...(s.known[id]??[]),...Object.entries(guest.known).filter(([old])=>(map.get(old)??old)===id).flatMap(([,ids])=>ids)])]])),activity:Object.fromEntries([...new Set([...Object.keys(s.activity),...Object.keys(guest.activity)])].map(day=>[day,[...new Set([...(s.activity[day]??[]),...(guest.activity[day]??[]).map(v=>{const [d,w]=v.split(':');return `${map.get(d)??d}:${w}`;})])]]))}));setHasGuest(false);sessionStorage.setItem(`trex-import-dismissed:${userId}`,"1");
  }catch{setMessage('Dữ liệu học thử không hợp lệ hoặc vượt giới hạn. Bản gốc vẫn được giữ trên trình duyệt.');}
 }
 function markWord(deckId:string,wordId:string,known:boolean){update(s=>({...s,known:{...s.known,[deckId]:known?[...new Set([...(s.known[deckId]??[]),wordId])]:(s.known[deckId]??[]).filter(id=>id!==wordId)},activity:{...s.activity,[dayKey()]:[...new Set([...(s.activity[dayKey()]??[]),`${deckId}:${wordId}`])]}}));}
 return <Context.Provider value={{state,ready,account:!!userId,attemptCount:userId?attemptCount:state.attempts.length,decks:[...publicDecks,...state.customDecks.filter(d=>!publicDecks.some(p=>p.id===d.id))],update,markWord,addAttempt:a=>update(s=>({...s,attempts:[a,...s.attempts]}))}}>
 {catalogError&&<div className="storage-notice" role="status">Chưa tải được thư viện từ database.</div>}
 {(message||saving)&&<div className="storage-notice" role="status">{saving?'Đang đồng bộ…':message} {!saving&&<button className="button secondary" onClick={()=>{if(conflict.current){dirty.current=false;void refresh();}else if(dirty.current)void flush();else void refresh();}}>Tải lại / thử đồng bộ</button>}</div>}
 {userId&&ready&&hasGuest&&<div className="storage-notice">Có dữ liệu học thử trên thiết bị. Chỉ nhập nếu đây là dữ liệu của bạn; điểm học thử không nhập vào kết quả chính thức. <button className="button secondary" disabled={saving} onClick={importGuest}>Nhập bộ từ & tiến độ vào tài khoản này</button><button onClick={()=>{setHasGuest(false);sessionStorage.setItem(`trex-import-dismissed:${userId}`,"1");}}>Để sau</button></div>}
 {userId&&ready&&hasDraft&&<div className="storage-notice">Có bản sửa chưa đồng bộ trên thiết bị. <button className="button secondary" disabled={saving} onClick={()=>{try{const draft=schema.parse(JSON.parse(localStorage.getItem(draftKey)||'null'));const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='trex-ban-chua-dong-bo.json';a.click();URL.revokeObjectURL(url);}catch{setMessage('Không đọc được bản dự phòng.');}}}>Tải bản dự phòng</button><button className="button secondary" disabled={saving} onClick={()=>{if(!window.confirm("Khôi phục bản sửa trên thiết bị sẽ thay thế bộ từ, mục tiêu và trạng thái đã nhớ trong bản hiện tại. Bạn đã xem bản dự phòng và muốn tiếp tục?"))return;try{const draft=schema.parse(JSON.parse(localStorage.getItem(draftKey)||"null"));update(s=>({...draft,name:s.name,attempts:s.attempts}));}catch{setMessage("Không đọc được bản dự phòng.");}}}>Khôi phục bản sửa</button></div>}
 {children}</Context.Provider>;
}
export function useLearning(){const value=useContext(Context);if(!value)throw Error('Missing LearningProvider');return value;}
