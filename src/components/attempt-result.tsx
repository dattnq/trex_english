"use client";
import Link from "next/link";
import { ReadingPassage } from "./reading-passage";
import type { Attempt } from "@/lib/learning-data";
import { useState } from "react";
import { useLearning } from "./learning-provider";
import { EmptyState, Icon } from "./ui";
export default function AttemptResult({ id }: { id: string }) {
  const { state, ready } = useLearning(); const result = state.attempts.find(a => a.id === id);
  if (!ready) return <main id="main" className="container page-main" role="status">Đang tải kết quả...</main>;
  if (!result) return <main id="main" className="container page-main"><EmptyState title="Chưa tìm thấy kết quả này" description="Kết quả được lưu trên trình duyệt đã làm bài. Hãy bắt đầu một bài luyện tập mới nhé." href="/tests" action="Khám phá bài test" /></main>;
  return <ResultReview result={result}/>;
}
export function ResultReview({result,server=false}:{result:Attempt;server?:boolean}) {
  const [onlyWrong,setOnlyWrong]=useState(false);
  const percent = Math.round(result.score / result.questions.length * 100);
  return <main id="main" className="container page-main"><Link className="back-link" href={server?"/history":"/dashboard"}><Icon name="back" size={17} />{server?"Bài làm của tôi":"Tiến độ của tôi"}</Link><section className="result-hero"><div className="score-ring" style={{ background: `conic-gradient(var(--teal) ${percent}%, #dceae3 0)` }}><span><strong>{percent}%</strong><small>CHÍNH XÁC</small></span></div><div><p className="eyebrow">LOOK HOW FAR YOU’VE COME</p><h1>{percent >= 80 ? "Bạn làm tốt lắm!" : "Một lần thử, thêm một bước tiến."}</h1><p className="muted">{result.title} · {result.score}/{result.questions.length} câu trả lời đúng</p><p className="result-date">{new Date(result.date).toLocaleString("vi-VN")}</p><div className="row wrap"><Link className="button primary" href={result.title.startsWith("Quiz:") ? "/quiz" : "/tests"}>Tiếp tục thử sức<Icon name="arrow" size={17} /></Link><Link className="button secondary" href="/decks">Ôn lại từ vựng</Link></div></div></section><div className="section-heading"><h2>Học thêm từ từng đáp án</h2><label className="check-label"><input type="checkbox" checked={onlyWrong} onChange={e => setOnlyWrong(e.target.checked)} />Chỉ xem câu chưa đúng</label></div><div className="review-list">{result.questions.map((q, i) => (onlyWrong && result.answers[i] === q.answer) ? null : <article className="panel review-item" key={i}><div className="row"><span className={`review-icon ${result.answers[i] === q.answer ? "correct" : "incorrect"}`}><Icon name={result.answers[i] === q.answer ? "check" : "close"} size={18} /></span><h3>{q.number ?? i + 1}. {q.prompt}</h3></div><p className="muted">Bạn chọn: <strong>{q.options[result.answers[i]] || "Chưa trả lời"}</strong></p>{result.answers[i] !== q.answer && <p className="correct-text">Đáp án đúng: {q.options[q.answer]}</p>}{q.reading && <details><summary>Xem lại bài đọc</summary><ReadingPassage reading={q.reading}/></details>}<div className="review-explanation">{q.explanation}</div></article>)}{onlyWrong && result.score === result.questions.length && <EmptyState title="Tất cả đều chính xác!" description="Bạn đã hoàn thành xuất sắc. Sẵn sàng cho một thử thách mới chứ?" icon="trophy" />}</div></main>;
}
