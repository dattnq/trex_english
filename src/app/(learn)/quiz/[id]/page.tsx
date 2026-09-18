import Link from "next/link";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import StartButton from "@/components/start-button";
import QuestionSession from "@/components/question-session";
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,viewer=await getViewer();
 const deck=await db.deck.findFirst({where:{id,OR:[{visibility:"PUBLIC"},...(viewer?[{ownerId:viewer.id}]:[])]},select:{id:true,title:true,_count:{select:{words:true}}}});
 // Retain access to custom decks that were created only in this browser.
 if(!deck)return <QuestionSession id={id} quiz/>;
 return <main id="main" className="container page-main"><section className="panel server-session"><Link href="/quiz" className="back-link">← Quiz từ vựng</Link><h1>{deck.title}</h1><p>{deck._count.words} từ vựng. Mỗi câu có 10 giây để chọn đáp án; sau phản hồi đúng/sai, câu tiếp theo sẽ tự xuất hiện.</p>{viewer?<StartButton kind="QUIZ" sourceId={id}/>:<Link className="button primary" href="/login">Đăng nhập để làm quiz</Link>}</section></main>;
}
