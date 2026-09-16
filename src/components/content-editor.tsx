"use client";
import { useEffect,useRef,useState } from "react";
import PronunciationFields from "@/components/pronunciation-fields";
import { useRouter } from "next/navigation";
import { writeContent,deleteContent } from "@/actions/content";
import { contentInput,type ContentInput } from "@/lib/content-schema";
export default function ContentEditor({initial}:{initial:ContentInput}) {
  const [value,setValue]=useState(initial),[message,setMessage]=useState("");
  const [pending,setPending]=useState(false),busy=useRef(false),router=useRouter();
  const dirty=JSON.stringify(value)!==JSON.stringify(initial);
  useEffect(()=>{
    const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue="";}};
    const leave=(e:MouseEvent)=>{
      const link=e.target instanceof Element?e.target.closest("a[href]"):null;
      if(!dirty||!link||e.ctrlKey||e.metaKey||e.shiftKey||e.button!==0||link.getAttribute("target")==="_blank")return;
      if(!window.confirm("Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?")){e.preventDefault();e.stopPropagation();}
    };
    window.addEventListener("beforeunload",warn);document.addEventListener("click",leave,true);
    return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",leave,true);};
  },[dirty]);
  function move(kind:"words"|"questions",index:number,delta:number){
    const items=[...value[kind]]; const target=index+delta;
    if(target<0||target>=items.length)return;
    [items[index],items[target]]=[items[target],items[index]];
    setValue({...value,[kind]:items});
  }
  async function save() {
    if(busy.current)return;
    const parsed=contentInput.safeParse(value);
    if(!parsed.success){setMessage(parsed.error.issues.slice(0,3).map(i=>`${i.path.join(".")}: ${i.message}`).join(" · "));return;}
    if(initial.words.some(w=>!value.words.some(next=>next.id===w.id))&&
      !window.confirm("Lưu sẽ xóa các từ đã bỏ cùng tiến độ liên quan. Tiếp tục?"))return;
    busy.current=true;setPending(true);
    try {const result=await writeContent(parsed.data);
      if(!result.ok){setMessage(result.message);return;} router.push(`/admin/content?kind=${value.kind}&saved=1`);router.refresh();
    }catch{setMessage("Chưa lưu được. Kiểm tra quyền và kết nối rồi thử lại.");}
    finally{busy.current=false;setPending(false);}
  }
  return <form onSubmit={e=>{e.preventDefault();void save();}} className="admin-editor">
    <fieldset disabled={pending} className="admin-fields">
    <label>Tên<input required maxLength={160} value={value.title} onChange={e=>setValue({...value,title:e.target.value})}/></label>
    <label>Mô tả<textarea value={value.description} maxLength={2000} onChange={e=>setValue({...value,description:e.target.value})}/></label>
    <label>Chủ đề<input required maxLength={80} value={value.category} onChange={e=>setValue({...value,category:e.target.value})}/></label>
    <label>Trình độ<select value={value.level} onChange={e=>setValue({...value,level:e.target.value as ContentInput["level"]})}>
      {["A1","A2","B1","B2","C1","C2"].map(l=><option key={l}>{l}</option>)}</select></label>
    {<label className="admin-check"><input type="checkbox" checked={value.published}
      onChange={e=>setValue({...value,published:e.target.checked})}/>Công khai (bỏ chọn để lưu bản nháp)</label>}
    <label>Màu thẻ<select value={value.color} onChange={e=>setValue({...value,color:e.target.value as ContentInput["color"]})}>{[["blue","Xanh dương"],["green","Xanh lá"],["purple","Tím"],["orange","Cam"],["peach","Cam nhạt"],["lilac","Tím nhạt"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    {value.kind==="deck"&&<label>Ký hiệu<input maxLength={16} required value={value.symbol} onChange={e=>setValue({...value,symbol:e.target.value})}/></label>}
    {value.kind==="test"&&<label>Thời gian phút<input type="number" min={1} max={180} value={value.minutes}
      onChange={e=>setValue({...value,minutes:Number(e.target.value)})}/></label>}
    {value.kind==="deck"?<>
      <h2>Từ vựng ({value.words.length}/100)</h2>
      {value.words.map((w,i)=><fieldset className="panel" key={w.id}><legend>Từ {i+1}</legend>
        <PronunciationFields value={w} onChange={update=>setValue(current=>({...current,words:current.words.map(word=>word.id===w.id?{...word,...update(word)}:word)}))}/>
        {([['meaning','Nghĩa'],['example','Ví dụ']] as const).map(([key,label])=>
          <label key={key}>{label}<input value={w[key]} onChange={e=>setValue({...value,
            words:value.words.map((old,n)=>n===i?{...old,[key]:e.target.value}:old)})}/></label>)}
        <button type="button" disabled={i===0} onClick={()=>move("words",i,-1)}>↑ Lên</button> <button type="button" disabled={i===value.words.length-1} onClick={()=>move("words",i,1)}>↓ Xuống</button> <button type="button" onClick={()=>setValue({...value,words:value.words.filter((_,n)=>n!==i)})}>Bỏ từ này</button>
      </fieldset>)}
      <button type="button" disabled={value.words.length>=100} onClick={()=>setValue({...value,
        words:[...value.words,{id:crypto.randomUUID(),term:"",phonetic:"",meaning:"",example:""}]})}>Thêm từ</button>
    </>:<>
      <h2>Câu hỏi ({value.questions.length}/100)</h2>
      <p>Mỗi câu có 4 lựa chọn và một đáp án đúng. Dùng nút lên/xuống để đổi thứ tự.</p>
      {value.questions.map((q,i)=><fieldset className="panel" key={i}><legend>Câu {i+1}</legend>
        <label>Câu hỏi<textarea value={q.prompt} onChange={e=>setValue({...value,
          questions:value.questions.map((old,n)=>n===i?{...old,prompt:e.target.value}:old)})}/></label>
        {q.options.map((o,j)=><label key={j}>Đáp án {String.fromCharCode(65+j)}<input value={o}
          onChange={e=>setValue({...value,questions:value.questions.map((old,n)=>n===i?
            {...old,options:old.options.map((v,k)=>k===j?e.target.value:v)}:old)})}/></label>)}
        <label>Đáp án đúng<select value={q.answer} onChange={e=>setValue({...value,
          questions:value.questions.map((old,n)=>n===i?{...old,answer:Number(e.target.value)}:old)})}>
          {[0,1,2,3].map(n=><option key={n} value={n}>{String.fromCharCode(65+n)}</option>)}</select></label>
        <label>Giải thích<textarea value={q.explanation} onChange={e=>setValue({...value,
          questions:value.questions.map((old,n)=>n===i?{...old,explanation:e.target.value}:old)})}/></label>
        <button type="button" disabled={i===0} onClick={()=>move("questions",i,-1)}>↑ Lên</button> <button type="button" disabled={i===value.questions.length-1} onClick={()=>move("questions",i,1)}>↓ Xuống</button> <button type="button" onClick={()=>setValue({...value,questions:value.questions.filter((_,n)=>n!==i)})}>Bỏ câu này</button>
      </fieldset>)}
      <button type="button" disabled={value.questions.length>=100} onClick={()=>setValue({...value,
        questions:[...value.questions,{prompt:"",options:["","","",""],answer:0,explanation:""}]})}>Thêm câu</button>
    </>}
    </fieldset>
    <div className="admin-savebar"><span>{dirty?"Có thay đổi chưa lưu":"Nội dung đã tải"}</span><button className="button primary" disabled={pending}>{pending?"Đang lưu...":"Lưu nội dung"}</button>
    {value.id&&<button type="button" disabled={pending} onClick={async()=>{
      if(busy.current||!window.confirm("Xóa vĩnh viễn nội dung này? Từ/câu hỏi và tiến độ liên quan sẽ bị xóa. Kết quả đã nộp trên database được giữ lại."))return;
      busy.current=true;setPending(true);
      try {const result=await deleteContent({kind:value.kind,id:value.id!,version:value.version!});if(!result.ok){setMessage(result.message);return;}router.push(`/admin/content?kind=${value.kind}&deleted=1`);router.refresh();}
      catch{setMessage("Chưa xóa được nội dung.");}finally{busy.current=false;setPending(false);}
    }}>Xóa nội dung</button>}
    <p className="admin-feedback" role="status" aria-live="polite">{message}</p></div>
  </form>;
}
