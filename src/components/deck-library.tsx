"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "@/components/navigation-link";
import PronunciationLookup from "./pronunciation-lookup";
import { useRouter } from "next/navigation";
import { useLearning } from "./learning-provider";
import { DeckCard, EmptyState, Icon, PageHeading } from "./ui";
import type { Deck } from "@/lib/learning-data";

export function CreateDeckButton() {
  const dialog = useRef<HTMLDialogElement>(null); const { update, ready } = useLearning(); const router = useRouter();
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim(); if (!title) return;
    const deck: Deck = { id: crypto.randomUUID(), title, description: String(data.get("description")).trim() || "Bộ từ dành riêng cho hành trình của bạn.", category: "Cá nhân", level: "A1", color: String(data.get("color")), symbol: title.slice(0, 2), words: [], custom: true };
    update(s => ({ ...s, customDecks: [...s.customDecks, deck] })); dialog.current?.close(); router.push(`/decks/${deck.id}`);
  }
  return <><button className="button primary" disabled={!ready} onClick={() => dialog.current?.showModal()}><Icon name="plus" size={18} />Tạo bộ từ mới</button><dialog ref={dialog} className="modal"><div className="row between"><span /><button className="icon-button" onClick={() => dialog.current?.close()} aria-label="Đóng"><Icon name="close" /></button></div><h2>Tạo bộ từ mới</h2><form onSubmit={create} className="form-stack"><label>Tên bộ từ<input name="title" placeholder="Ví dụ: Tiếng Anh trong công việc" required maxLength={60} autoFocus /></label><label>Mô tả<textarea name="description" placeholder="Bạn muốn học gì với bộ từ này?" maxLength={180} rows={3} /></label><label>Màu bìa<select name="color"><option value="blue">Xanh da trời</option><option value="peach">Cam đào</option><option value="green">Xanh lá</option><option value="lilac">Tím nhạt</option></select></label><button className="button primary" type="submit">Tạo bộ từ<Icon name="arrow" size={17} /></button></form></dialog></>;
}
export default function DeckLibrary({ quiz = false }: { quiz?: boolean }) {
  const { decks, state, update } = useLearning(); const [query, setQuery] = useState(""); const [tab, setTab] = useState("Tất cả"); const [level, setLevel] = useState("all");
  const filtered = decks.filter(d => (!quiz || d.words.length > 0) && `${d.title} ${d.description} ${d.category}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")) && (level === "all" || level === d.level) && (tab === "Tất cả" || (tab === "Đã lưu" ? state.saved.includes(d.id) : tab === "Của tôi" ? d.custom : d.category === tab)));
  return <main id="main" className="container page-main"><PageHeading title={quiz ? "Quiz từ vựng" : "Thư viện flashcard"}>{!quiz && <CreateDeckButton />}</PageHeading>{!quiz&&<PronunciationLookup/>}<div className="filter-bar"><div className="tabs" aria-label="Lọc bộ từ">{["Tất cả", "Giao tiếp", "Đời sống", "Du lịch", "Của tôi", "Đã lưu"].map(t => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} aria-pressed={tab === t} key={t}>{t}</button>)}</div><div className="filter-controls"><label className="search-field"><Icon name="search" size={18} /><input aria-label="Tìm bộ từ" placeholder="Tìm một chủ đề..." value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Trình độ" value={level} onChange={e => setLevel(e.target.value)}><option value="all">Mọi trình độ</option><option value="A1">A1 · Cơ bản</option><option value="A2">A2 · Sơ cấp</option>{["B1","B2","C1","C2"].map(l=><option key={l} value={l}>{l}</option>)}</select></div></div><p className="result-count">{filtered.length} bộ từ {tab !== "Tất cả" && `· ${tab}`}</p>{filtered.length ? <div className="deck-grid">{filtered.map(deck => quiz ? <article className={`quiz-deck ${deck.color}`} key={deck.id}><span className="quiz-deck-symbol">{deck.symbol}</span><span className="badge">{deck.level} · {deck.words.length} câu hỏi</span><h2>{deck.title}</h2><Link className="button white" href={`/quiz/${deck.id}`}>Bắt đầu quiz<Icon name="quiz" size={18} /></Link></article> : <DeckCard deck={deck} key={deck.id} known={state.known[deck.id]?.length} saved={state.saved.includes(deck.id)} onSave={() => update(s => ({ ...s, saved: s.saved.includes(deck.id) ? s.saved.filter(id => id !== deck.id) : [...s.saved, deck.id] }))} />)}</div> : <EmptyState title="Chưa tìm thấy bộ từ phù hợp" description="Thử một từ khóa khác hoặc chọn mục Tất cả để khám phá thêm." />}</main>;
}
