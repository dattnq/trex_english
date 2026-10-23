"use client";

import { useMemo, useState } from "react";

export type ImportedWord = { id: string; term: string; phonetic: string; meaning: string; example: string };

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

export default function BulkWordImport({ existingWords, onImport }: {
  existingWords: Pick<ImportedWord, "term">[];
  onImport: (words: ImportedWord[]) => void;
}) {
  const [text, setText] = useState("");
  const parsed = useMemo(() => {
    const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!rows.length) return [];
    const delimiter = rows.some((row) => row.includes("\t")) ? "\t" : rows.some((row) => row.includes(",")) ? "," : "|";
    const cells = rows.map((row) => splitCsvLine(row, delimiter));
    const first = cells[0].map((cell) => cell.toLocaleLowerCase("vi").trim());
    const hasHeader = first.some((cell) => ["từ", "từ tiếng anh", "term", "word"].includes(cell));
    const start = hasHeader ? 1 : 0;
    const termIndex = hasHeader ? Math.max(0, first.findIndex((cell) => ["từ", "từ tiếng anh", "term", "word"].includes(cell))) : 0;
    const meaningIndex = hasHeader ? first.findIndex((cell) => ["nghĩa", "nghĩa tiếng việt", "meaning", "definition"].includes(cell)) : 1;
    const exampleIndex = hasHeader ? first.findIndex((cell) => ["ví dụ", "câu ví dụ", "example"].includes(cell)) : 2;
    const seen = new Set(existingWords.map((word) => word.term.trim().toLocaleLowerCase("en")));
    return cells.slice(start).map((row) => {
      const term = (row[termIndex] ?? "").trim();
      const meaning = (row[meaningIndex] ?? "").trim();
      const key = term.toLocaleLowerCase("en");
      const duplicate = Boolean(term && seen.has(key));
      if (term) seen.add(key);
      return { term, meaning, example: exampleIndex >= 0 ? (row[exampleIndex] ?? "").trim() : "", duplicate, valid: Boolean(term && meaning && !duplicate) };
    });
  }, [text, existingWords]);
  const existingCount = existingWords.filter((word) => word.term.trim()).length;
  const addable = parsed.filter((row) => row.valid).slice(0, Math.max(0, 100 - existingCount));
  const skipped = parsed.length - addable.length;

  return <section className="bulk-import panel" aria-labelledby="bulk-import-title">
    <h3 id="bulk-import-title">Nhập nhiều từ cùng lúc</h3>
    <p>Dán bảng từ Excel/Google Sheets hoặc nhập mỗi dòng theo dạng <code>từ, nghĩa, câu ví dụ</code>. Cột câu ví dụ có thể bỏ trống.</p>
    <label htmlFor="bulk-word-text">Danh sách từ</label>
    <textarea id="bulk-word-text" value={text} onChange={(event) => setText(event.target.value)} rows={6} maxLength={100000} placeholder={'term, meaning, example\napple, quả táo, I ate an apple.\nbook, quyển sách'} />
    {parsed.length > 0 && <>
      <p className="bulk-import-summary" role="status">Xem trước {parsed.length} dòng · {addable.length} từ có thể thêm{skipped ? ` · ${skipped} dòng lỗi, trùng hoặc vượt giới hạn sẽ được bỏ qua` : ""}</p>
      <div className="bulk-import-preview"><table><thead><tr><th>Từ</th><th>Nghĩa</th><th>Ví dụ</th><th>Trạng thái</th></tr></thead><tbody>{parsed.slice(0, 20).map((row, index) => <tr key={`${row.term}-${index}`}><td>{row.term || "—"}</td><td>{row.meaning || "—"}</td><td>{row.example || "—"}</td><td>{row.duplicate ? "Trùng từ" : row.valid ? "Sẵn sàng" : "Thiếu từ hoặc nghĩa"}</td></tr>)}</tbody></table>{parsed.length > 20 && <small>Đang hiển thị 20/{parsed.length} dòng đầu.</small>}</div>
      <button type="button" className="button secondary" disabled={!addable.length} onClick={() => { onImport(addable.map((row) => ({ id: crypto.randomUUID(), term: row.term, phonetic: "", meaning: row.meaning, example: row.example }))); setText(""); }}>Thêm {addable.length} từ vào danh sách</button>
    </>}
  </section>;
}
