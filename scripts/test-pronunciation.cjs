const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {NextResponse}=require('next/server');
function context(fetcher=async()=>{throw Error('offline');}){
 const cache=new Map();
 function load(file){const absolute=path.resolve(file);if(cache.has(absolute))return cache.get(absolute).exports;const m={exports:{}};cache.set(absolute,m);const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const localRequire=name=>name==='server-only'?{}:name==='next/server'?{NextResponse}:name.startsWith('@/')?load('src/'+name.slice(2)+'.ts'):name.startsWith('.')?load(path.resolve(path.dirname(absolute),name+'.ts')):require(name);
 new Function('exports','module','require','fetch',code)(m.exports,m,localRequire,fetcher);return m.exports;}
 return {load};
}
const c=context(),p=c.load('src/lib/pronunciation.ts');
const request=(term,audio=false)=>({nextUrl:new URL('https://trex.test/api/pronunciation?term='+encodeURIComponent(term)+(audio?'&audio=1':''))});
test('normalizes English terms and rejects paths, URLs and oversized queries',()=>{
 assert.equal(p.lookupTerm.parse('  HELLO  '),'hello');assert.equal(p.lookupTerm.parse('don’t'),"don't");assert.equal(p.lookupTerm.parse('ice   cream'),'ice cream');
 for(const v of ['',null,'../secret','https://host/a','x'.repeat(81)])assert.equal(p.lookupTerm.safeParse(v).success,false);
});
test('only trusted HTTPS recording URLs can be played',()=>{
 assert.equal(p.safeAudioUrl('//ssl.gstatic.com/dictionary/hello.mp3'),'https://ssl.gstatic.com/dictionary/hello.mp3');
 for(const v of ['http://api.dictionaryapi.dev/a.mp3','https://evil.invalid/a.mp3','https://api.dictionaryapi.dev.evil.invalid/a.mp3','https://user:secret@api.dictionaryapi.dev/a.mp3','javascript:alert(1)','https://api.dictionaryapi.dev:8080/a.mp3','https://api.dictionaryapi.dev/a.html'])assert.equal(p.safeAudioUrl(v),'');
});
test('selects matching IPA and audio and preserves source attribution',()=>{
 const result=p.parsePronunciation([{phonetic:'/root/',phonetics:[{text:'/silent/'},{text:'/recorded/',audio:'https://api.dictionaryapi.dev/media/hello.mp3',sourceUrl:'https://commons.wikimedia.org/wiki/File:hello',license:{name:'CC BY-SA',url:'https://creativecommons.org/licenses/by-sa/4.0/'}}]}]);
 assert.equal(result.ipa,'/recorded/');assert(result.audioUrl.endsWith('hello.mp3'));assert.equal(result.licenseName,'CC BY-SA');assert(result.sourceUrl.startsWith('https://commons.'));
});
test('does not pair unrelated IPA with an audio-only variant',()=>{
 const result=p.parsePronunciation([{phonetic:'/root/',phonetics:[{audio:'https://api.dictionaryapi.dev/hello.mp3'}]}]);assert.equal(result.ipa,'/root/');assert.equal(result.audioUrl,'');
});
test('missing and malformed dictionary results do not invent pronunciation',()=>{
 for(const input of [null,{},[],[{phonetics:[{audio:17}]}]]){const result=p.parsePronunciation(input);assert.equal(result.ipa,'');assert.equal(result.audioUrl,'');}
});
test('bundled IPA works offline and unknown words stay empty',()=>{
 const local=c.load('src/lib/local-pronunciation.ts').localPronunciation;
 for(const term of ['hello','beautiful','inspire'])assert.match(local(term).ipa,/\//);
 assert.equal(local('qzxqzxunknown').ipa,'');
});
test('IPA lookup uses bundled data without any external request',async()=>{
 let calls=0;const r=await context(async()=>{calls++;throw Error('must not fetch');}).load('src/app/api/pronunciation/route.ts').GET(request('HELLO'));
 assert.equal(r.status,200);assert.match((await r.json()).ipa,/ɫoʊ/);assert.equal(calls,0);
});
test('invalid lookup returns 400 before accessing external services',async()=>{
 let calls=0;const r=await context(async()=>{calls++;}).load('src/app/api/pronunciation/route.ts').GET(request('../secrets'));assert.equal(r.status,400);assert.equal(calls,0);
});
test('recording lookup recovers to offline IPA when dictionary is unavailable',async()=>{
 const r=await c.load('src/app/api/pronunciation/route.ts').GET(request('hello',true));assert.equal(r.status,200);const body=await r.json();assert(body.ipa);assert.equal(body.audioUrl,'');assert.match(r.headers.get('cache-control'),/max-age=60/);
});
test('unknown terms with an unavailable dictionary return a recoverable error',async()=>{
 const r=await c.load('src/app/api/pronunciation/route.ts').GET(request('qzxqzxunknown'));assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('404 is a normal no-result outcome and recording requests use a fixed endpoint',async()=>{
 let requested='';const r=await context(async url=>{requested=url;return {status:404,ok:false};}).load('src/app/api/pronunciation/route.ts').GET(request('unknown-word'));
 assert.equal(r.status,200);assert.equal((await r.json()).ipa,'');assert.equal(requested,'https://api.dictionaryapi.dev/api/v2/entries/en/unknown-word');
});
test('available recordings are returned with their matching pronunciation',async()=>{
 const r=await context(async()=>({status:200,ok:true,json:async()=>[{phonetics:[{text:'/həloʊ/',audio:'https://api.dictionaryapi.dev/hello.mp3'}]}]})).load('src/app/api/pronunciation/route.ts').GET(request('hello',true));const result=await r.json();assert.equal(result.ipa,'/həloʊ/');assert(result.audioUrl.endsWith('.mp3'));
});
