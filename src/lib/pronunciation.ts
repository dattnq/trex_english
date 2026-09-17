import { z } from "zod";

export function normalizeEnglishTerm(value: string) {
  return value.normalize("NFC").trim().replace(/[’‘]/g, "'").replace(/\s+/g, " ").toLowerCase();
}
export const lookupTerm = z.string().max(200).transform(normalizeEnglishTerm)
  .pipe(z.string().min(1).max(80).regex(/^[\p{L}]+(?:[' -][\p{L}]+)*$/u));
export type Pronunciation = { ipa: string; audioUrl: string; sourceUrl: string; licenseName: string; licenseUrl: string };
export type Definition = { partOfSpeech: string; definition: string; example?: string };
export type PronunciationWithDefs = Pronunciation & { definitions: Definition[]; meaningSource?: "freedictionaryapi" };
const empty: Pronunciation = { ipa:"", audioUrl:"", sourceUrl:"", licenseName:"", licenseUrl:"" };
const phonetic = z.object({text:z.string().optional(),audio:z.string().optional(),sourceUrl:z.string().optional(),license:z.object({name:z.string().optional(),url:z.string().optional()}).optional()});
const dictionary = z.array(z.object({phonetic:z.string().optional(),phonetics:z.array(phonetic).optional(),sourceUrls:z.array(z.string()).optional(),meanings:z.array(z.object({partOfSpeech:z.string().optional(),definitions:z.array(z.object({definition:z.string(),example:z.string().optional()})).optional()})).optional()}));
function httpsUrl(raw?: string) {
  if(!raw)return "";
  try { const u=new URL(raw.startsWith("//")?`https:${raw}`:raw);return u.protocol==="https:"&&!u.username&&!u.password?u.href:""; }catch{return "";}
}
export function safeAudioUrl(raw?: string) {
  const value=httpsUrl(raw);if(!value)return "";
  const u=new URL(value);
  return ["api.dictionaryapi.dev","ssl.gstatic.com","upload.wikimedia.org"].includes(u.hostname)&&(!u.port||u.port==="443")&&/\.(mp3|ogg|wav)$/i.test(u.pathname)?value:"";
}
export function parsePronunciation(raw: unknown): Pronunciation {
  const parsed=dictionary.safeParse(raw);if(!parsed.success)return {...empty};
  const variants=parsed.data.flatMap(entry=>{
    const items:z.infer<typeof phonetic>[]=[...(entry.phonetics??[]),...(entry.phonetic?[{text:entry.phonetic}]:[])]
    return items.map(p=>({...p,sourceUrl:p.sourceUrl??entry.sourceUrls?.[0]}));
  });
  // Keep IPA and audio from the same variant; different accents can differ.
  const selected=variants.find(p=>p.text?.trim()&&safeAudioUrl(p.audio))??variants.find(p=>p.text?.trim())??variants.find(p=>safeAudioUrl(p.audio));
  const ipa=(selected?.text??parsed.data.find(e=>e.phonetic)?.phonetic??"").trim().slice(0,200);
  return {ipa,audioUrl:safeAudioUrl(selected?.audio),sourceUrl:httpsUrl(selected?.sourceUrl),licenseName:(selected?.license?.name??"").slice(0,100),licenseUrl:httpsUrl(selected?.license?.url)};
}
export function parseDefinitions(raw: unknown): Definition[] {
  const parsed=dictionary.safeParse(raw);if(!parsed.success)return [];
  const defs:Definition[]=[];
  const seen=new Set<string>();
  for(const entry of parsed.data){
    for(const meaning of entry.meanings??[]){
      for(const d of meaning.definitions??[]){
        if(!d.definition.trim())continue;
        const key=`${meaning.partOfSpeech?.trim().toLowerCase() ?? ""}:${d.definition.trim().slice(0,300).toLowerCase()}`;
        if(seen.has(key))continue;
        seen.add(key);
        defs.push({partOfSpeech:(meaning.partOfSpeech??"").trim(),definition:d.definition.trim().slice(0,300),example:d.example?.trim().slice(0,200)||undefined});
        if(defs.length>=5)return defs;
      }
    }
  }
  return defs;
}

const freeDictionary = z.object({entries:z.array(z.object({
  language:z.object({code:z.string()}),
  partOfSpeech:z.string().optional(),
  senses:z.array(z.object({definition:z.string(),examples:z.array(z.string()).optional()})),
}))});
export function parseFreeDictionaryDefinitions(raw: unknown): Definition[] {
  const parsed=freeDictionary.safeParse(raw);
  if(!parsed.success)throw new Error("Invalid dictionary response");
  return parseDefinitions(parsed.data.entries.filter(entry=>entry.language.code==="en").map(entry=>({
    meanings:[{partOfSpeech:entry.partOfSpeech,definitions:entry.senses.map(sense=>({definition:sense.definition,example:sense.examples?.[0]}))}],
  })));
}
