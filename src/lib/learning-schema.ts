import { z } from "zod";
const id=z.string().min(1).max(160).regex(/^[\w-]+$/);
const word=z.object({id,term:z.string().trim().min(1).max(200),phonetic:z.string().max(200),meaning:z.string().trim().min(1).max(2000),example:z.string().max(4000)});
export const learningInput=z.object({
 goal:z.number().int().min(5).max(30),
 customDecks:z.array(z.object({id,title:z.string().trim().min(1).max(160),description:z.string().max(4000),category:z.string().min(1).max(80),level:z.string().max(8),color:z.string().max(24),symbol:z.string().max(16),custom:z.boolean().optional(),words:z.array(word).max(100).refine(a=>new Set(a.map(w=>w.id)).size===a.length)})).max(100).refine(a=>new Set(a.map(d=>d.id)).size===a.length),
 known:z.record(id,z.array(id).max(100)),saved:z.array(id).max(1000),
 activity:z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.array(z.string().max(321)).max(10000))
});
export type LearningInput=z.infer<typeof learningInput>;
