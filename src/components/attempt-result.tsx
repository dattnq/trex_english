"use client";

import Link from "next/link";
import { ReadingPassage } from "./reading-passage";
import type { Attempt, Question } from "@/lib/learning-data";
import { useMemo, useState } from "react";
import { useLearning } from "./learning-provider";
import { EmptyState, Icon } from "./ui";

export default function AttemptResult({ id }: { id: string }) {
  const { state, ready } = useLearning();
  const result = state.attempts.find((attempt) => attempt.id === id);
  if (!ready) return <main id="main" className="container page-main" role="status">Đang tải kết quả...</main>;
  if (!result) return <main id="main" className="container page-main"><EmptyState title="Chưa tìm thấy kết quả này" description="Kết quả được lưu trên trình duyệt đã làm bài. Hãy bắt đầu một bài luyện tập mới nhé." href="/tests" action="Khám phá bài test" /></main>;
  return <ResultReview result={result} />;
}

export function ResultReview({ result, server = false }: { result: Attempt; server?: boolean }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const { decks, state } = useLearning();
  const percent = result.questions.length ? Math.round(result.score / result.questions.length * 100) : 0;
  const wrongQuestions = result.questions.flatMap((question, index) => result.answers[index] === question.answer ? [] : [{ question, number: index + 1 }]);
  const relatedDeck = useMemo(() => {
    const text = wrongQuestions.map(({ question }) => `${question.prompt} ${question.options[question.answer]}`).join(" ").toLocaleLowerCase();
    return decks.map((deck) => ({ deck, matches: deck.words.reduce((count, word) => count + Number(text.includes(word.term.toLocaleLowerCase()) || text.includes(word.meaning.toLocaleLowerCase())), 0) }))
      .filter(({ deck }) => deck.words.length > 0)
      .sort((a, b) => b.matches - a.matches)[0];
  }, [decks, result]);
  const practiceTarget = result.title.startsWith("Quiz:") ? "/quiz" : "/tests";
  const practiceLabel = result.title.startsWith("Quiz:") ? "Làm quiz khác" : "Chọn bài kiểm tra khác";

  return <main id="main" className="container page-main">
    <Link className="back-link" href={server ? "/history" : "/dashboard"}><Icon name="back" size={17} />{server ? "Bài làm của tôi" : "Tiến độ của tôi"}</Link>
    <section className="result-hero">
      <div className="score-ring" style={{ background: `conic-gradient(var(--teal) ${percent}%, #dceae3 0)` }}><span><strong>{percent}%</strong><small>CHÍNH XÁC</small></span></div>
      <div><p className="eyebrow">LOOK HOW FAR YOU’VE COME</p><h1>{percent >= 80 ? "Bạn làm tốt lắm!" : "Một lần thử, thêm một bước tiến."}</h1><p className="muted">{result.title} · {result.score}/{result.questions.length} câu trả lời đúng</p><p className="result-date">{new Date(result.date).toLocaleString("vi-VN")}</p>
        <div className="row wrap"><Link className="button primary" href={practiceTarget}>{practiceLabel}<Icon name="arrow" size={17} /></Link><Link className="button secondary" href="/decks">Ôn lại từ vựng</Link></div>
      </div>
    </section>

    {wrongQuestions.length > 0 && <section className="dashboard-section result-next-steps">
      <div className="section-heading"><div><h2>Bước tiếp theo</h2><p className="muted">Ôn {wrongQuestions.length} câu chưa đúng, rồi tiếp tục với nội dung liên quan.</p></div></div>
      {!practiceStarted ? <button className="button primary" onClick={() => setPracticeStarted(true)}>Luyện lại {wrongQuestions.length} câu sai<Icon name="arrow" size={17} /></button> : <WrongAnswerPractice items={wrongQuestions} />}
      <div className="result-recommendations">
        {relatedDeck && <Link className="panel result-recommendation" href={`/decks/${relatedDeck.deck.id}/study`}>
          <span className={`quick-icon ${relatedDeck.deck.color}`}>{relatedDeck.deck.symbol}</span><span><strong>{relatedDeck.matches ? "Ôn bộ từ liên quan" : "Tiếp tục học từ vựng"}</strong><small>{relatedDeck.deck.title}{relatedDeck.matches ? ` · ${relatedDeck.matches} từ khớp với bài làm` : ` · ${state.known[relatedDeck.deck.id]?.length || 0}/${relatedDeck.deck.words.length} từ đã nhớ`}</small></span><Icon name="arrow" size={18} />
        </Link>}
        <Link className="panel result-recommendation" href={practiceTarget}><span className="quick-icon blue"><Icon name="test" size={20} /></span><span><strong>{practiceLabel}</strong><small>{result.title.startsWith("Quiz:") ? "Luyện thêm với một bộ từ khác" : "Áp dụng phần vừa học vào bài khác"}</small></span><Icon name="arrow" size={18} /></Link>
      </div>
    </section>}
    {wrongQuestions.length === 0 && <div className="panel result-perfect"><Icon name="trophy" size={21} />Bạn đã trả lời đúng tất cả câu hỏi. Hãy thử một bài mới hoặc học thêm bộ từ khác.</div>}

    <div className="section-heading"><h2>Học thêm từ từng đáp án</h2><label className="check-label"><input type="checkbox" checked={onlyWrong} onChange={(event) => setOnlyWrong(event.target.checked)} />Chỉ xem câu chưa đúng</label></div>
    <div className="review-list">{result.questions.map((question, index) => (onlyWrong && result.answers[index] === question.answer) ? null : <article className="panel review-item" key={index}>
      <div className="row"><span className={`review-icon ${result.answers[index] === question.answer ? "correct" : "incorrect"}`}><Icon name={result.answers[index] === question.answer ? "check" : "close"} size={18} /></span><h3>{question.number ?? index + 1}. {question.prompt}</h3></div>
      <p className="muted">Bạn chọn: <strong>{question.options[result.answers[index]] || "Chưa trả lời"}</strong></p>
      {result.answers[index] !== question.answer && <p className="correct-text">Đáp án đúng: {question.options[question.answer]}</p>}
      {question.reading && <details><summary>Xem lại bài đọc</summary><ReadingPassage reading={question.reading} /></details>}
      <div className="review-explanation">{question.explanation || "Hãy ghi nhớ đáp án đúng và thử áp dụng vào câu tiếp theo."}</div>
    </article>)}{onlyWrong && result.score === result.questions.length && <EmptyState title="Tất cả đều chính xác!" description="Bạn đã hoàn thành xuất sắc. Sẵn sàng cho một thử thách mới chứ?" icon="trophy" />}</div>
  </main>;
}

