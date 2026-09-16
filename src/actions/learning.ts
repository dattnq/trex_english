"use server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { learningInput } from "@/lib/learning-schema";
import { readLearning, learningVersion } from "@/lib/learning-store";
import { z } from "zod";
export async function loadLearning(expectedUser:string){const user=await requireUser();if(user.id!==expectedUser)throw Error("Tài khoản đã thay đổi.");return db.$transaction(tx=>readLearning(tx,user.id),{isolationLevel:"RepeatableRead",timeout:20000});}
export async function saveLearning(expectedUser:string,version:string,input:unknown){
 const user=await requireUser();if(user.id!==expectedUser)throw Error("Tài khoản đã thay đổi. Tải lại trang.");
 const data=learningInput.parse(input);z.string().regex(/^[a-f0-9]{64}$/).parse(version);
 return db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}), 5)`;
  await tx.$queryRaw`SELECT id FROM decks WHERE owner_id=${user.id}::uuid ORDER BY id FOR UPDATE`;
  const profile=await tx.profile.findUniqueOrThrow({where:{id:user.id}});
  const own=await tx.deck.findMany({where:{ownerId:user.id},include:{words:{orderBy:[{position:"asc"},{id:"asc"}]}}});
  if(learningVersion(profile.updatedAt,own)!==version)return {ok:false as const,data:await readLearning(tx,user.id)};
  const allIds=data.customDecks.map(d=>d.id);
  const occupied=await tx.deck.findMany({where:{id:{in:allIds},NOT:{ownerId:user.id}},select:{id:true}});
  // Null system owners need an explicit branch under SQL three-valued logic.
  const system=await tx.deck.count({where:{id:{in:allIds},ownerId:null}});
  if(occupied.length||system)throw Error("Bộ từ không thuộc tài khoản.");
  for(const d of data.customDecks){
   const {words,custom,...fields}=d;void custom;
   const old=own.find(o=>o.id===d.id);
   const previous=!!old;
   if(old && Object.entries(fields).every(([key,value])=>old[key as keyof typeof old]===value) && JSON.stringify(words)===JSON.stringify(old.words.map(w=>({id:w.id,term:w.term,phonetic:w.phonetic,meaning:w.meaning,example:w.example}))))continue;
   if(previous)await tx.deck.update({where:{id:d.id},data:{...fields}});
   else await tx.deck.create({data:{...fields,ownerId:user.id,visibility:"PRIVATE"}});
   await tx.word.deleteMany({where:{deckId:d.id,id:{notIn:words.map(w=>w.id)}}});
   for(const [position,w]of words.entries())await tx.word.upsert({where:{deckId_id:{deckId:d.id,id:w.id}},create:{...w,deckId:d.id,position},update:{...w,position}});
  }
  await tx.deck.deleteMany({where:{ownerId:user.id,id:{in:own.filter(d=>!allIds.includes(d.id)).map(d=>d.id)}}});
  const visible=await tx.deck.findMany({where:{OR:[{visibility:"PUBLIC"},{ownerId:user.id}]},select:{id:true,words:{select:{id:true}}}});
  const allowed=new Map(visible.map(d=>[d.id,new Set(d.words.map(w=>w.id))]));
  await tx.savedDeck.deleteMany({where:{userId:user.id}});
  await tx.savedDeck.createMany({data:[...new Set(data.saved)].filter(id=>allowed.has(id)).map(deckId=>({userId:user.id,deckId})),skipDuplicates:true});
  await tx.wordProgress.deleteMany({where:{userId:user.id}});
  await tx.wordProgress.createMany({data:Object.entries(data.known).flatMap(([deckId,ids])=>[...new Set(ids)].filter(id=>allowed.get(deckId)?.has(id)).map(wordId=>({userId:user.id,deckId,wordId,known:true}))),skipDuplicates:true});
  const rows=Object.entries(data.activity).flatMap(([day,ids])=>ids.flatMap(value=>{const [deckId,wordId]=value.split(':');const date=new Date(day+'T00:00:00.000Z');return allowed.get(deckId)?.has(wordId)&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day&&date.getTime()<=Date.now()? [{userId:user.id,deckId,wordId,day:date}]:[];}));
  await tx.dailyWordActivity.createMany({data:rows,skipDuplicates:true});
  await tx.profile.update({where:{id:user.id},data:{dailyGoal:data.goal,updatedAt:new Date(Math.max(Date.now(),profile.updatedAt.getTime()+1))}});
  return {ok:true as const,data:await readLearning(tx,user.id)};
 },{timeout:30000});
}
