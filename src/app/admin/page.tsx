"use client";
import Link from "next/link";
import { useLearning } from "@/components/learning-provider";
import { CreateDeckButton } from "@/components/deck-library";
import { Icon, PageHeading } from "@/components/ui";
export default function Admin() { const { decks } = useLearning(); return <main id="main" className="container page-main"><PageHeading title="Quản lý bộ từ" description="Bản xem trước · Bộ từ cá nhân lưu trên trình duyệt."><CreateDeckButton /></PageHeading><div className="panel"><div className="section-heading"><h2>Thư viện nội dung</h2><span className="badge">{decks.length} bộ từ</span></div>{decks.map(d => <Link className="admin-row" href={`/decks/${d.id}`} key={d.id}><span className={`quick-icon ${d.color}`}>{d.symbol}</span><div><h3>{d.title}</h3><p className="muted">{d.words.length} từ · {d.custom ? "Nội dung cá nhân" : "Bộ từ có sẵn"}</p></div><span className="text-link">{d.custom ? "Thêm từ" : "Xem bộ từ"}<Icon name="arrow" size={18} /></span></Link>)}</div></main>; }
