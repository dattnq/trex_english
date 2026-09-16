"use client";
import { useEffect, useRef, useState } from "react";
import { lookupPronunciation } from "@/lib/pronunciation-client";
import { type Pronunciation } from "@/lib/pronunciation";
import { Icon } from "./ui";
let playbackRequest=0;
let stopActive: (()=>void)|null=null;
export default function PronunciationButton({term,className=""}:{term:string;className?:string}){
  const [loading,setLoading]=useState(false),[playing,setPlaying]=useState(false),[note,setNote]=useState("");
  const [source,setSource]=useState<Pronunciation|null>(null);
  const cached=useRef<{term:string;data:Pronunciation}|null>(null),ticket=useRef(0),stopOwn=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>{ticket.current++;stopOwn.current?.();},[term]);
  function synthesize(id:number,request:number){
    if(id!==ticket.current||request!==playbackRequest)return;
    if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
      setPlaying(false);setNote("Thiết bị chưa hỗ trợ giọng đọc. Hãy thử trình duyệt khác hoặc tham khảo IPA.");return;
    }
    const utterance=new SpeechSynthesisUtterance(term);utterance.lang="en-US";utterance.rate=.85;
    const voices=window.speechSynthesis.getVoices();
    utterance.voice=voices.find(v=>v.lang.toLowerCase()==="en-us")??voices.find(v=>v.lang.toLowerCase().startsWith("en"))??null;
    const stop=()=>{if(stopActive===stop){window.speechSynthesis.cancel();stopActive=null;}utterance.onend=null;utterance.onerror=null;setPlaying(false);};
    stopOwn.current=stop;stopActive=stop;
    utterance.onend=()=>{if(id===ticket.current)setPlaying(false);if(stopActive===stop)stopActive=null;};
    utterance.onerror=event=>{if(id===ticket.current&&event.error!=="canceled"&&event.error!=="interrupted"){setPlaying(false);setNote("Chưa phát được giọng đọc. Kiểm tra âm lượng và giọng tiếng Anh trên thiết bị rồi thử lại.");}if(stopActive===stop)stopActive=null;};
    setPlaying(true);setNote("Đang dùng giọng đọc tiếng Anh của thiết bị.");
    window.speechSynthesis.speak(utterance);
  }
  async function listen(){
    if(playing){playbackRequest++;ticket.current++;stopOwn.current?.();return;}
    if(loading||!term.trim())return;
    stopActive?.();const request=++playbackRequest,id=++ticket.current;setLoading(true);setNote("");
    let data=cached.current?.term===term?cached.current.data:null;
    if(!data){try{data=await lookupPronunciation(term,true);if(id!==ticket.current)return;if(request!==playbackRequest){setLoading(false);return;}cached.current={term,data};setSource(data);}catch{/* A lookup failure must not prevent the device voice. */}}
    if(id!==ticket.current)return;setLoading(false);if(request!==playbackRequest)return;
    if(!data?.audioUrl){synthesize(id,request);return;}
    const audio=new Audio(data.audioUrl);audio.preload="auto";
    const stop=()=>{audio.pause();audio.onended=null;audio.onerror=null;audio.removeAttribute("src");if(stopActive===stop)stopActive=null;setPlaying(false);};
    stopOwn.current=stop;stopActive=stop;
    let failed=false;
    const fallback=()=>{if(failed||id!==ticket.current||request!==playbackRequest)return;failed=true;stop();synthesize(id,request);};
    audio.onended=()=>{if(id===ticket.current)setPlaying(false);if(stopActive===stop)stopActive=null;};
    audio.onerror=fallback;
    setPlaying(true);setNote("Bản ghi phát âm từ từ điển.");
    try{await audio.play();}catch(error){
      if(id!==ticket.current||request!==playbackRequest)return;
      if(error instanceof DOMException&&error.name==="NotAllowedError"){stop();setNote("Trình duyệt chặn phát âm tự động. Bấm Nghe lần nữa để phát bản ghi đã tải.");}
      else fallback();
    }
  }
  return <span className={`pronunciation-player ${className}`}>
    <button type="button" className="pronunciation-listen" aria-label={`${playing?"Dừng":"Nghe"} phát âm ${term}`} disabled={loading||!term.trim()} onClick={()=>void listen()}><Icon name="volume" size={19}/><span>{loading?"Đang tải…":playing?"Dừng":"Nghe"}</span></button>
    {note&&<span className="pronunciation-note" role="status">{note}{source?.sourceUrl&&<> <a href={source.sourceUrl} target="_blank" rel="noreferrer">Nguồn</a></>}{source?.licenseUrl&&<> · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.licenseName||"Giấy phép"}</a></>}</span>}
  </span>;
}
