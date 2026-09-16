import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { z } from "zod";

import AttemptResult, { ResultReview } from "@/components/attempt-result";
const questions=z.array(z.object({prompt:z.string(),options:z.array(z.string()),answer:z.number(),explanation:z.string()}));
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,viewer=await getViewer();
 const row=viewer?await db.attempt.findFirst({where:{id,userId:viewer.id}}):null;
 if(!row)return <AttemptResult id={id}/>;
 const parsed=questions.safeParse(row.questions);
 if(!parsed.success)return <main id="main" className="container page-main"><h1>Chưa đọc được chi tiết bài làm</h1><p>Kết quả cũ có định dạng không hợp lệ.</p></main>;
 return <ResultReview server result={{id:row.id,title:row.title,date:row.completedAt.toISOString(),score:row.score,answers:row.answers,questions:parsed.data}}/>;
}
