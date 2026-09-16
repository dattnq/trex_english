import { lookupTerm, type Pronunciation } from "@/lib/pronunciation";
export async function lookupPronunciation(raw: string, audio = false): Promise<Pronunciation> {
  const term=lookupTerm.safeParse(raw);
  if(!term.success)throw new Error("Nhập từ tiếng Anh tối đa 80 ký tự để tra IPA.");
  const response=await fetch(`/api/pronunciation?term=${encodeURIComponent(term.data)}${audio?"&audio=1":""}`,{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error("Chưa tra được từ điển. Bạn vẫn có thể nhập IPA thủ công.");
  return response.json();
}
