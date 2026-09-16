import "server-only";
import { createHash } from "node:crypto";
export function learningVersion(profile:Date,decks:{id:string;updatedAt:Date}[]){return createHash("sha256").update(JSON.stringify([profile.toISOString(),decks.map(d=>[d.id,d.updatedAt.toISOString()]).sort((a,b)=>a[0].localeCompare(b[0]))])).digest("hex");}
import type { Prisma } from "@/generated/prisma/client";
import type { LearningInput } from "./learning-schema";
export async function readLearning(tx:Prisma.TransactionClient,userId:string){
 const [profile,decks,progress,saved,activity,attempts,totals]=await Promise.all([
 tx.profile.findUniqueOrThrow({where:{id:userId}}),
 tx.deck.findMany({where:{ownerId:userId},orderBy:{id:"asc"},include:{words:{orderBy:[{position:"asc"},{id:"asc"}]}}}),
 tx.wordProgress.findMany({where:{userId,known:true,word:{deck:{OR:[{visibility:"PUBLIC"},{ownerId:userId}]}}}}),
 tx.savedDeck.findMany({where:{userId,deck:{OR:[{visibility:"PUBLIC"},{ownerId:userId}]}}}),
 tx.dailyWordActivity.findMany({where:{userId}}),
 tx.attempt.findMany({where:{userId},orderBy:{completedAt:"desc"},take:200}),
 tx.attempt.aggregate({where:{userId},_count:true})
 ]);
 const known:Record<string,string[]>={},days:Record<string,string[]>={};
 for(const p of progress)(known[p.deckId]??=[]).push(p.wordId);
 for(const a of activity)(days[a.day.toISOString().slice(0,10)]??=[]).push(`${a.deckId}:${a.wordId}`);
 const input:LearningInput={goal:profile.dailyGoal,customDecks:decks.map(d=>({id:d.id,title:d.title,description:d.description,category:d.category,level:d.level,color:d.color,symbol:d.symbol,custom:true,words:d.words.map(w=>({id:w.id,term:w.term,phonetic:w.phonetic,meaning:w.meaning,example:w.example}))})),known,saved:saved.map(s=>s.deckId),activity:days};
 return {version:learningVersion(profile.updatedAt,decks),state:{...input,name:profile.displayName,attempts:attempts.map(a=>({id:a.id,title:a.title,date:a.completedAt.toISOString(),score:a.score,answers:a.answers,questions:a.questions as unknown as import('./learning-data').Question[]}))},attemptCount:totals._count};
}
