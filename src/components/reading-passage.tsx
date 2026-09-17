import type { Reading } from "@/lib/reading";
import "./reading.css";

export function ReadingPassage({ reading }: { reading: Reading }) {
  return <div className="reading-documents">{reading.documents.map((doc, i) =>
    <article className={`reading-document reading-${doc.format}`} key={i}>
      <div className="reading-document-bar"><span>{doc.format === "email" ? "✉ EMAIL" : doc.format === "website" ? "←  →  ↻  WEBSITE" : `PASSAGE ${i + 1}`}</span></div>
      {doc.title && <h2>{doc.title}</h2>}
      <div className="reading-document-body">{doc.content}</div>
    </article>
  )}</div>;
}

export function QuestionMap({ numbers, answered, active, onSelect, disabled = false, completeLabel = "đã trả lời", emptyLabel = "chưa trả lời" }: {
  numbers: number[]; answered: boolean[]; active: number; onSelect: (index: number) => void; disabled?: boolean; completeLabel?: string; emptyLabel?: string;
}) {
  return <nav className="reading-question-map" aria-label="Bảng câu hỏi">
    {numbers.map((number, i) => <button type="button" key={i} disabled={disabled}
      className={answered[i] ? "is-answered" : ""} aria-current={i === active ? "step" : undefined}
      aria-label={`Câu ${number}, ${answered[i] ? completeLabel : emptyLabel}`} onClick={() => onSelect(i)}>{number}</button>)}
  </nav>;
}
