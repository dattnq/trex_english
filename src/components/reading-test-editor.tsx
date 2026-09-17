"use client";

import { useState } from "react";
import { questionInput, type ContentInput } from "@/lib/content-schema";
import type { Reading } from "@/lib/reading";
import { parseQuestionImport, questionImportExample } from "@/lib/question-import";
import { ReadingPassage, QuestionMap } from "./reading-passage";

type Questions = ContentInput["questions"];
export default function ReadingTestEditor({ questions, onChange }: { questions: Questions; onChange: (questions: Questions) => void }) {
  const [index, setIndex] = useState(0), [preview, setPreview] = useState(false);
  const [text, setText] = useState(""), [message, setMessage] = useState("");
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, number>>({});
  const active = Math.min(index, Math.max(0, questions.length - 1)), q = questions[active];
  const groups = [...new Map(questions.flatMap(item => item.reading ? [[item.reading.id, item.reading] as const] : [])).values()];
  const updateQuestion = (patch: Partial<Questions[number]>) => onChange(questions.map((item, i) => i === active ? { ...item, ...patch } : item));
  function updateReading(reading: Reading) {
    onChange(questions.map(item => item.reading?.id === reading.id ? { ...item, reading } : item));
  }
  function addQuestion() {
    const number = Math.max(0, ...questions.map((item, i) => item.number ?? i + 1)) + 1;
    onChange([...questions, { number, prompt: "", options: ["", "", "", ""], answer: 0, explanation: "", reading: q?.reading ?? null }]);
    setIndex(questions.length);
  }
  function importQuestions() {
    try {
      const imported = parseQuestionImport(text).map(item => ({ ...item, reading: q?.reading ?? null }));
      const replaceBlank = q && !q.prompt.trim() && q.options.every(option => !option.trim()) && !q.explanation.trim();
      const existing = questions.map((item,i) => ({ ...item, number: item.number ?? i + 1 })).filter((_,i) => !replaceBlank || i !== active);
      if (imported.length + existing.length > 100) throw new Error("Mỗi đề tối đa 100 câu. Hãy chia thành các đề nhỏ hơn.");
      const numbers = [...existing.map(item => item.number), ...imported.map(item => item.number)];
      if (new Set(numbers).size !== numbers.length) throw new Error("Số câu dán vào trùng với câu đang có. Sửa số câu trước khi thêm.");
      onChange([...existing, ...imported]); setIndex(existing.length); setText("");
      setMessage(`Đã thêm ${imported.length} câu. Kiểm tra đáp án, bài đọc rồi bấm Lưu nội dung.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa đọc được nội dung."); }
  }
  function move(delta: number) {
    const target = active + delta;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions]; [next[active], next[target]] = [next[target], next[active]];
    onChange(next); setIndex(target);
  }
  return <section>
    <h2>Đề đọc & câu hỏi ({questions.length}/100)</h2>
    <p className="reading-editor-note">Tạo nhóm bài đọc một lần, rồi gán cho các câu liên quan. Có thể dùng tối đa 3 văn bản trong mỗi nhóm.</p>
    <div className="reading-editor-tools">
      <button type="button" className="button secondary" onClick={() => { setPreviewAnswers({}); setPreview(!preview); }}>{preview ? "← Tiếp tục nhập đề" : "Xem thử giao diện làm bài"}</button>
      <button type="button" className="button secondary" disabled={questions.length >= 100} onClick={addQuestion}>+ Thêm câu hỏi</button>
    </div>
    {!preview && <details className="reading-import"><summary>Nhập nhanh: dán nhiều câu hỏi A–D</summary>
      <p>Dán văn bản từ Word hoặc tài liệu theo mẫu bên dưới. Mỗi lựa chọn một dòng; Answer là đáp án đúng, Explanation là giải thích (không bắt buộc). Các câu mới được thêm vào cuối đề và dùng bài đọc của câu đang chọn. Nếu câu đang chọn còn trống hoàn toàn, câu trống đó được thay bằng các câu nhập vào.</p>
      <details><summary>Xem mẫu để sao chép</summary><pre>{questionImportExample}</pre></details>
      <label htmlFor="reading-import-text">Nội dung câu hỏi</label>
      <textarea id="reading-import-text" value={text} maxLength={250000} placeholder={questionImportExample} onChange={e => setText(e.target.value)} />
      <button type="button" className="button secondary" onClick={importQuestions} disabled={!text.trim()}>Kiểm tra & thêm câu hỏi</button>
      <p role="status">{message}</p>
    </details>}
    <QuestionMap numbers={questions.map((item,i) => item.number ?? i + 1)} answered={questions.map((item,i) => preview ? previewAnswers[i] !== undefined : questionInput.safeParse(item).success)} active={active} onSelect={setIndex} completeLabel={preview ? "đã trả lời" : "đã nhập đủ"} emptyLabel={preview ? "chưa trả lời" : "chưa nhập đủ"} />
    <p className="reading-editor-note">{preview ? "Ô xanh: đã chọn thử đáp án. Lựa chọn thử không thay đổi đáp án đúng của đề." : "Ô xanh: câu đã nhập đủ. Viền xanh đậm: câu đang chỉnh sửa."}</p>
    {!q ? <p>Thêm câu hỏi hoặc dán một nhóm câu để bắt đầu.</p> : <div className="reading-editor-grid">
      <section className="reading-editor-section">
        <h3>Bài đọc</h3>
        {!preview && <>
          <label>Nhóm bài đọc cho câu này<select value={q.reading?.id ?? ""} onChange={e => updateQuestion({ reading: groups.find(group => group.id === e.target.value) ?? null })}>
            <option value="">Không có bài đọc (câu độc lập)</option>
            {groups.map((group,i) => <option value={group.id} key={group.id}>Nhóm {i + 1}: {group.documents[0].title || "Chưa đặt tiêu đề"}</option>)}
          </select></label>
          <button className="button secondary" type="button" onClick={() => updateQuestion({ reading: { id: crypto.randomUUID(), documents: [{ format: "article", title: "", content: "" }] } })}>+ Tạo nhóm bài đọc mới</button>
          {q.reading && <>
            <p className="reading-editor-note">Sửa nội dung ở đây cập nhật tất cả câu cùng nhóm. Câu dùng nhóm này: {questions.flatMap((item,i) => item.reading?.id === q.reading?.id ? [item.number ?? i + 1] : []).join(", ")}.</p>
            {q.reading.documents.map((doc,di) => <div key={di}>
              <h4>Văn bản {di + 1}</h4>
              <label>Kiểu hiển thị<select value={doc.format} onChange={e => updateReading({ ...q.reading!, documents: q.reading!.documents.map((old,n) => n === di ? { ...old, format: e.target.value as typeof doc.format } : old) })}>
                <option value="article">Bài viết / thông báo</option><option value="email">Email / thư</option><option value="website">Trang web</option>
              </select></label>
              <label>Tiêu đề / địa chỉ trang web<input maxLength={200} value={doc.title} onChange={e => updateReading({ ...q.reading!, documents: q.reading!.documents.map((old,n) => n === di ? { ...old, title: e.target.value } : old) })} /></label>
              <label>Nội dung văn bản<textarea className="reading-content-input" maxLength={12000} value={doc.content} placeholder={doc.format === "email" ? "From: ...\nTo: ...\nDate: ...\nSubject: ...\n\nDear ..." : "Dán nội dung bài đọc ở đây. Giữ xuống dòng để tách đoạn."} onChange={e => updateReading({ ...q.reading!, documents: q.reading!.documents.map((old,n) => n === di ? { ...old, content: e.target.value } : old) })} /></label>
              {q.reading!.documents.length > 1 && <button type="button" onClick={() => { if (window.confirm("Bỏ văn bản này khỏi tất cả câu cùng nhóm?")) updateReading({ ...q.reading!, documents: q.reading!.documents.filter((_,n) => n !== di) }); }}>Bỏ văn bản này</button>}
            </div>)}
            <button type="button" className="button secondary" disabled={q.reading.documents.length >= 3} onClick={() => updateReading({ ...q.reading!, documents: [...q.reading!.documents, { format: "article", title: "", content: "" }] })}>+ Thêm văn bản vào nhóm</button>
          </>}
        </>}
        {q.reading ? <ReadingPassage reading={q.reading} /> : <p className="reading-editor-note">Câu này không gắn bài đọc.</p>}
      </section>
      <section className="reading-editor-section">
        <h3>Câu {q.number ?? active + 1}</h3>
        {preview ? <>
          <p style={{whiteSpace:"pre-wrap"}}>{q.prompt || "Chưa nhập câu hỏi"}</p>
          <div className="reading-preview-options">{q.options.map((option,oi) => <button type="button" key={oi} aria-pressed={previewAnswers[active] === oi} onClick={() => setPreviewAnswers({ ...previewAnswers, [active]: oi })}>{String.fromCharCode(65+oi)}. {option || "Chưa nhập lựa chọn"}</button>)}</div>
        </> : <>
          <label>Số câu hiển thị<input type="number" min={1} max={999} value={q.number ?? active + 1} onChange={e => updateQuestion({ number: Number(e.target.value) })} /></label>
          <label>Câu hỏi<textarea maxLength={2000} value={q.prompt} onChange={e => updateQuestion({ prompt: e.target.value })} /></label>
          {q.options.map((option,oi) => <label key={oi}>Lựa chọn {String.fromCharCode(65+oi)}<textarea maxLength={1000} value={option} onChange={e => updateQuestion({ options: q.options.map((old,n) => n === oi ? e.target.value : old) })} /></label>)}
          <label>Đáp án đúng<select value={q.answer} onChange={e => updateQuestion({ answer: Number(e.target.value) })}>{[0,1,2,3].map(n => <option key={n} value={n}>{String.fromCharCode(65+n)}</option>)}</select></label>
          <label>Giải thích<textarea maxLength={4000} value={q.explanation} onChange={e => updateQuestion({ explanation: e.target.value })} /></label>
          <div className="reading-editor-tools"><button type="button" disabled={active === 0} onClick={() => move(-1)}>↑ Đưa lên</button><button type="button" disabled={active === questions.length-1} onClick={() => move(1)}>↓ Đưa xuống</button><button type="button" onClick={() => { if (window.confirm("Bỏ câu hỏi này khỏi đề?")) onChange(questions.filter((_,i) => i !== active)); }}>Bỏ câu này</button></div>
        </>}
      </section>
    </div>}
  </section>;
}
