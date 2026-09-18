const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
const source = ts.transpileModule(fs.readFileSync('src/lib/session-sync.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('exports', 'module', 'require', source)(mod.exports, mod, require);
const { createSessionSync } = mod.exports;
const initial = { quiz: false, questions: [{ prompt: 'First', options: ['A','B'], number: 147 }, { prompt: 'Second', options: ['A','B'], number: 148 }], answers: [-1,-1], index: 0, phase: 'answering', deadline: 100000, serverNow: 0, revision: 0, score: null, feedback: null };
const tick = () => new Promise(resolve => setImmediate(resolve));
async function setup(state = initial) {
  const requests = [], views = [];
  const sync = createSessionSync(command => new Promise((resolve,reject) => requests.push({ command, resolve, reject })), view => views.push(view));
  sync.poll(); requests[0].resolve(state); await tick();
  return { sync, requests, views, view: () => views.at(-1) };
}

test('selection is shown before a delayed server response and confirmed state stays immutable', async () => {
  const h = await setup(); h.sync.select(0,1);
  assert.deepEqual(h.view().answers,[1,-1]); assert.deepEqual(h.view().state.answers,[-1,-1]); assert.equal(h.view().saving,true);
  h.requests[1].resolve({...initial,answers:[1,-1],revision:1}); await tick();
  assert.deepEqual(h.view().answers,[1,-1]); assert.equal(h.view().saving,false);
});
test('rapid changes are coalesced and sent serially using fresh revisions', async () => {
  const h = await setup(); h.sync.select(0,0); h.sync.select(1,0); h.sync.select(1,1); h.sync.select(0,1);
  assert.equal(h.requests.length,2); assert.deepEqual(h.view().answers,[1,1]);
  h.requests[1].resolve({...initial,answers:[0,-1],revision:1}); await tick();
  assert.deepEqual(h.requests[2].command,{type:'select',index:1,option:1,revision:1}); assert.deepEqual(h.view().answers,[1,1]);
  h.requests[2].resolve({...initial,answers:[0,1],revision:2}); await tick();
  assert.deepEqual(h.requests[3].command,{type:'select',index:0,option:1,revision:2});
  h.requests[3].resolve({...initial,answers:[1,1],revision:3}); await tick();
  assert.equal(h.view().saving,false); assert.deepEqual(h.view().answers,[1,1]);
});
test('an in-flight poll cannot overwrite an optimistic selection', async () => {
  const h = await setup(); h.sync.poll(); h.sync.select(0,1);
  assert.deepEqual(h.view().answers,[1,-1]); assert.equal(h.requests.length,2);
  h.requests[1].resolve({...initial,revision:3}); await tick();
  assert.deepEqual(h.view().answers,[1,-1]); assert.equal(h.requests[2].command.revision,3);
});
test('network failure restores confirmed answer, reports its question and preserves other queued choices', async () => {
  const h = await setup({...initial,answers:[0,-1]}); h.sync.select(0,1); h.sync.select(1,1);
  h.requests[1].reject(new Error('offline')); await tick();
  assert.deepEqual(h.view().answers,[0,1]); assert.match(h.view().error,/147/);
  h.requests[2].resolve({...initial,answers:[0,1],revision:1}); await tick();
  assert.match(h.view().error,/147/); assert.equal(h.view().saving,false);
  h.sync.poll(); h.requests[3].resolve({...initial,answers:[0,1],revision:1}); await tick();
  assert.match(h.view().error,/147/);
});
test('server rejection rolls back without pretending the choice was saved', async () => {
  const h = await setup(); h.sync.select(0,1);
  h.requests[1].resolve({...initial,answers:[0,-1],revision:4}); await tick();
  assert.deepEqual(h.view().answers,[0,-1]); assert.match(h.view().error,/tab khác/);
});
test('expiry drops queued choices and keeps authoritative final score and answers', async () => {
  const h = await setup(); h.sync.select(0,1); h.sync.select(1,1);
  h.requests[1].resolve({...initial,phase:'finished',score:0,revision:1}); await tick();
  assert.deepEqual(h.view().answers,[-1,-1]); assert.equal(h.requests.length,2); assert.equal(h.view().saving,false);
  h.sync.select(0,0); assert.equal(h.requests.length,2);
});
test('submission waits for saved answers and blocks additional selections while submitting', async () => {
  const h = await setup(); h.sync.select(0,1); h.sync.submit(); assert.equal(h.requests.length,2);
  h.requests[1].resolve({...initial,answers:[1,-1],revision:1}); await tick();
  h.sync.submit(); assert.equal(h.view().submitting,true);
  assert.deepEqual(h.requests[2].command,{type:'submit',revision:1});
  h.sync.select(1,1); assert.deepEqual(h.view().answers,[1,-1]);
});
test('quiz accepts only one answer for the current question before feedback', async () => {
  const h = await setup({...initial,quiz:true}); h.sync.select(1,0); assert.equal(h.requests.length,1);
  h.sync.select(0,1); h.sync.select(0,0); assert.equal(h.requests.length,2); assert.deepEqual(h.view().answers,[1,-1]);
  h.requests[1].resolve({...initial,quiz:true,answers:[1,-1],phase:'feedback',revision:1}); await tick();
  h.sync.select(0,0); assert.equal(h.requests.length,2);
});
test('disposing stops unsent writes and late updates', async () => {
  const h = await setup(); h.sync.select(0,0); h.sync.select(1,1); const count=h.views.length;
  h.sync.dispose(); h.requests[1].resolve({...initial,answers:[0,-1],revision:1}); await tick();
  assert.equal(h.requests.length,2); assert.equal(h.views.length,count);
});
test('a successful retry clears only its own failure and another selection does not hide errors', async () => {
  const h = await setup(); h.sync.select(0,1); h.requests[1].reject(new Error('offline')); await tick();
  h.sync.select(1,1); assert.match(h.view().error,/147/);
  h.requests[2].reject(new Error('offline')); await tick();
  assert.match(h.view().error,/147/); assert.match(h.view().error,/148/);
  h.sync.select(0,1); h.requests[3].resolve({...initial,answers:[1,-1],revision:1}); await tick();
  assert.doesNotMatch(h.view().error,/147/); assert.match(h.view().error,/148/);
  h.sync.select(1,1); h.requests[4].resolve({...initial,answers:[1,1],revision:2}); await tick();
  assert.equal(h.view().error,'');
});
