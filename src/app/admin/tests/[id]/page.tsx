import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentInput, type ContentInput } from "@/lib/content-schema";
import ContentEditor from "@/components/content-editor";
import { readingSchema } from "@/lib/reading";
export default async function EditorPage({params}:{params:Promise<{id:string}>}){
 await requireAdmin();const {id}=await params;
 const item=id==="new"?null:await db.test.findUnique({where:{id},include:{questions:{orderBy:{position:"asc"}}}});
 if(id!=="new"&&!item)notFound();
 const initial:ContentInput=item?{...item,level:contentInput.shape.level.parse(item.level),color:contentInput.shape.color.parse(item.color),version:item.updatedAt.toISOString(),kind:"test",published:item.published,words:[],questions:item.questions.map(q=>({...q,reading:q.reading?readingSchema.parse(q.reading):null})),minutes:item.minutes,symbol:"Aa"}:{kind:"test",title:"",description:"",category:"",level:"A1",color:"blue",symbol:"Aa",published:false,minutes:5,words:[],questions:[]};
 return <><header className="admin-heading"><div><Link className="admin-edit" href="/admin/content?kind=test">← Danh sách</Link><h1>{item?"Chỉnh sửa đề kiểm tra":"Tạo đề kiểm tra"}</h1><p>Bản nháp có thể để trống. Nội dung công khai phải có ít nhất một mục.</p></div></header><ContentEditor key={item?.updatedAt.toISOString()??"new"} initial={initial}/></>;
}
