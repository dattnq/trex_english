import { NextResponse, type NextRequest } from "next/server";
import { lookupTerm, parsePronunciation, parseDefinitions, parseFreeDictionaryDefinitions } from "@/lib/pronunciation";
import { localPronunciation } from "@/lib/local-pronunciation";
export async function GET(request: NextRequest) {
  const term=lookupTerm.safeParse(request.nextUrl.searchParams.get("term"));
  if(!term.success)return NextResponse.json({error:"Nhập từ hoặc cụm từ tiếng Anh tối đa 80 ký tự."},{status:400});
  let local=parsePronunciation([]);
  try {local=localPronunciation(term.data);}catch{/* Dictionary API remains available if the local data file is missing. */}
  const recording=request.nextUrl.searchParams.get("audio")==="1";
  const meanings=request.nextUrl.searchParams.get("meanings")==="1";
  if(local.ipa&&!recording&&!meanings)return NextResponse.json({...local,definitions:[]},{headers:{"Cache-Control":"public, max-age=86400"}});
  if(meanings){
    try {
      const response=await fetch(
        `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(term.data)}`,
        {next:{revalidate:86400},signal:AbortSignal.timeout(5000),redirect:"error"},
      );
      if(response.status===404)return NextResponse.json({...local,definitions:[]},{headers:{"Cache-Control":"public, max-age=3600"}});
      if(!response.ok)throw new Error("Dictionary unavailable");
      const definitions=parseFreeDictionaryDefinitions(await response.json());
      return NextResponse.json({...local,definitions,meaningSource:"freedictionaryapi"},{headers:{"Cache-Control":"public, max-age=86400"}});
    }catch{/* Try the original provider if the primary dictionary is unavailable. */}
  }
  try {
    const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.data)}`,{
      next:{revalidate:86400},signal:AbortSignal.timeout(2500),redirect:"error",
    });
    if(response.status===404)return NextResponse.json({...local,definitions:[]},{headers:{"Cache-Control":"public, max-age=3600"}});
    if(!response.ok)throw new Error("Dictionary unavailable");
    const json:unknown=await response.json();
    const external=parsePronunciation(json);
    const definitions=parseDefinitions(json);
    return NextResponse.json({...(external.ipa||external.audioUrl?external:local),definitions},{headers:{"Cache-Control":"public, max-age=86400"}});
  }catch{
    if(local.ipa&&!meanings)return NextResponse.json({...local,definitions:[]},{headers:{"Cache-Control":"public, max-age=60"}});
    return NextResponse.json({error:"Chưa kết nối được từ điển. Bạn có thể thử lại hoặc nhập thủ công."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
