"use client";
export default function AdminError({reset}:{reset:()=>void}){return <section className="admin-panel" role="alert"><h1>Chưa tải được dữ liệu quản trị</h1><p>Kiểm tra kết nối database và các migration, sau đó thử lại.</p><button className="button primary" onClick={reset}>Thử lại</button></section>;}
