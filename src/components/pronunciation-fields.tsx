"use client";
import { useEffect, useRef, useState } from "react";
import { lookupPronunciation } from "@/lib/pronunciation-client";
import { normalizeEnglishTerm, type Pronunciation } from "@/lib/pronunciation";
import PronunciationButton from "./pronunciation-button";
export type PronunciationDraft={term:string;phonetic:string};
export default function PronunciationFields({value,onChange}:{value:PronunciationDraft;onChange:(update:(current:PronunciationDraft)=>PronunciationDraft)=>void}){
  const [pending,setPending]=useState(false),[message,setMessage]=useState("");
  const [suggestion,setSuggestion]=useState<{term:string;data:Pronunciation}|null>(null);
  const ticket=useRef(0),automatic=useRef<{term:string;ipa:string}|null>(null);
  useEffect(()=>()=>{ticket.current++;},[]);
  async function lookup(){
    if(!value.term.trim())return;
    const term=value.term,id=++ticket.current;setPending(true);setMessage("");
    try{
      const data=await lookupPronunciation(term);if(id!==ticket.current)return;
      setSuggestion({term,data});
      if(data.ipa){
        automatic.current={term,ipa:data.ipa};
        onChange(current=>normalizeEnglishTerm(current.term)===normalizeEnglishTerm(term)&&!current.phonetic.trim()?{...current,phonetic:data.ipa}:current);
        setMessage("Đã tìm thấy IPA. Bạn có thể sửa theo nghĩa hoặc giọng đọc cần dùng.");
      }else setMessage("Từ điển chưa có IPA cho mục này. Bạn có thể nhập thủ công; nút nghe vẫn có giọng đọc dự phòng.");
    }catch(error){if(id===ticket.current)setMessage(error instanceof Error?error.message:"Chưa tra được IPA.");}
    finally{if(id===ticket.current)setPending(false);}
  }
  const matching=suggestion&&normalizeEnglishTerm(suggestion.term)===normalizeEnglishTerm(value.term)?suggestion:null;
  return <div className="pronunciation-fields">
    <label>Từ tiếng Anh<input name="term" required maxLength={200} value={value.term} placeholder="Ví dụ: inspire" onBlur={()=>{if(!value.phonetic.trim())void lookup();}} onChange={e=>{
      const term=e.target.value,previous=automatic.current;ticket.current++;setPending(false);setMessage("");
      onChange(current=>({...current,term,phonetic:previous&&current.term===previous.term&&current.phonetic===previous.ipa?"":current.phonetic}));
    }}/></label>
    <label>Phiên âm IPA<input name="phonetic" maxLength={200} value={value.phonetic} placeholder="Tự tra khi rời ô từ tiếng Anh" onChange={e=>{const phonetic=e.target.value;ticket.current++;automatic.current=null;setPending(false);onChange(current=>({...current,phonetic}));}}/></label>
    <div className="pronunciation-tools"><button className="button secondary" type="button" disabled={pending||!value.term.trim()} onClick={()=>void lookup()}>{pending?"Đang tra IPA…":"Tra IPA"}</button><PronunciationButton key={value.term} term={value.term}/>
      {matching?.data.ipa&&matching.data.ipa!==value.phonetic&&<button className="button secondary" type="button" onClick={()=>onChange(current=>({...current,phonetic:matching.data.ipa}))}>Dùng {matching.data.ipa}</button>}
    </div>
    {message&&<p className="pronunciation-note" role="status">{message}</p>}
    {matching?.data.sourceUrl&&<small><a href={matching.data.sourceUrl} target="_blank" rel="noreferrer">Nguồn từ điển ↗</a></small>}
  </div>;
}
