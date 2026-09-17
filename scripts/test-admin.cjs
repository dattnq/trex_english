const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const actorId='a88f84da-4fd4-405b-971b-cd6b01c85868',targetId='b88f84da-4fd4-405b-971b-cd6b01c85868';
const version='2026-09-15T00:00:00.000Z';
function context({role='ADMIN',existing={updatedAt:new Date(version),ownerId:null},fail=false,targetRole='LEARNER'}={}){
 const calls=[],cache=new Map();
 const record=(name)=>async arg=>{calls.push({name,arg});if(fail)throw new Error('private database error');return arg?.data??{};};
 const tx={ $executeRaw:record('lock'),profile:{findUnique:async arg=>arg.where.id===actorId?{role}:{id:targetId,role:targetRole},update:record('role.update')},word:{deleteMany:record('word.deleteMany'),upsert:record('word.upsert')},testQuestion:{deleteMany:record('question.deleteMany'),createMany:record('question.createMany')}};
 for(const model of ['deck','test'])tx[model]={findUnique:async()=>existing,create:record(model+'.create'),update:record(model+'.update'),delete:record(model+'.delete')};
 const db={$transaction:async fn=>fn(tx)};
 function load(file){const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;const loaded={exports:{}};cache.set(absolute,loaded);
 const source=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const customRequire=name=>name==='server-only'?{}:name==='@/lib/db'?{db}:name==='@/lib/auth'?{requireUser:async()=>({id:actorId,role:'ADMIN'})}:name==='next/cache'?{revalidatePath:record('revalidate')}:name.startsWith('@/')?load('src/'+name.slice(2)+'.ts'):require(name);
 new Function('exports','module','require',source)(loaded.exports,loaded,customRequire);return loaded.exports;}
 return {calls,load,tx,actions:load('src/actions/content.ts')};
}
const word={id:'word-1',term:'hello',phonetic:'',meaning:'xin chào',example:''};
const question={prompt:'Choose one',options:['One','Two','Three','Four'],answer:2,explanation:'Because three.'};
const content={kind:'deck',title:'Example',description:'',category:'Giao tiếp',level:'A1',color:'blue',symbol:'Aa',published:true,minutes:5,words:[word],questions:[]};
function form(fields){const f=new FormData();for(const [k,v]of Object.entries(fields))f.set(k,v);return f;}
test('rejects invalid data, duplicate word IDs/options and empty public content',()=>{
 const {contentInput}=context().load('src/lib/content-schema.ts');
 for(const value of [{...content,title:' '},{...content,words:[word,word]},{...content,words:[]},{...content,minutes:0},{...content,kind:'test',questions:[{...question,options:['a','A','c','d']}]},{...content,id:'existing'}])assert.equal(contentInput.safeParse(value).success,false);
 assert.equal(contentInput.safeParse({...content,published:false,words:[]}).success,true);
});
test('fresh learner role denies writes even if session claimed admin',async()=>{const c=context({role:'LEARNER'});const r=await c.actions.writeContent(content);assert.equal(r.ok,false);assert.match(r.message,/quyền/);assert.equal(c.calls.filter(x=>x.name!=='lock').length,0);});
test('fresh learner role denies delete',async()=>{const c=context({role:'LEARNER'});assert.equal((await c.actions.deleteContent({kind:'deck',id:'x',version})).ok,false);assert(!c.calls.some(x=>x.name.endsWith('.delete')));});
test('creates a public deck with stable word IDs and ordered positions',async()=>{const c=context();assert.equal((await c.actions.writeContent(content)).ok,true);const deck=c.calls.find(x=>x.name==='deck.create').arg.data;assert.equal(deck.visibility,'PUBLIC');assert.equal(deck.ownerId,null);const w=c.calls.find(x=>x.name==='word.upsert').arg;assert.equal(w.create.id,word.id);assert.equal(w.create.position,0);assert.equal(w.where.deckId_id.id,word.id);});
test('private system deck gets an owner to satisfy database constraint',async()=>{const c=context();assert.equal((await c.actions.writeContent({...content,id:'existing',version,published:false})).ok,true);assert.equal(c.calls.find(x=>x.name==='deck.update').arg.data.ownerId,actorId);});
test('editing a learner deck preserves its owner and retained progress',async()=>{const c=context({existing:{updatedAt:new Date(version),ownerId:targetId}});assert.equal((await c.actions.writeContent({...content,id:'existing',version})).ok,true);assert.equal(c.calls.find(x=>x.name==='deck.update').arg.data.ownerId,targetId);assert.deepEqual(c.calls.find(x=>x.name==='word.deleteMany').arg.where.id.notIn,[word.id]);});
test('stale editor cannot overwrite or delete newer content',async()=>{for(const kind of ['deck','test']){const c=context({existing:{updatedAt:new Date('2026-09-16T00:00:00.000Z')}});assert.equal((await c.actions.writeContent({...content,kind,questions:[question],id:'x',version})).ok,false);assert.equal((await c.actions.deleteContent({kind,id:'x',version})).ok,false);assert(!c.calls.some(x=>x.name.endsWith('.update')||x.name.endsWith('.delete')));}});
test('saving removed source does not recreate it',async()=>{const c=context({existing:null});const r=await c.actions.writeContent({...content,id:'x',version});assert.equal(r.ok,false);assert(!c.calls.some(x=>x.name.endsWith('.create')));});
test('test saves duration, correct answer, explanations and positions',async()=>{const c=context();assert.equal((await c.actions.writeContent({...content,kind:'test',words:[],minutes:12,questions:[question]})).ok,true);assert.equal(c.calls.find(x=>x.name==='test.create').arg.data.minutes,12);const q=c.calls.find(x=>x.name==='question.createMany').arg.data[0];assert.equal(q.answer,2);assert.equal(q.explanation,question.explanation);assert.equal(q.position,0);});
test('delete validates version and targets only the requested source',async()=>{const c=context();assert.equal((await c.actions.deleteContent({kind:'test',id:'x',version})).ok,true);assert.deepEqual(c.calls.find(x=>x.name==='test.delete').arg,{where:{id:'x'}});assert(!c.calls.some(x=>x.name==='deck.delete'));});
test('database internals are not returned to clients',async()=>{const c=context({fail:true});const r=await c.actions.writeContent(content);assert.equal(r.ok,false);assert(!r.message.includes('private database error'));});
test('role changes reject self, stale role and revoked administrators',async()=>{
 for(const [config,fields,pattern]of [[{},{userId:actorId,role:'LEARNER',expectedRole:'ADMIN'},/tự đổi/],[{targetRole:'ADMIN'},{userId:targetId,role:'LEARNER',expectedRole:'LEARNER'},/thay đổi/],[{role:'LEARNER'},{userId:targetId,role:'ADMIN',expectedRole:'LEARNER'},/quyền/]]){const c=context(config);const r=await c.load('src/actions/admin.ts').changeRoleAction({},form(fields));assert.match(r.message,pattern);assert(!c.calls.some(x=>x.name==='role.update'));}
});
test('authorized role change updates only role',async()=>{const c=context();const r=await c.load('src/actions/admin.ts').changeRoleAction({},form({userId:targetId,role:'ADMIN',expectedRole:'LEARNER'}));assert.match(r.message,/Đã cập nhật/);assert.deepEqual(c.calls.find(x=>x.name==='role.update').arg,{where:{id:targetId},data:{role:'ADMIN'}});});
test('starting a server test reads only published source and stores the answer snapshot server-side',async()=>{
 const c=context();let stored;
 c.tx.learningSession={findUnique:async()=>null,findFirst:async()=>null,create:async a=>{stored=a.data;}};
 c.tx.test.findFirst=async args=>{assert.equal(args.where.published,true);return {title:'Test',minutes:3,questions:[question]};};
 const r=await c.load('src/actions/attempts.ts').startSession('TEST','example',targetId);
 assert.deepEqual(r,{id:targetId});assert.equal(stored.state.questions[0].answer,2);assert.equal(stored.userId,actorId);assert.equal(stored.state.answers[0],-1);
});
test('a test session is inaccessible to a different owner',async()=>{
 const c=context();c.tx.learningSession={findFirst:async args=>{assert.deepEqual(args.where,{id:targetId,userId:actorId});return null;}};
 await assert.rejects(c.load('src/actions/attempts.ts').sessionCommand(targetId,{type:'poll',revision:0}),/bài làm/);
});
test('polling active test never returns answer keys, explanations or score',async()=>{
 const c=context(),engine=c.load('src/lib/session-engine.ts');
 c.tx.learningSession={findFirst:async()=>({id:targetId,userId:actorId,kind:'TEST',sourceId:'example',title:'Test',state:engine.begin([question],false,180000,Date.now())}),update:async()=>({})};
 const r=await c.load('src/actions/attempts.ts').sessionCommand(targetId,{type:'poll',revision:0});
 assert.equal(r.score,null);assert.equal(r.feedback,null);assert(!('answer' in r.questions[0]));assert(!('explanation' in r.questions[0]));
});
test('finished result survives a deleted test source and repeated submission is idempotent',async()=>{
 const c=context({existing:null}),engine=c.load('src/lib/session-engine.ts');let attempt;
 const active=engine.begin([question],false,180000,Date.now()),state=engine.step(active,{type:'submit',revision:0},Date.now());
 c.tx.learningSession={findFirst:async()=>({id:targetId,userId:actorId,kind:'TEST',sourceId:'deleted',title:'Test',state}),update:async()=>{throw Error('finished session must not change');}};
 c.tx.attempt={upsert:async args=>{attempt=args;}};
 const actions=c.load('src/actions/attempts.ts');
 for(let n=0;n<2;n++){assert.equal((await actions.sessionCommand(targetId,{type:'submit',revision:0})).phase,'finished');assert.deepEqual(attempt.update,{});assert.equal(attempt.create.testId,null);assert.equal(attempt.create.userId,actorId);assert.deepEqual(attempt.where,{id:targetId});}
});

