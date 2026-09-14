"use client";
import Link from "next/link";
import { useState } from "react";
import { tests } from "@/lib/learning-data";
import { useLearning } from "./learning-provider";
import { Icon, PageHeading } from "./ui";
export default function TestLibrary() {
  const [level, setLevel] = useState("Tất cả");
  const { state } = useLearning();
  return (
    <main id="main" className="container page-main">
      <PageHeading title="Bài kiểm tra" />
      <div className="section-heading">
        <h2>Chọn bài kiểm tra</h2>
        <div className="tabs">
          {["Tất cả", "A1", "A2"].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={l === level ? "active" : ""}
              aria-pressed={l === level}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="deck-grid">
        {tests
          .filter((t) => level === "Tất cả" || t.level === level)
          .map((test) => (
            <article className="test-card panel" key={test.id}>
              <div className="row between">
                <span className={`quick-icon ${test.color}`}>
                  <Icon name="test" size={25} />
                </span>
                <span className="badge">
                  {test.level} · {test.category}
                </span>
              </div>
              <h3>{test.title}</h3>
              <div className="detail-meta">
                <span>
                  <Icon name="test" size={16} />
                  {test.questions.length} câu hỏi
                </span>
                <span>
                  <Icon name="clock" size={16} />~{test.minutes} phút
                </span>
              </div>
              {state.attempts.some((a) => a.title === test.title) && (
                <p className="test-status">✓ Đã hoàn thành</p>
              )}
              <Link
                className="button secondary full"
                href={`/tests/${test.id}`}
              >
                Bắt đầu làm bài
                <Icon name="arrow" size={17} />
              </Link>
            </article>
          ))}
      </div>
      <p className="page-note">
        <Icon name="book" size={17} />
        Bài luyện tập tham khảo A1–A2, giúp bạn tự ôn tập; không thay thế bài
        đánh giá trình độ chính thức.
      </p>
    </main>
  );
}
