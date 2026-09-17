import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Deck } from "@/lib/learning-data";

const paths: Record<string, ReactNode> = {
  settings: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
  cards: <><rect x="7" y="3" width="14" height="17" rx="3" /><path d="M3 7v12a4 4 0 0 0 4 4M11 8h6M11 12h4" /></>,
  test: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" /></>,
  quiz: <><path d="m13 2-9 12h7l-1 8 10-13h-7z" /></>,
  chart: <><path d="M3 3v18h18M7 16v-5M12 16V7M17 16v-8" /></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  up: <><path d="M6 18 18 6M6 6h12v12" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  trophy: <><path d="M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8" /></>,
  book: <><path d="M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z" /></>,
  volume: <><path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  fire: <path d="M12 2c2 5 7 7 7 13a7 7 0 0 1-14 0c0-3 1-5 3-7 0 4 2 4 2 4s3-4 2-10Z" />,
  shuffle: <><path d="m17 3 4 4-4 4M3 17l5-5m-5-5h4l10 10h4m-4-4 4 4-4 4M14 7h7" /></>,
};
export function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name] || paths.book}</svg>; }
export function Brand() { return <Link href="/" className="brand" aria-label="T-Rex Edu — Trang chủ"><Image src="/trex-logo.png" width={46} height={46} alt="" priority /><span>T-REX <b>EDU</b></span></Link>; }
export function PageHeading({ title, description, children }: { title: string; description?: string; children?: ReactNode }) { return <div className="page-heading"><div><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{children}</div>; }
export function SectionHeading({ title, subtitle, href, action = "Xem tất cả" }: { title: string; subtitle?: string; href?: string; action?: string }) { return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div>{href && <Link className="text-link" href={href}>{action}<Icon name="arrow" size={17} /></Link>}</div>; }
export function DeckArt({ deck, large = false }: { deck: Deck; large?: boolean }) { return <div className={`deck-art ${deck.color} ${large ? "large" : ""}`}><span className="art-orbit" /><span className="art-letter">{deck.symbol}</span><span className="art-star">✳</span><span className="art-caption">{deck.category} <span>↗</span></span></div>; }
export function DeckCard({ deck, known = 0, saved = false, onSave }: { deck: Deck; known?: number; saved?: boolean; onSave?: () => void }) { return <article className="deck-card"><Link href={`/decks/${deck.id}`} aria-label={`Mở bộ từ ${deck.title}`}><DeckArt deck={deck} /></Link><div className="deck-body"><div className="row between"><span className="badge">{deck.level} · {deck.level === "A1" ? "Cơ bản" : "Sơ cấp"}</span>{onSave && <button className={`icon-button bookmark ${saved ? "selected" : ""}`} onClick={onSave} aria-pressed={saved} aria-label={`${saved ? "Bỏ lưu" : "Lưu"} ${deck.title}`}><Icon name="bookmark" size={18} /></button>}</div><h3><Link href={`/decks/${deck.id}`}>{deck.title}</Link></h3><div className="deck-meta"><span><Icon name="cards" size={15} />{deck.words.length} từ vựng</span>{known > 0 && <span>{known} đã nhớ</span>}</div><Link className="deck-link" href={`/decks/${deck.id}/study`}>{known > 0 ? "Tiếp tục học" : "Bắt đầu học"}<Icon name="arrow" size={18} /></Link></div></article>; }
export function EmptyState({ title, description, href, action, icon = "book" }: { title: string; description: string; href?: string; action?: string; icon?: string }) { return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={30} /></span><h3>{title}</h3><p className="muted">{description}</p>{href && <Link className="button primary" href={href}>{action}<Icon name="arrow" size={17} /></Link>}</div>; }
