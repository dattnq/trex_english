"use client";
import Image from "next/image";
import Link from "@/components/navigation-link";
import { useEffect, useState } from "react";
import { useLearning, dayKey } from "@/components/learning-provider";
import { DeckArt, DeckCard, Icon, SectionHeading } from "@/components/ui";
import PageLoading from "@/components/page-loading";

export default function Home() {
  const { state, decks, update, ready, account, attemptCount } = useLearning();
  const [flippedWord, setFlippedWord] = useState<string | null>(null);
  const [day, setDay] = useState(dayKey);
  useEffect(() => {
    const refreshDay = () => setDay(dayKey());
    const timer = window.setInterval(refreshDay, 60000);
    window.addEventListener("focus", refreshDay);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refreshDay); };
  }, []);
  const knownCount = (deck: (typeof decks)[number]) =>
    deck.words.filter(word => state.known[deck.id]?.includes(word.id)).length;
  const availableDecks = decks.filter(deck => deck.words.length > 0);
  const learned = availableDecks.reduce((sum, deck) => sum + knownCount(deck), 0);
  const today = state.activity[day]?.length || 0;
  const current =
    availableDecks.find(d => knownCount(d) > 0 && knownCount(d) < d.words.length)
    || availableDecks.find(d => knownCount(d) < d.words.length)
    || availableDecks[0];
  if (!ready) return <PageLoading />;
  if(!current)return <main id="main" className="container page-main"><h1>Học tiếng Anh cùng T-Rex</h1><p>Thư viện đang được chuẩn bị. Hãy quay lại sau hoặc tạo bộ từ của bạn.</p><Link className="button primary" href="/decks">Mở thư viện</Link></main>;
  const count = knownCount(current);
  const complete = count === current.words.length;
  // A stable order and Vietnam calendar day keep the suggestion consistent across reloads.
  const dailyWords = availableDecks.flatMap(deck => deck.words.map(word => ({ deck, word })))
    .sort((a, b) => a.deck.id.localeCompare(b.deck.id, "en") || a.word.id.localeCompare(b.word.id, "en"));
  const daily = dailyWords[Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000) % dailyWords.length];
  const dailyKey = `${day}:${daily.deck.id}:${daily.word.id}`;
  const showMeaning = flippedWord === dailyKey;
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
                {complete ? "Ôn lại bộ từ" : count ? "Tiếp tục học" : "Bắt đầu học ngay"}
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
              onClick={() => setFlippedWord(showMeaning ? null : dailyKey)}
              aria-label={`Lật thẻ ${daily.word.term} để xem ${showMeaning ? "tiếng Anh" : "nghĩa tiếng Việt"}`}
              aria-pressed={showMeaning}
            >
              <span className="flashcard-top">
                Từ hôm nay
                <Icon name="cards" size={18} />
              </span>
              <span className="hero-card-illustration">
                {showMeaning ? "✦" : "Aa"}
              </span>
              <strong title={showMeaning ? daily.word.meaning : daily.word.term}>{showMeaning ? daily.word.meaning : daily.word.term}</strong>
              <span className="phonetic">
                {showMeaning
                  ? daily.word.term
                  : daily.word.phonetic}
              </span>
              <span className="flashcard-bottom">
                <span>
                  {showMeaning
                    ? "Chạm để xem lại từ"
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
              title={complete ? "Ôn lại để nhớ lâu" : count ? "Tiếp tục học" : "Bộ từ gợi ý"}
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
                    {Math.round((count / Math.max(1,current.words.length)) * 100)}%
                  </strong>
                </div>
                <progress
                  value={count}
                  max={Math.max(1,current.words.length)}
                  aria-label="Tiến độ bộ từ"
                />
                <Link
                  className="button primary"
                  href={`/decks/${current.id}/study`}
                >
                  {complete ? "Ôn lại bộ từ này" : count ? "Tiếp tục học" : "Học bộ từ này"}
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
              {daily.word.term}{daily.word.phonetic && <span>{daily.word.phonetic}</span>}
            </p>
            <p className="word-meaning">{daily.word.meaning}</p>
            {daily.word.example && <blockquote>“{daily.word.example}”</blockquote>}
            <p className="muted">Từ bộ: {daily.deck.title}</p>
            <Link className="text-link" href={`/decks/${daily.deck.id}`}>Khám phá bộ từ này<Icon name="arrow" size={16} /></Link>
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
                known={knownCount(deck)}
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
                {account
                  ? "Tiến độ được đồng bộ theo tài khoản khi có kết nối mạng."
                  : "Tiến độ học thử được lưu trên trình duyệt này. Đăng nhập để đồng bộ giữa các thiết bị."}
              </p>
            </div>
          </div>
          <div className="journey-number">
            <strong>{learned}</strong>
            <span>từ đã nhớ</span>
          </div>
          <div className="journey-number">
            <strong>{attemptCount}</strong>
            <span>{account ? "bài đã hoàn thành" : "bài học thử đã làm"}</span>
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
