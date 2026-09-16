import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
const snapshot=z.array(z.object({prompt:z.string(),options:z.array(z.string()),answer:z.number().int(),explanation:z.string().optional()}));
export default async function AttemptDetail({params}:{params:Promise<{id:string}>}){
 await requireAdmin();const {id}=await params,a=await db.attempt.findUnique({where:{id},include:{user:{select:{displayName:true}}}});if(!a)notFound();
 const parsed=snapshot.safeParse(a.questions);
 return <><header className="admin-heading"><div><Link href="/admin/attempts" className="admin-edit">← Kết quả học tập</Link><h1>{a.title}</h1><p>{a.user.displayName} · {a.kind} · {a.completedAt.toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</p></div><strong className="admin-score">{a.score}/{parsed.success?parsed.data.length:"?"} đúng</strong></header><p className="admin-note">Bản chụp tại thời điểm làm bài, không thay đổi khi nội dung gốc được sửa hoặc xóa.</p>{parsed.success?parsed.data.map((q,i)=><section className="admin-panel" key={i}><h2>Câu {i+1}. {q.prompt}</h2><ol type="A">{q.options.map((o,n)=><li key={n}>{o}{n===q.answer?" ✓ Đáp án đúng":""}{a.answers[i]===n?" — Người học đã chọn":""}</li>)}</ol>{(a.answers[i]===undefined||a.answers[i]<0)&&<p>Chưa trả lời.</p>}<p><strong>Giải thích: </strong>{q.explanation||"Chưa có giải thích."}</p></section>):<p role="alert">Không đọc được định dạng chi tiết của kết quả cũ.</p>}</>;
}
