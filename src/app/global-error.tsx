"use client";

// Keep this boundary independent of the root layout and its data providers.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <h1>Ứng dụng tạm thời chưa sẵn sàng</h1>
        <button onClick={reset}>Thử lại</button>
      </body>
    </html>
  );
}