function WrongAnswerPractice({ items }: { items: { question: Question; number: number }[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  if (complete) return <div className="panel wrong-practice-done"><span className="quick-icon mint"><Icon name="check" size={22} /></span><div><strong>Đã ôn xong {items.length} câu</strong><p className="muted">Bạn có thể xem lại phần giải thích bên dưới hoặc làm một bài khác.</p></div><button className="button secondary" onClick={() => { setIndex(0); setSelected(null); setComplete(false); }}>Ôn lại lượt nữa</button></div>;
  const item = items[index];
  const correct = selected === item.question.answer;
  return <div className="panel wrong-practice">
    <div className="wrong-practice-heading"><strong>Câu {index + 1}/{items.length}</strong><span>Trong bài gốc: câu {item.number}</span></div>
    {item.question.reading && <details className="wrong-practice-reading"><summary>Xem lại bài đọc</summary><ReadingPassage reading={item.question.reading} /></details>}
    <h3>{item.question.prompt}</h3>
    <div className="wrong-practice-options">{item.question.options.map((option, optionIndex) => <button type="button" key={`${option}-${optionIndex}`} disabled={selected !== null} className={selected === optionIndex ? (correct ? "is-correct" : "is-wrong") : selected !== null && optionIndex === item.question.answer ? "is-correct" : ""} onClick={() => setSelected(optionIndex)}>{option}</button>)}</div>
    {selected !== null && <div className={`wrong-practice-feedback ${correct ? "correct-text" : ""}`}><strong>{correct ? "Chính xác!" : `Đáp án đúng: ${item.question.options[item.question.answer]}`}</strong><p>{item.question.explanation || "Hãy ghi nhớ đáp án đúng và thử áp dụng vào câu tiếp theo."}</p><button type="button" className="button primary" onClick={() => { if (index + 1 === items.length) setComplete(true); else { setIndex(index + 1); setSelected(null); } }}>{index + 1 === items.length ? "Hoàn thành ôn tập" : "Câu tiếp theo"}<Icon name="arrow" size={17} /></button></div>}
  </div>;
}
