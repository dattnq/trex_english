const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
const code=ts.transpileModule(fs.readFileSync("src/lib/session-engine.ts","utf8"),
  {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function loadReading(name) {
  if(name !== '@/lib/reading') return require(name);
  const reading={exports:{}};
  const source=ts.transpileModule(fs.readFileSync('src/lib/reading.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','module','require',source)(reading.exports,reading,require);
  return reading.exports;
}
const model={exports:{}};new Function("exports","module","require",code)(model.exports,model,loadReading);
const {begin,step,score,publicState}=model.exports;
const questions=[{prompt:'a',options:['a','b'],answer:0,explanation:'a'},{prompt:'b',options:['a','b'],answer:1,explanation:'b'}];
let s=begin(questions,true,10000,1000);
assert.equal(s.phase,'ready');
// Slow loading does not consume any question time.
s=step(s,{type:'poll',revision:s.revision},9000);assert.equal(s.phase,'ready');
s=step(s,{type:'activate',index:0,revision:s.revision},12000);
assert.equal(s.phase,'answering');assert.equal(s.deadline,22000);
// Duplicate activation, stale tabs and reload cannot reset a running deadline.
s=step(s,{type:'activate',index:0,revision:s.revision},15000);assert.equal(s.deadline,22000);
s=step(JSON.parse(JSON.stringify(s)),{type:'poll',revision:s.revision},18000);assert.equal(s.deadline,22000);
s=step(s,{type:'select',index:0,option:0,revision:s.revision},21999);
assert.equal(s.phase,'feedback');assert.equal(s.answers[0],0);
// Poll arrives four seconds after feedback ends. The next question is still unstarted.
s=step(s,{type:'poll',revision:s.revision},27499);
assert.equal(s.phase,'ready');assert.equal(s.index,1);
const waiting=s;
s=step(s,{type:'activate',index:0,revision:s.revision},28000);assert.equal(s.phase,'ready');
s=step(s,{type:'activate',index:1,revision:s.revision-1},28000);assert.equal(s.phase,'ready');
s=step(s,{type:'activate',index:1,revision:s.revision},30000);
assert.equal(s.deadline,40000);
s=step(s,{type:'select',index:1,option:1,revision:s.revision},39999);
s=step(s,{type:'poll',revision:s.revision},41499);
assert.equal(s.phase,'finished');assert.equal(score(s),2);
// Unopened questions expire after inactivity without granting a score.
s=step(waiting,{type:'poll',revision:waiting.revision},waiting.deadline);
assert.equal(s.phase,'finished');assert.equal(s.answers[1],-1);
// At the exact answering deadline a choice is rejected, even if its request started earlier.
s=begin(questions,true,10000,1000);
s=step(s,{type:'activate',index:0,revision:s.revision},2000);
s=step(s,{type:'select',index:0,option:0,revision:s.revision},12000);
assert.equal(s.phase,'feedback');assert.equal(s.answers[0],-1);
s=step(s,{type:'poll',revision:s.revision},99999);
assert.equal(s.phase,'ready');assert.equal(s.index,1);
// Legacy answering snapshots move into the new readiness handshake too.
s={...begin(questions,true,10000,1000),phase:'answering',deadline:6000};
s=step(s,{type:'poll',revision:s.revision},7500);assert.equal(s.phase,'ready');assert.equal(s.index,1);
// Normal tests retain absolute deadlines, revision checks and immutable final results.
s=begin(questions,false,300000,10000);
let dto=publicState(s);assert.equal(dto.feedback,null);assert.equal(dto.score,null);
assert.equal('answer' in dto.questions[0],false);assert.equal('explanation' in dto.questions[0],false);
s=step(s,{type:'select',index:1,option:1,revision:0},11000);
s=step(s,{type:'select',index:1,option:0,revision:0},12000);
assert.equal(s.answers[1],1);assert.equal(s.deadline,310000);
s=step(s,{type:'select',index:0,option:0,revision:s.revision},310000);
assert.equal(s.phase,'finished');assert.equal(s.answers[0],-1);assert.equal(score(s),1);
assert.deepEqual(step(s,{type:'submit',revision:s.revision},320000),s);
s=begin(questions,false,10000,1000);
s=step(s,{type:'activate',index:0,revision:0},2000);assert.equal(s.deadline,11000);assert.equal(s.revision,0);
s=step(s,{type:'select',index:0,option:0,revision:0},2000);
s=step(JSON.parse(JSON.stringify(s)),{type:'poll',revision:s.revision},3000);
assert.equal(s.deadline,11000);assert.equal(s.answers[0],0);
s=step(s,{type:'submit',revision:s.revision},5000);assert.equal(s.endedAt,5000);assert.equal(score(s),1);
console.log('Quiz readiness, slow transitions, exact deadlines, old snapshots and test timing passed.');