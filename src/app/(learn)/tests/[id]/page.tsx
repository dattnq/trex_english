import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import StartButton from "@/components/start-button";
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,viewer=await getViewer();
 const test=await db.test.findFirst({where:{id,published:true},select:{id:true,title:true,description:true,minutes:true,level:true,_count:{select:{questions:true}}}});if(!test)notFound();
 return <main id="main" className="container page-main"><section className="panel server-session"><Link href="/tests" className="back-link">← Danh sách đề</Link><span className="badge">{test.level} · {test._count.questions} câu · {test.minutes} phút</span><h1>{test.title}</h1><p>{test.description}</p><p>Thời gian bắt đầu khi bạn bấm nút bên dưới. Có thể đổi đáp án trước khi nộp. Đáp án và giải thích chỉ hiển thị sau khi hoàn thành; hết giờ sẽ tự kết thúc bài.</p>{viewer?<StartButton kind="TEST" sourceId={id}/>:<Link className="button primary" href="/login">Đăng nhập để làm bài</Link>}</section></main>;
}
