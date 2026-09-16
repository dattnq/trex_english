import { z } from "zod";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SessionPlayer from "@/components/session-player";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  if(!z.uuid().safeParse((await params).id).success)notFound();
  const viewer=await requireUser(),{id}=await params;
  const session=await db.learningSession.findFirst({where:{id,userId:viewer.id},
    select:{id:true,title:true}});
  if(!session)notFound();
  return <main id="main" className="container page-main server-session"><SessionPlayer id={session.id} title={session.title}/></main>;
}
