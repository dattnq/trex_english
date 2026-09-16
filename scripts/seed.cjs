const fs = require("node:fs");
const ts = require("typescript");
const { Client } = require("pg");
require("dotenv/config");
const code = ts.transpileModule(
  fs.readFileSync("prisma/seed-data.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const model = { exports: {} };
new Function("exports", "module", code)(model.exports, model);
const { starterDecks, tests } = model.exports;
const client = new Client({ connectionString: process.env.DIRECT_URL });
async function main() {
  if (!process.env.DIRECT_URL?.trim()) {
    throw new Error("Thiếu DIRECT_URL trong cấu hình môi trường.");
  }
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(73191, 2)");
    for (const d of starterDecks) {
      const inserted = await client.query(`INSERT INTO decks
        (id,title,description,category,level,color,symbol,visibility,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLIC',now())
        ON CONFLICT (id) DO NOTHING RETURNING id`,
        [d.id,d.title,d.description,d.category,d.level,d.color,d.symbol]);
      if (!inserted.rowCount) continue;
      for (const [i,w] of d.words.entries()) await client.query(`INSERT INTO words
        (deck_id,id,term,phonetic,meaning,example,position,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,now())`,
        [d.id,w.id,w.term,w.phonetic,w.meaning,w.example,i]);
    }
    for (const t of tests) {
      const inserted = await client.query(`INSERT INTO tests
        (id,title,description,level,category,minutes,color,published,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,true,now())
        ON CONFLICT (id) DO NOTHING RETURNING id`,
        [t.id,t.title,t.description,t.level,t.category,t.minutes,t.color]);
      if (!inserted.rowCount) continue;
      for (const [i,q] of t.questions.entries()) await client.query(`INSERT INTO test_questions
        (id,test_id,position,prompt,options,answer,explanation)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [`${t.id}-question-${i+1}`,t.id,i,q.prompt,q.options,q.answer,q.explanation]);
    }
    await client.query("COMMIT"); console.log("Seed completed.");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}
main().catch(() => { console.error("Seed failed; check DIRECT_URL and database configuration.");
  process.exitCode = 1; }).finally(() => client.end());
