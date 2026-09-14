"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="placeholder"><h1>Chưa tải được trang</h1><p>Vui lòng thử lại.</p><button className="button primary" onClick={reset}>Thử lại</button></main>;
}
