import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Deck } from "@/lib/learning-data";
export const publicDeckCatalog=cache(async ():Promise<{decks:Deck[];error:boolean}>=>{
 try {const rows=await db.deck.findMany({where:{visibility:"PUBLIC"},orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true,title:true,description:true,category:true,level:true,color:true,symbol:true,words:{orderBy:[{position:"asc"},{id:"asc"}],select:{id:true,term:true,phonetic:true,meaning:true,example:true}}}});return {decks:rows,error:false};}
 catch{return {decks:[],error:true};}
});
