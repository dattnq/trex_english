import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { stateSchema,step,score } from "@/lib/session-engine";
import type { Prisma } from "@/generated/prisma/client";
export const runtime="nodejs";
export const maxDuration=60;
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<32)return Response.json({error:"Cron is not configured"},{status:503});
 const expected=Buffer.from(`Bearer ${secret}`),received=Buffer.from(request.headers.get('authorization')??'');
 if(received.length!==expected.length||!timingSafeEqual(received,expected))return Response.json({error:"Unauthorized"},{status:401});
 const start=Date.now();let processed=0,finished=0,failed=0;
 try{
 const rows=await db.$queryRaw<{id:string}[]>`SELECT id FROM learning_sessions WHERE state->>'phase'<>'finished' AND (state->>'deadline')::numeric<=${Date.now()} ORDER BY updated_at LIMIT 100`;
 for(const {id}of rows){if(Date.now()-start>40000)break;
  try{const result=await db.$transaction(async tx=>{
   const locks=await tx.$queryRaw<{locked:boolean}[]>`SELECT pg_try_advisory_xact_lock(hashtext(${id}),4) AS locked`;
   if(!locks[0]?.locked)return false;
   const row=await tx.learningSession.findUnique({where:{id}});if(!row)return false;
   const before=stateSchema.parse(row.state),state=step(before,{type:'poll',revision:before.revision},Date.now());
   if(state.revision!==before.revision)await tx.learningSession.update({where:{id},data:{state:state as unknown as Prisma.InputJsonValue}});
   if(state.phase!=='finished')return false;
   const deckId=row.kind==='QUIZ'&&await tx.deck.findUnique({where:{id:row.sourceId}})?row.sourceId:null;
   const testId=row.kind==='TEST'&&await tx.test.findUnique({where:{id:row.sourceId}})?row.sourceId:null;
   await tx.attempt.upsert({where:{id},update:{},create:{id,userId:row.userId,kind:row.kind,deckId,testId,title:row.title,questions:state.questions,answers:state.answers,score:score(state),completedAt:new Date(state.endedAt)}});
   return true;
  },{timeout:5000,maxWait:2000});processed++;if(result)finished++;
  }catch{failed++;}
 }
 console.info(JSON.stringify({event:'session_cleanup',processed,finished,failed,batchFull:rows.length===100,elapsedMs:Date.now()-start}));
 return Response.json({processed,finished,failed,batchFull:rows.length===100},{status:failed?500:200,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Cleanup unavailable'},{status:503});}
}
