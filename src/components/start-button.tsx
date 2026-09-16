"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { startSession } from "@/actions/attempts";
export default function StartButton({kind,sourceId}:{kind:"QUIZ"|"TEST";sourceId:string}) {
  const router=useRouter(),requestId=useRef<string|null>(null),busy=useRef(false);
  const [pending,setPending]=useState(false),[error,setError]=useState("");
  return <><button className="button primary" disabled={pending} onClick={async()=>{
    if(busy.current)return;busy.current=true;setPending(true);
    requestId.current??=crypto.randomUUID();
    try {const result=await startSession(kind,sourceId,requestId.current);
      router.push(`/sessions/${result.id}`);
    } catch {setError("Không bắt đầu được. Kiểm tra đăng nhập, dữ liệu và kết nối rồi thử lại.");}
    finally{busy.current=false;setPending(false);}
  }}>{pending?"Đang chuẩn bị...":"Bắt đầu / tiếp tục"}</button><p role="status">{error}</p></>;
}
