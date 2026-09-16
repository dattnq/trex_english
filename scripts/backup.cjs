// Application-data backup. Supabase Auth identities/storage require a separate provider backup.
require('dotenv/config');
const fs=require('node:fs'),path=require('node:path'),{Client}=require('pg');
const tables=['profiles','decks','words','saved_decks','word_progress','daily_word_activity','tests','test_questions','learning_sessions','attempts'];
(async()=>{const mode=process.argv[2],file=process.argv[3];if(!['export','restore-check','restore'].includes(mode)||!file)throw Error('Usage: node scripts/backup.cjs export|restore-check|restore FILE');
 const restoring=mode!=='export',source=process.env.DIRECT_URL||process.env.DATABASE_URL,target=restoring?process.env.RESTORE_DATABASE_URL:source;
 if(restoring&&(!target||new URL(target).hostname===new URL(source).hostname&&new URL(target).pathname===new URL(source).pathname))throw Error('Use a separate, empty staging database in RESTORE_DATABASE_URL.');
 const db=new Client({connectionString:target,connectionTimeoutMillis:8000});try{await db.connect();await db.query(restoring?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 if(!restoring){const snapshot={format:1,createdAt:new Date().toISOString(),tables:{}};for(const table of tables)snapshot.tables[table]=(await db.query(`SELECT * FROM public."${table}"`)).rows;
 fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});fs.writeFileSync(file,JSON.stringify(snapshot),{flag:'wx',mode:0o600});console.log('Application backup created. Keep it private; Auth identities are excluded.');
 }else{const snapshot=JSON.parse(fs.readFileSync(file,'utf8'));if(snapshot.format!==1||tables.some(t=>!Array.isArray(snapshot.tables?.[t])))throw Error('Invalid backup');
 for(const table of tables){if((await db.query(`SELECT 1 FROM public."${table}" LIMIT 1`)).rowCount)throw Error('Restore requires empty application tables');}
 for(const table of tables){const allowed=new Set((await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",[table])).rows.map(x=>x.column_name));
 for(const row of snapshot.tables[table]){const columns=Object.keys(row);if(columns.some(c=>!allowed.has(c)))throw Error('Schema mismatch');const values=columns.map(c=>['state','questions'].includes(c)?JSON.stringify(row[c]):row[c]);await db.query(`INSERT INTO public."${table}" (${columns.map(c=>'"'+c+'"').join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')})`,values);}
 const count=(await db.query(`SELECT count(*)::int AS n FROM public."${table}"`)).rows[0].n;if(count!==snapshot.tables[table].length)throw Error('Row-count verification failed');}
 console.log(mode==='restore-check'?'Restore rehearsal passed constraints/counts; rolling back.':'Restored application data into staging.');}
 await db.query(mode==='restore-check'?'ROLLBACK':'COMMIT');
 }catch(error){await db.query('ROLLBACK').catch(()=>{});console.error('Backup/restore failed; database changes rolled back. '+(error.code||'Check target, schema and file.'));process.exitCode=1;}finally{await db.end();}
})().catch(()=>{console.error('Invalid backup command or target. No changes made.');process.exitCode=1;});
