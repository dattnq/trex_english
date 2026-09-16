import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Pronunciation } from "./pronunciation";
let entries: Map<string,string>|undefined;
export function localPronunciation(term:string): Pronunciation {
  if(!entries){
    const text=readFileSync(join(process.cwd(),"data/dictionaries/en_US.txt"),"utf8");
    entries=new Map(text.split(/\r?\n/).flatMap(line=>{const tab=line.indexOf("\t");return tab<1?[]:[[line.slice(0,tab),line.slice(tab+1).trim()]];}));
  }
  const ipa=(entries.get(term)??"").slice(0,200);
  return {ipa,audioUrl:"",sourceUrl:ipa?"https://github.com/open-dict-data/ipa-dict":"",licenseName:ipa?"MIT":"",licenseUrl:ipa?"https://github.com/open-dict-data/ipa-dict/blob/master/LICENSE":""};
}

export function suggestLocalIpa(term:string):string {
  try {return localPronunciation(term.normalize("NFC").trim().replace(/[’‘]/g,"'").replace(/\s+/g," ").toLowerCase()).ipa;}
  catch {return "";}
}
