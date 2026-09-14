"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLearning, dayKey } from "@/components/learning-provider";
import { DeckArt, DeckCard, Icon, SectionHeading } from "@/components/ui";

export default function Home() {
  const { state, decks, update } = useLearning();
  const [showMeaning, setShowMeaning] = useState(false);
  const learned = Object.values(state.known).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
  const today = state.activity[dayKey()]?.length || 0;
  const current =
    decks.find(
      (d) =>
        (state.known[d.id]?.length || 0) > 0 &&
        (state.known[d.id]?.length || 0) < d.words.length,
    ) || decks[0];
  const count = state.known[current.id]?.length || 0;
  return (
    <main id="main" className="home-main">
      <div className="container">
        <section className="welcome">
          <div className="greeting">
            <div className="greeting-avatar">
              <Image
                src="/trex-avatar.png"
                alt="Linh vật T-Rex"
                width={64}
                height={64}
                priority
              />
              <span>✦</span>
            </div>
            <div>
              <h1>
                Chào {state.name || "bạn"}, cùng học nhé{" "}
                <span className="wave">✳</span>
              </h1>
            </div>
          </div>
          <Link href="/dashboard" className="daily-goal">
            <span className="goal-icon">
              <Icon name="target" size={27} />
            </span>
            <div>
              <small>MỤC TIÊU HÔM NAY</small>
              <strong>
                {today} / {state.goal} <span>từ vựng</span>
              </strong>
            </div>
            <Icon name="chevron" size={16} />
          </Link>
        </section>
        <section className="hero">
          <div className="hero-copy">
            <h2>
              Học từng chút.
              <br />
              Nhớ <span>thật lâu.</span>
              <svg viewBox="0 0 230 15" aria-hidden="true">
                <path d="M3 11Q105-3 225 7" />
              </svg>
            </h2>
            <p>10 phút mỗi ngày cùng flashcard và quiz.</p>
            <div className="hero-actions">
              <Link
                className="button primary"
                href={`/decks/${current.id}/study`}
              >
                Bắt đầu học ngay
                <Icon name="arrow" size={18} />
              </Link>
              <Link href="/decks" className="text-link">
                Khám phá bộ từ
                <Icon name="up" size={17} />
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <span className="visual-spark spark-one">✳</span>
            <span className="visual-spark spark-two">✧</span>
            <span className="dotted-orbit" />
            <div className="back-flashcard" aria-hidden="true">
              <strong>Aa</strong>
            </div>
            <button
              className={`hero-flashcard ${showMeaning ? "flipped" : ""}`}
              onClick={() => setShowMeaning(!showMeaning)}
              aria-label="Lật thẻ từ vựng curious"
            >
              <span className="flashcard-top">
                Từ hôm nay
                <Icon name="cards" size={18} />
              </span>
              <span className="hero-card-illustration">
                {showMeaning ? "✦" : "Aa"}
              </span>
              <strong>{showMeaning ? "tò mò" : "curious"}</strong>
              <span className="phonetic">
                {showMeaning
                  ? "Eager to learn something new."
                  : "/ˈkjʊəriəs/ · adjective"}
              </span>
              <span className="flashcard-bottom">
                <span>
                  {showMeaning
                    ? "Luôn tò mò, luôn tiến bộ."
                    : "Chạm để khám phá nghĩa"}
                </span>
                <Icon name="shuffle" size={17} />
              </span>
            </button>
          </div>
        </section>
        <section className="quick-links" aria-label="Chọn hoạt động học">
          {[
            {
              title: "Flashcard",
              description: "Lật thẻ, nhớ lâu hơn",
              icon: "cards",
              href: "/decks",
              color: "mint",
            },
            {
              title: "Online Test",
              description: "Thử sức, biết năng lực",
              icon: "test",
              href: "/tests",
              color: "blue",
            },
            {
              title: "Quiz từ vựng",
              description: "Học vui, nhớ tự nhiên",
              icon: "quiz",
              href: "/quiz",
              color: "peach",
            },
            {
              title: "Tiến độ của tôi",
              description: "Nhìn lại từng bước tiến",
              icon: "chart",
              href: "/dashboard",
              color: "lilac",
            },
          ].map((item) => (
            <Link className="quick-link" href={item.href} key={item.title}>
              <span className={`quick-icon ${item.color}`}>
                <Icon name={item.icon} size={22} />
              </span>
              <div>
                <h3>{item.title}</h3>
              </div>
              <Icon name="up" size={16} />
            </Link>
          ))}
        </section>
        <div className="home-learning-grid">
          <section>
            <SectionHeading
              title={count ? "Tiếp tục học" : "Bộ từ gợi ý"}
              href="/decks"
              action="Bộ từ của tôi"
            />
            <div className="continue-card">
              <DeckArt deck={current} large />
              <div className="continue-info">
                <h3>{current.title}</h3>
                <div className="progress-caption">
                  <span>
                    {count} / {current.words.length} từ đã nhớ
                  </span>
                  <strong>
                    {Math.round((count / current.words.length) * 100)}%
                  </strong>
                </div>
                <progress
                  value={count}
                  max={current.words.length}
                  aria-label="Tiến độ bộ từ"
                />
                <Link
                  className="button primary"
                  href={`/decks/${current.id}/study`}
                >
                  {count ? "Tiếp tục học" : "Học bộ từ này"}
                  <Icon name="arrow" size={17} />
                </Link>
              </div>
            </div>
          </section>
          <aside className="daily-word">
            <div className="row between">
              <h2>Từ vựng mỗi ngày</h2>
              <span className="word-spark">✳</span>
            </div>
            <p className="word-title">
              progress<span>/ˈprəʊɡres/</span>
            </p>
            <p className="word-meaning">danh từ · sự tiến bộ</p>
            <blockquote>
              “A little progress each day
              <br />
              adds up to big results.”
            </blockquote>
            <p className="muted">
              Một chút tiến bộ mỗi ngày sẽ tạo nên
              <br />
              những kết quả lớn.
            </p>
          </aside>
        </div>
        <section className="library-section">
          <SectionHeading
            title="Khám phá bộ từ"
            href="/decks"
            action="Khám phá tất cả"
          />
          <div className="deck-grid">
            {decks.slice(0, 3).map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                known={state.known[deck.id]?.length}
                saved={state.saved.includes(deck.id)}
                onSave={() =>
                  update((s) => ({
                    ...s,
                    saved: s.saved.includes(deck.id)
                      ? s.saved.filter((id) => id !== deck.id)
                      : [...s.saved, deck.id],
                  }))
                }
              />
            ))}
          </div>
        </section>
        <section className="journey-strip">
          <div>
            <span className="quick-icon mint">
              <Icon name="chart" size={24} />
            </span>
            <div>
              <h3>Tiến độ học tập</h3>
              <p className="muted">
                Tiến độ học của bạn được lưu trên trình duyệt này.
              </p>
            </div>
          </div>
          <div className="journey-number">
            <strong>{learned}</strong>
            <span>từ đã nhớ</span>
          </div>
          <div className="journey-number">
            <strong>{state.attempts.length}</strong>
            <span>bài đã hoàn thành</span>
          </div>
          <Link className="text-link" href="/dashboard">
            Xem hành trình
            <Icon name="arrow" size={17} />
          </Link>
        </section>
        <section className="challenge-banner">
          <span className="challenge-art" aria-hidden="true">
            ✳
          </span>
          <div>
            <h2>Bạn đã nhớ được bao nhiêu?</h2>
          </div>
          <Link className="button dark" href="/tests">
            Thử sức ngay
            <Icon name="arrow" size={18} />
          </Link>
        </section>
      </div>
    </main>
  );
}
