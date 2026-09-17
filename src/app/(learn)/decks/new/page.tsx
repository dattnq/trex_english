"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLearning } from "@/components/learning-provider";
import { MeaningLookup } from "@/components/meaning-suggestion";
import PronunciationFields from "@/components/pronunciation-fields";
import { lookupPronunciation } from "@/lib/pronunciation-client";
import { Icon } from "@/components/ui";
import Link from "next/link";

const COLORS = [
  ["blue", "Xanh dương"],
  ["green", "Xanh lá"],
  ["purple", "Tím"],
  ["orange", "Cam"],
  ["peach", "Cam nhạt"],
  ["lilac", "Tím nhạt"],
] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type Color = (typeof COLORS)[number][0];
type Level = (typeof LEVELS)[number];

type WordDraft = { id: string; term: string; phonetic: string; meaning: string; example: string };

export default function NewDeckPage() {
  const { ready, account, update } = useLearning();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<Level>("A1");
  const [color, setColor] = useState<Color>("blue");
  const [symbol, setSymbol] = useState("Aa");
  const [words, setWords] = useState<WordDraft[]>([
    { id: crypto.randomUUID(), term: "", phonetic: "", meaning: "", example: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!ready) {
    return (
      <main id="main" className="container page-main" role="status">
        Đang tải…
      </main>
    );
  }
  if (!account) {
    return (
      <main id="main" className="container page-main">
        <p className="muted">Bạn cần đăng nhập để tạo bộ từ cá nhân.</p>
        <Link className="button primary" href="/login">Đăng nhập</Link>
      </main>
    );
  }

  function addWord() {
    setWords((prev) => [
      ...prev,
      { id: crypto.randomUUID(), term: "", phonetic: "", meaning: "", example: "" },
    ]);
  }
  function removeWord(id: string) {
    setWords((prev) => prev.filter((w) => w.id !== id));
  }
  function updateWord(id: string, patch: Partial<WordDraft>) {
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function moveWord(index: number, delta: number) {
    const next = [...words];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setWords(next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedSymbol = symbol.trim();
    if (!trimmedTitle) { setError("Nhập tên bộ từ."); return; }
    if (!trimmedCategory) { setError("Nhập chủ đề."); return; }
    if (!trimmedSymbol) { setError("Nhập ký hiệu."); return; }
    const validWords = words.filter((w) => w.term.trim() && w.meaning.trim());
    if (validWords.length === 0) { setError("Thêm ít nhất một từ có đủ từ tiếng Anh và nghĩa."); return; }
    setSaving(true);
    setError("");
    // Enrich phonetics for words that are missing them
    const enriched = await Promise.all(
      validWords.map(async (w) => {
        if (w.phonetic.trim()) return w;
        try {
          const result = await lookupPronunciation(w.term);
          return { ...w, phonetic: result.ipa ?? "" };
        } catch {
          return w;
        }
      })
    );
    const deckId = crypto.randomUUID();
    try {
      update((s) => ({
        ...s,
        customDecks: [
          ...s.customDecks,
          {
            id: deckId,
            title: trimmedTitle,
            description: description.trim(),
            category: trimmedCategory,
            level,
            color,
            symbol: trimmedSymbol,
            custom: true,
            words: enriched.map((w) => ({
              id: w.id,
              term: w.term.trim(),
              phonetic: w.phonetic.trim(),
              meaning: w.meaning.trim(),
              example: w.example.trim(),
            })),
          },
        ],
      }));
      router.push(`/decks/${deckId}`);
    } catch {
      setError("Chưa tạo được bộ từ. Thử lại.");
      setSaving(false);
    }
  }

  return (
    <main id="main" className="container page-main">
      <Link className="back-link" href="/decks">
        <Icon name="back" size={17} />Thư viện flashcard
      </Link>
      <div className="page-heading">
        <div>
          <h1>Tạo bộ từ mới</h1>
          <p className="muted">Bộ từ cá nhân chỉ hiển thị với bạn và được lưu vào tài khoản.</p>
        </div>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e); }} className="deck-editor">
        <fieldset disabled={saving} className="deck-editor-fields">
          <label>
            Tên bộ từ
            <input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Từ vựng IELTS Band 7" />
          </label>
          <label>
            Mô tả
            <textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về bộ từ (không bắt buộc)" />
          </label>
          <label>
            Chủ đề
            <input required maxLength={80} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ví dụ: Học thuật" />
          </label>
          <label>
            Trình độ
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>
            Ký hiệu thẻ
            <input maxLength={16} required value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Ví dụ: Aa" />
          </label>
          <label>
            Màu thẻ
            <select value={color} onChange={(e) => setColor(e.target.value as Color)}>
              {COLORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>

          <h2>Từ vựng ({words.length}/100)</h2>
          {words.map((w, i) => (
            <fieldset className="panel" key={w.id}>
              <legend>Từ {i + 1}</legend>
              <PronunciationFields
                value={w}
                onChange={(update) => {
                  setWords((prev) =>
                    prev.map((word) => word.id === w.id ? { ...word, ...update(word) } : word)
                  );
                }}
              />
              <label>
                Nghĩa tiếng Việt
                <input required value={w.meaning} maxLength={1000} placeholder="Ý nghĩa của từ" onChange={(e) => updateWord(w.id, { meaning: e.target.value })} />
              </label>
              <MeaningLookup term={w.term} onSelect={(meaning) => setWords((prev) => prev.map((word) => word.id === w.id ? { ...word, meaning } : word))} />
              <label>
                Câu ví dụ
                <input value={w.example} maxLength={2000} placeholder="Ví dụ dùng từ trong câu (không bắt buộc)" onChange={(e) => updateWord(w.id, { example: e.target.value })} />
              </label>
              <div className="row">
                <button type="button" disabled={i === 0} onClick={() => moveWord(i, -1)}>↑ Lên</button>
                <button type="button" disabled={i === words.length - 1} onClick={() => moveWord(i, 1)}>↓ Xuống</button>
                <button type="button" onClick={() => removeWord(w.id)} disabled={words.length <= 1}>Xóa từ này</button>
              </div>
            </fieldset>
          ))}
          <button type="button" disabled={words.length >= 100} onClick={addWord}>
            <Icon name="plus" size={16} /> Thêm từ
          </button>
        </fieldset>

        <div className="deck-savebar">
          <span className="deck-savebar-count">{words.filter((w) => w.term.trim() && w.meaning.trim()).length} từ hợp lệ</span>
          <button className="button primary" disabled={saving}>
            {saving ? "Đang tạo…" : "Tạo bộ từ"}
          </button>
          <Link className="button secondary" href="/decks">Hủy</Link>
          {error && <p role="alert">{error}</p>}
        </div>
      </form>
    </main>
  );
}
