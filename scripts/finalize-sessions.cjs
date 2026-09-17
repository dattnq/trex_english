// Finalize expired sessions. Run every minute using the deployment scheduler.
require('dotenv/config');
const fs=require('node:fs'),ts=require('typescript'),{Client}=require('pg');
const compiled=ts.transpileModule(fs.readFileSync('src/lib/session-engine.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const engine={exports:{}};new Function('exports','module','require',compiled)(engine.exports,engine,name=>{
 if(name!=='@/lib/reading')return require(name);
 const reading={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('src/lib/reading.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('exports','module','require',source)(reading.exports,reading,require);
 return reading.exports;
});
const {stateSchema,step,score}=engine.exports;
(async()=>{const db=new Client({connectionString:process.env.DIRECT_URL||process.env.DATABASE_URL,connectionTimeoutMillis:8000});let finished=0,advanced=0;try{await db.connect();
 const candidates=await db.query("SELECT id FROM learning_sessions WHERE state->>'phase'<>'finished' AND (state->>'deadline')::numeric<=$1 ORDER BY updated_at LIMIT 100",[Date.now()]);
 for(const {id}of candidates.rows){await db.query('BEGIN');try{
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1),4)',[id]);
  const {rows}=await db.query('SELECT * FROM learning_sessions WHERE id=$1 FOR UPDATE',[id]);if(!rows.length){await db.query('ROLLBACK');continue;}
  const row=rows[0],before=stateSchema.parse(row.state),after=step(before,{type:'poll',revision:before.revision},Date.now());
  if(after.revision!==before.revision){await db.query('UPDATE learning_sessions SET state=$2::jsonb,updated_at=now() WHERE id=$1',[id,JSON.stringify(after)]);advanced++;}
  if(after.phase==='finished'){
   await db.query(`INSERT INTO attempts(id,user_id,kind,deck_id,test_id,title,questions,answers,score,completed_at)
    VALUES($1,$2,$3,(SELECT id FROM decks WHERE id=$4),(SELECT id FROM tests WHERE id=$5),$6,$7::jsonb,$8,$9,$10)
    ON CONFLICT(id) DO NOTHING`,[id,row.user_id,row.kind,row.kind==='QUIZ'?row.source_id:null,row.kind==='TEST'?row.source_id:null,row.title,JSON.stringify(after.questions),after.answers,score(after),new Date(after.endedAt)]);finished++;
  }await db.query('COMMIT');
 }catch{await db.query('ROLLBACK');console.error('Session finalization failed; transaction rolled back.');process.exitCode=1;}}
 console.log(JSON.stringify({checked:candidates.rowCount,advanced,finished}));
}catch{console.error('Finalizer unavailable; check database connectivity and migrations.');process.exitCode=1;}finally{await db.end();}})();
