"use client";
import { useEffect, useRef, useState } from "react";
import { lookupTerm, normalizeEnglishTerm, type Definition } from "@/lib/pronunciation";
import { lookupPronunciation } from "@/lib/pronunciation-client";

const POS_LABEL: Record<string, string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  pronoun: "Đại từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  interjection: "Thán từ",
  article: "Mạo từ",
};

export default function MeaningSuggestion({
  definitions,
  onSelect,
}: {
  definitions: Definition[];
  onSelect: (definition: string) => void;
}) {
  if (definitions.length === 0) return null;

  return (
    <div className="meaning-suggestion">
      <p className="meaning-suggestion-label">
        💡 Gợi ý nghĩa từ từ điển — chọn để điền vào ô Nghĩa:
      </p>
      <ul className="meaning-suggestion-list">
        {definitions.map((d, i) => (
          <li key={i}>
            <button
              type="button"
              className="meaning-suggestion-item"
              onClick={() => onSelect(d.definition)}
              title={d.example ? `Ví dụ: ${d.example}` : undefined}
            >
              {d.partOfSpeech && (
                <span className="meaning-suggestion-pos">
                  {POS_LABEL[d.partOfSpeech] ?? d.partOfSpeech}
                </span>
              )}
              <span className="meaning-suggestion-def">{d.definition}{d.example && <small className="meaning-suggestion-example">Ví dụ: {d.example}</small>}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="meaning-suggestion-note">
        Nghĩa bằng tiếng Anh từ từ điển. Bạn có thể sửa thành tiếng Việt sau khi điền.
      </p>
    </div>
  );
}

// Remount the lookup when the term changes, so old requests cannot supply new suggestions.
export function MeaningLookup({ term, onSelect }: { term: string; onSelect: (definition: string) => void }) {
  const normalized = normalizeEnglishTerm(term);
  return <MeaningLookupResult key={normalized} term={normalized} onSelect={onSelect} />;
}

function MeaningLookupResult({ term, onSelect }: { term: string; onSelect: (definition: string) => void }) {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [source, setSource] = useState<string>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const ticket = useRef(0);
  const busy = useRef(false);
  useEffect(() => () => { ticket.current++; }, []);
  async function lookup() {
    if (busy.current) return;
    if (!lookupTerm.safeParse(term).success) {
      setMessage("Nhập từ hoặc cụm từ tiếng Anh tối đa 80 ký tự để tra nghĩa.");
      return;
    }
    busy.current = true;
    const id = ++ticket.current;
    setPending(true);
    setMessage("");
    setDefinitions([]);
    try {
      const result = await lookupPronunciation(term, false, true);
      if (id !== ticket.current) return;
      setDefinitions(result.definitions);
      setSource(result.meaningSource);
      setMessage(result.definitions.length ? "Chọn một nghĩa bên dưới để điền vào ô Nghĩa." : "Chưa tìm thấy nghĩa của từ này. Bạn có thể nhập thủ công.");
    } catch {
      if (id === ticket.current) setMessage("Chưa kết nối được từ điển. Hãy thử lại hoặc nhập nghĩa thủ công.");
    } finally {
      if (id === ticket.current) { setPending(false); busy.current = false; }
    }
  }
  return <div className="meaning-lookup" aria-busy={pending}>
    <button type="button" className="button secondary" disabled={pending || !term} onClick={() => void lookup()}>{pending ? "Đang tra nghĩa…" : "Gợi ý nghĩa"}</button>
    <p className="meaning-suggestion-note" role="status">{pending ? "Đang tra nghĩa từ từ điển…" : message}</p>
    {definitions.length > 0 && source === "freedictionaryapi" && <small>
      Nguồn: <a href="https://freedictionaryapi.com" target="_blank" rel="noreferrer">FreeDictionaryAPI.com</a>
      {" · "}<a href={`https://en.wiktionary.org/wiki/${encodeURIComponent(term)}`} target="_blank" rel="noreferrer">Wiktionary</a>
      {" · "}<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
    </small>}
    <MeaningSuggestion definitions={definitions} onSelect={definition => { onSelect(definition); setMessage("Đã điền nghĩa. Bạn có thể chỉnh sửa trước khi lưu."); }} />
  </div>;
}
