export default function PageLoading() {
  return <main id="main" className="container page-main route-loading" aria-busy="true" aria-label="Đang tải trang">
    <span className="sr-only" role="status">Đang tải nội dung…</span>
    <div aria-hidden="true">
      <div className="route-placeholder route-placeholder-title" />
      <div className="route-placeholder route-placeholder-description" />
      <div className="route-placeholder route-placeholder-toolbar" />
      <div className="route-placeholder-grid">{[0, 1, 2].map(index => <div key={index} className="route-placeholder route-placeholder-card" />)}</div>
    </div>
  </main>;
}
