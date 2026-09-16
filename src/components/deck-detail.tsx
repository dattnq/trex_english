"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLearning } from "./learning-provider";
import PronunciationFields from "./pronunciation-fields";
import PronunciationButton from "./pronunciation-button";
import { lookupPronunciation } from "@/lib/pronunciation-client";
import type { Word } from "@/lib/learning-data";
import { DeckArt, EmptyState, Icon } from "./ui";
export default function DeckDetail({ id }: { id: string }) {
  const { decks, ready, state, update } = useLearning(); const deck = decks.find(d => d.id === id); const [query, setQuery] = useState(""); const [adding, setAdding] = useState(false);
  if (!ready) return <main id="main" className="container page-main" role="status">Đang mở bộ từ...</main>;
  if (!deck) return <main id="main" className="container page-main"><EmptyState title="Không tìm thấy bộ từ" description="Bộ từ này chưa có trên trình duyệt của bạn." href="/decks" action="Về thư viện" /></main>;
  const known = state.known[id] || [];
  const filtered = deck.words.filter(w => `${w.term} ${w.meaning}`.toLowerCase().includes(query.toLowerCase()));
  return <main id="main" className="container page-main"><Link className="back-link" href="/decks"><Icon name="back" size={17} />Thư viện flashcard</Link><section className="deck-detail-hero"><DeckArt deck={deck} large /><div><span className="badge">{deck.level} · {deck.category}</span><h1>{deck.title}</h1><p className="muted">{deck.description}</p><div className="detail-meta"><span><Icon name="cards" size={18} />{deck.words.length} từ vựng</span><span><Icon name="check" size={18} />{known.length} từ đã nhớ</span></div><progress value={known.length} max={Math.max(deck.words.length, 1)} aria-label="Tiến độ bộ từ" /><div className="row wrap">{deck.words.length > 0 && <><Link className="button primary" href={`/decks/${id}/study`}>Học flashcard<Icon name="cards" size={18} /></Link><Link className="button secondary" href={`/quiz/${id}`}>Làm quiz<Icon name="quiz" size={18} /></Link></>}{deck.custom && <button className="button secondary" onClick={() => setAdding(!adding)} aria-expanded={adding}><Icon name="plus" size={18} />Thêm từ mới</button>}</div></div></section>{adding && <AddWordForm onCancel={()=>setAdding(false)} onSave={word=>{update(current=>({...current,customDecks:current.customDecks.map(d=>d.id===id?{...d,words:[...d.words,{id:crypto.randomUUID(),...word}]}:d)}));setAdding(false);}}/>}<div className="section-heading"><h2>Khám phá từng từ <span className="count-label">{deck.words.length}</span></h2><label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm từ vựng..." aria-label="Tìm từ vựng" /></label></div>{filtered.length ? <div className="word-list">{filtered.map((word, i) => <div className="word-row" key={word.id}><span className="word-index">{String(i + 1).padStart(2, "0")}</span><div><h3>{word.term}</h3><span className="phonetic">{word.phonetic}</span><PronunciationButton term={word.term}/></div><div><strong>{word.meaning}</strong><p className="muted">{word.example}</p></div><span className={`badge ${known.includes(word.id) ? "mint" : ""}`}>{known.includes(word.id) ? "Đã nhớ" : "Chưa học"}</span></div>)}</div> : <EmptyState title={deck.words.length ? "Chưa tìm thấy từ này" : "Một trang mới đang chờ bạn"} description={deck.words.length ? "Thử một từ tiếng Anh hoặc nghĩa tiếng Việt khác." : "Chọn Thêm từ mới để bắt đầu xây dựng bộ từ của riêng mình."} />}</main>;
}

function AddWordForm({onSave,onCancel}:{onSave:(word:Omit<Word,"id">)=>void;onCancel:()=>void}){
 const [value,setValue]=useState({term:"",phonetic:""}),[saving,setSaving]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(saving)return;const data=new FormData(event.currentTarget),term=value.term.trim(),meaning=String(data.get("meaning")??"").trim();if(!term||!meaning)return;
  setSaving(true);let phonetic=value.phonetic.trim();
  if(!phonetic){try{phonetic=(await lookupPronunciation(term)).ipa;}catch{/* IPA is optional; keep the word if the dictionary is unavailable. */}}
  onSave({term,phonetic,meaning,example:String(data.get("example")??"").trim()});
 }

 return <form className="panel add-word-form" onSubmit={submit}><h2>Thêm một từ, mở một cánh cửa.</h2><fieldset disabled={saving} className="add-word-fields"><div className="form-grid"><PronunciationFields value={value} onChange={setValue}/><label>Nghĩa tiếng Việt<input name="meaning" required maxLength={160} placeholder="truyền cảm hứng"/></label><label>Câu ví dụ (không bắt buộc)<input name="example" maxLength={250} placeholder="Small steps inspire big changes."/></label></div><div className="row"><button className="button primary" disabled={saving}>{saving?"Đang lưu…":"Lưu từ mới"}</button><button className="button secondary" type="button" onClick={onCancel}>Hủy</button></div></fieldset></form>;
}
