"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dayKey, useLearning } from "./learning-provider";
import { EmptyState, Icon, PageHeading, SectionHeading } from "./ui";

export default function Dashboard() {
  const { state, update, decks, ready, account, attemptCount } = useLearning();
  const [saved, setSaved] = useState(false);
  const learned = Object.values(state.known).reduce((count, ids) => count + ids.length, 0);
  const today = state.activity[dayKey()]?.length || 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = dayKey(date);
    return { key, label: date.toLocaleDateString("vi-VN", { weekday: "short" }), count: state.activity[key]?.length || 0 };
  });
  const weekTotal = days.reduce((sum, day) => sum + day.count, 0);
  const streak = useMemo(() => {
    const active = new Set(Object.keys(state.activity));
    const date = new Date();
    if (!active.has(dayKey(date))) date.setDate(date.getDate() - 1);
    let count = 0;
    while (active.has(dayKey(date))) { count++; date.setDate(date.getDate() - 1); }
    return count;
  }, [state.activity]);
  const recentAttempts = state.attempts.slice(0, 10);
  const recentQuestions = recentAttempts.reduce((sum, attempt) => sum + attempt.questions.length, 0);
  const recentCorrect = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const average = recentQuestions ? Math.round(recentCorrect / recentQuestions * 100) : 0;
  const nextDeck = decks
    .filter((deck) => deck.words.length > 0 && (state.known[deck.id]?.length || 0) < deck.words.length)
    .sort((a, b) => {
      const aProgress = (state.known[a.id]?.length || 0) / a.words.length;
      const bProgress = (state.known[b.id]?.length || 0) / b.words.length;
      const aTouched = Object.values(state.activity).some((items) => items.some((item) => item.startsWith(`${a.id}:`)));
      const bTouched = Object.values(state.activity).some((items) => items.some((item) => item.startsWith(`${b.id}:`)));
      return Number(bTouched) - Number(aTouched) || aProgress - bProgress;
    })[0];
  const needsReview = state.attempts.find((attempt) => attempt.score < attempt.questions.length);

  if (!ready) return <main id="main" className="container page-main" role="status">Đang tải tiến độ học tập…</main>;

  return <main id="main" className="container page-main">
    <PageHeading title="Tiến độ học tập">
      <Link className="button secondary" href="/history">Bài làm trên tài khoản</Link>
      <Link className="button primary" href={nextDeck ? `/decks/${nextDeck.id}/study` : "/decks"}>Tiếp tục học<Icon name="arrow" size={18} /></Link>
    </PageHeading>

    <div className="stats-grid">
      {[
        { title: "Từ vựng đã nhớ", value: learned, icon: "book", color: "mint", note: "Qua những lần học flashcard" },
        { title: account ? "Bài đã hoàn thành" : "Bài học thử đã làm", value: attemptCount, icon: "test", color: "blue", note: "Quiz và bài kiểm tra" },
        { title: "Độ chính xác gần đây", value: `${average}%`, icon: "target", color: "peach", note: recentQuestions ? `Trên ${recentAttempts.length} bài gần nhất` : "Bắt đầu bài đầu tiên của bạn" },
        { title: "Chuỗi ngày học", value: `${streak} ngày`, icon: "fire", color: "lilac", note: "Học hôm nay để giữ nhịp" },
      ].map((stat) => <div className="panel stat-card" key={stat.title}>
        <span className={`quick-icon ${stat.color}`}><Icon name={stat.icon} size={22} /></span>
        <span>{stat.title}</span><strong>{stat.value}</strong><small>{stat.note}</small>
      </div>)}
    </div>

    <div className="dashboard-grid">
      <section className="panel activity-panel">
        <SectionHeading title="Nhịp học của bạn" subtitle={`Số từ đã ôn trong 7 ngày · ${weekTotal} lượt ôn`} />
        <div className="activity-chart">{days.map((day) => <div className="chart-column" key={day.key}>
          <span>{day.count}</span><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(2, day.count / Math.max(state.goal, ...days.map((item) => item.count)) * 100)}%` }} /></div><small>{day.label}</small>
        </div>)}</div>
      </section>
      <section className="panel goal-panel">
        <span className="quick-icon mint"><Icon name="target" size={28} /></span>
        <h2>Mục tiêu hôm nay</h2>
        <strong className="goal-number">{today}<span> / {state.goal} từ</span></strong>
        <progress value={Math.min(today, state.goal)} max={state.goal} aria-label="Tiến độ mục tiêu hằng ngày" />
        <p className="muted">{today >= state.goal ? "Bạn đã hoàn thành mục tiêu hôm nay. Tuyệt lắm!" : `Còn ${state.goal - today} từ nữa. Bạn làm được mà!`}</p>
        <label className="goal-select">Mục tiêu mỗi ngày<select value={state.goal} onChange={(event) => { update((current) => ({ ...current, goal: Number(event.target.value) })); setSaved(true); }}>{[5, 10, 15, 20, 30].map((value) => <option value={value} key={value}>{value} từ mỗi ngày</option>)}</select></label>
        {saved && <small className="correct-text" role="status">Đã cập nhật mục tiêu.</small>}
      </section>
    </div>

    <section className="dashboard-section">
      <SectionHeading title="Gợi ý học tiếp" subtitle="Dựa trên tiến độ flashcard của bạn" />
      {nextDeck ? <Link className="panel dashboard-next" href={`/decks/${nextDeck.id}/study`}>
        <span className={`quick-icon ${nextDeck.color}`}>{nextDeck.symbol}</span>
        <span className="dashboard-next-copy"><strong>{nextDeck.title}</strong><small>{state.known[nextDeck.id]?.length || 0}/{nextDeck.words.length} từ đã nhớ · còn {nextDeck.words.length - (state.known[nextDeck.id]?.length || 0)} từ để hoàn thành</small></span>
        <span className="button primary">Học bộ này<Icon name="arrow" size={18} /></span>
      </Link> : <EmptyState title="Bạn đã học hết các bộ từ hiện có" description="Khám phá thêm nội dung trong thư viện để tiếp tục tiến bộ." href="/decks" action="Khám phá thư viện" />}
      {needsReview && <p className="dashboard-review-tip"><Icon name="target" size={17} /> Có câu trả lời cần xem lại trong <Link href={`/attempts/${needsReview.id}`}>{needsReview.title}</Link>.</p>}
    </section>

    <section className="dashboard-section">
      <SectionHeading title={account ? "Kết quả gần đây (tối đa 200 bài)" : "Lịch sử học thử trên trình duyệt"} />
      {state.attempts.length ? <div className="results-table">
        <div className="results-table-head"><span>BÀI LUYỆN TẬP</span><span>NGÀY HOÀN THÀNH</span><span>KẾT QUẢ</span><span /></div>
        {state.attempts.map((attempt) => <Link className="results-table-row" href={`/attempts/${attempt.id}`} key={attempt.id}>
          <span><Icon name={attempt.title.startsWith("Quiz:") ? "quiz" : "test"} size={20} /><strong>{attempt.title}</strong></span>
          <span>{new Date(attempt.date).toLocaleDateString("vi-VN")}</span>
          <span className="score-badge">{attempt.score}/{attempt.questions.length} · {Math.round(attempt.score / attempt.questions.length * 100)}%</span>
          <Icon name="arrow" size={18} />
        </Link>)}
      </div> : <EmptyState title="Bước tiến đầu tiên đang chờ bạn" description="Kết quả quiz cá nhân lưu tại đây. Bài quiz/test trên tài khoản nằm trong mục Bài làm của tôi." href="/history" action="Mở bài làm trên tài khoản" icon="chart" />}
    </section>

    <section className="dashboard-section">
      <SectionHeading title="Bộ từ đang học" href="/decks" action="Đến thư viện" />
      <div className="progress-decks">{decks.filter((deck) => (state.activity && Object.values(state.activity).some((items) => items.some((item) => item.startsWith(`${deck.id}:`))))).map((deck) => {
        const known = state.known[deck.id]?.length || 0;
        const reviewed = new Set(Object.values(state.activity).flat().filter((item) => item.startsWith(`${deck.id}:`))).size;
        return <Link className="panel progress-deck" href={`/decks/${deck.id}/study`} key={deck.id}>
          <span className={`quick-icon ${deck.color}`}>{deck.symbol}</span><div><h3>{deck.title}</h3><progress value={known} max={deck.words.length} aria-label={`Tiến độ ${deck.title}`} /><span className="muted">{known}/{deck.words.length} đã nhớ · {reviewed} từ từng ôn</span></div><Icon name="arrow" size={18} />
        </Link>;
      })}</div>
      {!Object.keys(state.activity).length && <p className="muted">Học bộ flashcard đầu tiên để bắt đầu ghi nhận tiến độ.</p>}
    </section>
    <p className="page-note"><Icon name="check" size={17} />{account ? "Tiến độ flashcard được đồng bộ theo tài khoản. Độ chính xác tính trên 10 bài gần nhất." : "Dữ liệu học thử được lưu trên trình duyệt này."}</p>
  </main>;
}
