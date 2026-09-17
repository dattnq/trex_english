"use server";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { readDeck } from "@/lib/learning";
import { begin, step, stateSchema, publicState, score,
  type Question, type Command } from "@/lib/session-engine";
import type { Prisma } from "@/generated/prisma/client";
import { readingSchema } from "@/lib/reading";
function shuffle<T>(items:T[]) {
  const a=[...items];
  for(let i=a.length-1;i>0;i--) { const j=randomInt(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export async function startSession(kind:"QUIZ"|"TEST", sourceId:string, id:string) {
  const viewer=await requireUser();
  z.enum(["QUIZ","TEST"]).parse(kind); z.uuid().parse(id);
  z.string().min(1).max(160).parse(sourceId);
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${viewer.id}), 3)`;
    const existing=await tx.learningSession.findUnique({where:{id}});
    if(existing) {
      if(existing.userId!==viewer.id || existing.sourceId!==sourceId || existing.kind!==kind)
        throw new Error("Phiên không hợp lệ.");
      return {id};
    }
    const active=await tx.learningSession.findFirst({where:{userId:viewer.id,kind,sourceId,
      state:{path:["phase"],not:"finished"}},orderBy:{createdAt:"desc"},select:{id:true}});
    if(active)return {id:active.id};
    let title:string,questions:Question[],duration=5000;
    if(kind==="QUIZ") {
      const deck=await readDeck(sourceId,viewer);
      if(!deck || !deck.words.length) throw new Error("Bộ từ trống hoặc không có quyền.");
      const pool=await tx.word.findMany({where:{deck:{visibility:"PUBLIC"}},select:{meaning:true},take:500});
      const meanings=[...new Set([...deck.words,...pool].map(w=>w.meaning))];
      if(meanings.length<4) throw new Error("Cần ít nhất 4 nghĩa khác nhau để tạo quiz.");
      title=`Quiz: ${deck.title}`;
      questions=shuffle(deck.words).slice(0,100).map(w=>{
        const options=shuffle([w.meaning,...shuffle(meanings.filter(m=>m!==w.meaning)).slice(0,3)]);
        return {prompt:`“${w.term}” có nghĩa là gì?`,options,answer:options.indexOf(w.meaning),
          explanation:`${w.term}: ${w.meaning}. ${w.example}`};
      });
    } else {
      const test=await tx.test.findFirst({where:{id:sourceId,published:true},
        include:{questions:{orderBy:{position:"asc"}}}});
      if(!test || !test.questions.length) throw new Error("Đề chưa sẵn sàng.");
      title=test.title;duration=test.minutes*60000;
      questions=test.questions.map(q=>({prompt:q.prompt,options:q.options, reading:q.reading ? readingSchema.parse(q.reading) : null, number:q.number,
        answer:q.answer,explanation:q.explanation}));
    }
    const state=begin(questions,kind==="QUIZ",duration,Date.now());
    await tx.learningSession.create({data:{id,userId:viewer.id,kind,sourceId,title,
      state:state as unknown as Prisma.InputJsonValue}});
    return {id};
  },{timeout:15000});
}
export async function sessionCommand(id:string, command:Command) {
  const viewer=await requireUser();z.uuid().parse(id);
  const cmd=z.object({type:z.enum(["poll","select","submit"]),
    index:z.number().int().optional(),option:z.number().int().optional(),
    revision:z.number().int().min(0)}).parse(command);
  return db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}), 4)`;
    const row=await tx.learningSession.findFirst({where:{id,userId:viewer.id}});
    if(!row) throw new Error("Không tìm thấy bài làm của bạn.");
    const before=stateSchema.parse(row.state), state=step(before,cmd,Date.now());
    if(state.revision!==before.revision) await tx.learningSession.update({where:{id},
      data:{state:state as unknown as Prisma.InputJsonValue}});
    if(state.phase==="finished") {
      const deckId=row.kind==="QUIZ" && await tx.deck.findUnique({where:{id:row.sourceId}})
        ? row.sourceId:null;
      const testId=row.kind==="TEST" && await tx.test.findUnique({where:{id:row.sourceId}})
        ? row.sourceId:null;
      await tx.attempt.upsert({where:{id},update:{},create:{id,userId:viewer.id,
        kind:row.kind,deckId,testId,title:row.title,questions:state.questions,
        answers:state.answers,score:score(state),completedAt:new Date(state.endedAt)}});
    }
    return publicState(state);
  },{timeout:15000});
}
