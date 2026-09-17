"use client";
import { useRouter } from "next/navigation";
import { use, useState, type FormEvent } from "react";
import { useLearning } from "@/components/learning-provider";
import { MeaningLookup } from "@/components/meaning-suggestion";
import PronunciationFields from "@/components/pronunciation-fields";
import { lookupPronunciation } from "@/lib/pronunciation-client";
import { Icon, EmptyState } from "@/components/ui";
import Link from "next/link";
import type { Deck } from "@/lib/learning-data";

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

// Outer page: resolves async params, waits for LearningProvider
export default function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, account, decks } = useLearning();

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
        <p className="muted">Bạn cần đăng nhập để sửa bộ từ.</p>
        <Link className="button primary" href="/login">Đăng nhập</Link>
      </main>
    );
  }

  const deck = decks.find((d) => d.id === id);
  if (!deck) {
    return (
      <main id="main" className="container page-main">
        <EmptyState
          title="Không tìm thấy bộ từ"
          description="Bộ từ này không tồn tại hoặc không thuộc về bạn."
          href="/decks"
          action="Về thư viện"
        />
      </main>
    );
  }
  if (!deck.custom) {
    return (
      <main id="main" className="container page-main">
        <EmptyState
          title="Không thể sửa bộ từ này"
          description="Chỉ bộ từ cá nhân mới có thể sửa tại đây. Bộ từ công khai do admin quản lý."
          href={`/decks/${id}`}
          action="Quay lại bộ từ"
        />
      </main>
    );
  }

  // Deck found and is custom — render form with stable initial values
  return <EditDeckForm deck={deck} />;
}

// Inner form: receives deck as prop so useState initialises without effect
function EditDeckForm({ deck }: { deck: Deck }) {
  const { update } = useLearning();
  const router = useRouter();
  const id = deck.id;

  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [category, setCategory] = useState(deck.category);
  const [level, setLevel] = useState<Level>(deck.level as Level);
  const [color, setColor] = useState<Color>(deck.color as Color);
  const [symbol, setSymbol] = useState(deck.symbol);
  const [words, setWords] = useState<WordDraft[]>(
    deck.words.map((w) => ({
      id: w.id,
      term: w.term,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example: w.example,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function addWord() {
    setWords((prev) => [
      ...prev,
      { id: crypto.randomUUID(), term: "", phonetic: "", meaning: "", example: "" },
    ]);
  }
  function removeWord(wordId: string) {
    setWords((prev) => prev.filter((w) => w.id !== wordId));
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
    setSaving(true);
    setError("");
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
    try {
      update((s) => ({
        ...s,
        customDecks: s.customDecks.map((d) =>
          d.id !== id ? d : {
            ...d,
            title: trimmedTitle,
            description: description.trim(),
            category: trimmedCategory,
            level,
            color,
            symbol: trimmedSymbol,
            words: enriched.map((w) => ({
              id: w.id,
              term: w.term.trim(),
              phonetic: w.phonetic.trim(),
              meaning: w.meaning.trim(),
              example: w.example.trim(),
            })),
          }
        ),
      }));
      router.push(`/decks/${id}`);
    } catch {
      setError("Chưa lưu được. Thử lại.");
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!window.confirm("Xóa bộ từ này và toàn bộ tiến độ liên quan? Thao tác không thể hoàn tác.")) return;
    setDeleting(true);
    try {
      update((s) => ({
        ...s,
        customDecks: s.customDecks.filter((d) => d.id !== id),
        saved: s.saved.filter((sid) => sid !== id),
        known: Object.fromEntries(
          Object.entries(s.known).filter(([deckId]) => deckId !== id)
        ),
        activity: Object.fromEntries(
          Object.entries(s.activity).map(([day, entries]) => [
            day,
            entries.filter((entry) => !entry.startsWith(`${id}:`)),
          ])
        ),
      }));
      router.push("/decks");
    } catch {
      setError("Chưa xóa được. Thử lại.");
      setDeleting(false);
    }
  }

  return (
    <main id="main" className="container page-main">
      <Link className="back-link" href={`/decks/${id}`}>
        <Icon name="back" size={17} />Quay lại bộ từ
      </Link>
      <div className="page-heading">
        <div>
          <h1>Sửa bộ từ</h1>
          <p className="muted">Thay đổi sẽ được lưu vào tài khoản của bạn.</p>
        </div>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e); }} className="deck-editor">
        <fieldset disabled={saving || deleting} className="deck-editor-fields">
          <label>
            Tên bộ từ
            <input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Mô tả
            <textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            Chủ đề
            <input required maxLength={80} value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label>
            Trình độ
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>
            Ký hiệu thẻ
            <input maxLength={16} required value={symbol} onChange={(e) => setSymbol(e.target.value)} />
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
                onChange={(upd) => {
                  setWords((prev) =>
                    prev.map((word) => word.id === w.id ? { ...word, ...upd(word) } : word)
                  );
                }}
              />
              <label>
                Nghĩa tiếng Việt
                <input
                  required
                  value={w.meaning}
                  maxLength={1000}
                  onChange={(e) =>
                    setWords((prev) => prev.map((word) => word.id === w.id ? { ...word, meaning: e.target.value } : word))
                  }
                />
              </label>
              <MeaningLookup term={w.term} onSelect={(meaning) => setWords((prev) => prev.map((word) => word.id === w.id ? { ...word, meaning } : word))} />
              <label>
                Câu ví dụ
                <input
                  value={w.example}
                  maxLength={2000}
                  onChange={(e) =>
                    setWords((prev) => prev.map((word) => word.id === w.id ? { ...word, example: e.target.value } : word))
                  }
                />
              </label>
              <div className="row">
                <button type="button" disabled={i === 0} onClick={() => moveWord(i, -1)}>↑ Lên</button>
                <button type="button" disabled={i === words.length - 1} onClick={() => moveWord(i, 1)}>↓ Xuống</button>
                <button type="button" onClick={() => removeWord(w.id)}>Xóa từ này</button>
              </div>
            </fieldset>
          ))}
          <button type="button" disabled={words.length >= 100} onClick={addWord}>
            <Icon name="plus" size={16} /> Thêm từ
          </button>
        </fieldset>

        <div className="deck-savebar">
          <span className="deck-savebar-count">{words.filter((w) => w.term.trim() && w.meaning.trim()).length} từ hợp lệ</span>
          <button className="button primary" disabled={saving || deleting}>
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={saving || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Đang xóa…" : "Xóa bộ từ"}
          </button>
          <Link className="button secondary" href={`/decks/${id}`}>Hủy</Link>
          {error && <p role="alert">{error}</p>}
        </div>
      </form>
    </main>
  );
}
