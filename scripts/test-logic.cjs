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
const questions=[{prompt:"a",options:["a","b"],answer:0,explanation:"a"},
  {prompt:"b",options:["a","b"],answer:1,explanation:"b"}];
let s=begin(questions,true,5000,10000);
s=step(s,{type:"select",index:0,option:0,revision:0},14999);
assert.equal(s.phase,"feedback");assert.equal(s.answers[0],0);
s=step(s,{type:"select",index:0,option:1,revision:1},15000);
assert.equal(s.answers[0],0);
s=step(s,{type:"poll",revision:1},16499);assert.equal(s.index,1);
s=step(s,{type:"select",index:1,option:1,revision:s.revision},17000);
s=step(s,{type:"poll",revision:s.revision},18500);
assert.equal(score(s),2);assert.equal(s.phase,"finished");
s=begin(questions,true,5000,10000);
s=step(s,{type:"select",index:0,option:0,revision:0},15000);
assert.equal(s.answers[0],-1);assert.equal(s.phase,"feedback");
s=begin(questions,false,300000,10000);
let dto=publicState(s);assert.equal(dto.feedback,null);assert.equal(dto.score,null);
assert.equal("answer" in dto.questions[0],false);assert.equal("explanation" in dto.questions[0],false);
s=step(s,{type:"select",index:1,option:1,revision:0},11000);
s=step(s,{type:"select",index:1,option:0,revision:0},12000);
assert.equal(s.answers[1],1);assert.equal(s.deadline,310000);
s=step(s,{type:"select",index:0,option:0,revision:s.revision},310000);
assert.equal(s.phase,"finished");assert.equal(s.answers[0],-1);assert.equal(score(s),1);
assert.deepEqual(step(s,{type:"submit",revision:s.revision},320000),s);
console.log("All session logic assertions passed.");

// A suspended tab must not extend either the question or the complete quiz.
s=begin(questions,true,5000,10000);
s=step(s,{type:'poll',revision:0},22000);
assert.equal(s.index,1);assert.equal(s.phase,'feedback');assert.equal(s.deadline,23000);
s=step(s,{type:'select',index:1,option:1,revision:s.revision},99999);
assert.equal(s.phase,'finished');assert.equal(s.endedAt,23000);assert.equal(score(s),0);
assert.deepEqual(s.answers,[-1,-1]);
// Reloaded JSON snapshots retain deadlines and accepted answers.
s=begin(questions,false,10000,1000);
s=step(s,{type:'select',index:0,option:0,revision:0},2000);
s=step(JSON.parse(JSON.stringify(s)),{type:'poll',revision:s.revision},3000);
assert.equal(s.deadline,11000);assert.equal(s.answers[0],0);
s=step(s,{type:'select',index:0,option:1,revision:s.revision},4000);
assert.equal(s.answers[0],1);assert.equal(publicState(s).feedback,null);
s=step(s,{type:'submit',revision:s.revision},5000);
assert.equal(s.endedAt,5000);assert.equal(score(s),0);
console.log('Offline, reload and submission boundaries passed.');