test('admin save fills missing IPA locally and retains explicit manual transcription',async()=>{
 const c=context();assert.equal((await c.actions.writeContent(content)).ok,true);assert.match(c.calls.find(x=>x.name==='word.upsert').arg.create.phonetic,/ɫoʊ/);
 const manual=context();assert.equal((await manual.actions.writeContent({...content,words:[{...word,phonetic:'/manual/'}]})).ok,true);assert.equal(manual.calls.find(x=>x.name==='word.upsert').arg.create.phonetic,'/manual/');
});

test('start resumes the same unfinished source instead of creating another timer',async()=>{
 const c=context();c.tx.learningSession={findUnique:async()=>null,findFirst:async a=>{assert.equal(a.where.userId,actorId);assert.equal(a.where.sourceId,'example');assert.equal(a.where.kind,'TEST');return {id:actorId};},create:async()=>{throw Error('duplicate');}};
 assert.deepEqual(await c.load('src/actions/attempts.ts').startSession('TEST','example',targetId),{id:actorId});
});
test('poll without a transition does not write the database',async()=>{
 const c=context(),engine=c.load('src/lib/session-engine.ts');c.tx.learningSession={findFirst:async()=>({state:engine.begin([question],false,180000,Date.now())}),update:async()=>{throw Error('unexpected write');}};
 assert.equal((await c.load('src/actions/attempts.ts').sessionCommand(targetId,{type:'poll',revision:0})).phase,'answering');
});

