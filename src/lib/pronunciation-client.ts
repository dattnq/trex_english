import { lookupTerm, type PronunciationWithDefs } from "@/lib/pronunciation";
export async function lookupPronunciation(raw: string, audio = false, meanings = false): Promise<PronunciationWithDefs> {
  const term=lookupTerm.safeParse(raw);
  if(!term.success)throw new Error("Nhập từ tiếng Anh tối đa 80 ký tự để tra IPA.");
  const response=await fetch(`/api/pronunciation?term=${encodeURIComponent(term.data)}${audio?"&audio=1":""}${meanings?"&meanings=1":""}`,{signal:AbortSignal.timeout(meanings ? 15000 : 10000)});
  if(!response.ok)throw new Error("Chưa kết nối được từ điển. Bạn có thể thử lại hoặc nhập thủ công.");
  return response.json();
}