test('reading groups and original question numbers survive admin save and session snapshots',async()=>{
 const c=context();
 const reading={id:'group-1',documents:[{format:'email',title:'Team meeting',content:'From: Anne\nThe meeting starts at ten.'}]};
 const q={...question,number:147,reading};
 assert.equal((await c.actions.writeContent({...content,kind:'test',words:[],questions:[q]})).ok,true);
 const storedQuestion=c.calls.find(x=>x.name==='question.createMany').arg.data[0];
 assert.deepEqual(storedQuestion.reading,reading);assert.equal(storedQuestion.number,147);
 let stored;
 c.tx.learningSession={findUnique:async()=>null,findFirst:async()=>null,create:async a=>{stored=a.data;}};
 c.tx.test.findFirst=async()=>({title:'Reading',minutes:10,questions:[q]});
 await c.load('src/actions/attempts.ts').startSession('TEST','reading',targetId);
 const engine=c.load('src/lib/session-engine.ts'),dto=engine.publicState(stored.state);
 assert.deepEqual(dto.questions[0].reading,reading);assert.equal(dto.questions[0].number,147);
 assert(!('answer' in dto.questions[0]));assert(!('explanation' in dto.questions[0]));
 const restored=engine.stateSchema.parse(JSON.parse(JSON.stringify(stored.state)));
 assert.deepEqual(restored.questions[0].reading,reading);
});

test('reading input rejects empty passages, mismatched groups and duplicate displayed numbers',()=>{
 const c=context(),schema=c.load('src/lib/content-schema.ts').contentInput;
 const reading={id:'shared',documents:[{format:'website',title:'Shop',content:'Opening hours'}]};
 for(const qs of [
  [{...question,reading:{...reading,documents:[{...reading.documents[0],content:''}]}}],
  [{...question,number:147},{...question,number:147}],
  [{...question,reading},{...question,reading:{...reading,documents:[{...reading.documents[0],content:'Different'}]}}],
 ])assert.equal(schema.safeParse({...content,kind:'test',questions:qs}).success,false);
});

test('bulk import accepts numbered multiline questions and rejects incomplete or duplicate entries',()=>{
 const {parseQuestionImport,questionImportExample}=context().load('src/lib/question-import.ts');
 const result=parseQuestionImport(questionImportExample.replace(/\n/g,'\r\n'));
 assert.equal(result.length,2);assert.equal(result[0].number,147);assert.equal(result[0].answer,1);
 assert.equal(result[1].answer,2);
 for(const text of ['',questionImportExample.replace('Answer: B',''),questionImportExample.replace('D. To introduce a colleague',''),questionImportExample.replace('148.','147.'),questionImportExample.replace('Answer: B','Answer: X')]) assert.throws(()=>parseQuestionImport(text));
 const multiline=parseQuestionImport('1. First line\nSecond line\nA. First\ncontinued\nB. Second\nC. Third\nD. Fourth\nĐáp án: D\nGiải thích: Correct\nMore explanation');
 assert.equal(multiline[0].prompt,'First line\nSecond line');assert.equal(multiline[0].options[0],'First\ncontinued');assert.equal(multiline[0].answer,3);
});
