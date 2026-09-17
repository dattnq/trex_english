import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ProfileForm, LogoutSection } from "@/components/profile-form";

export const metadata = { title: "Tài khoản của tôi | T-Rex Edu" };

export default async function AccountPage() {
  const viewer = await requireUser();
  const isAdmin = viewer.role === "ADMIN";
  const initials = viewer.displayName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const goalLabel = `${viewer.dailyGoal} từ / ngày`;

  return (
    <main id="main" className="pf-page">
      <div className="pf-container">

        {/* ── Sidebar / Profile card ── */}
        <aside className="pf-sidebar">
          <div className="pf-id-card">
            <div className="pf-avatar">{initials}</div>
            <div className="pf-id-body">
              <p className="pf-eyebrow">HỒ SƠ CÁ NHÂN</p>
              <h1 className="pf-username">{viewer.displayName}</h1>
              <span className={`pf-role-pill ${isAdmin ? "is-admin" : ""}`}>
                {isAdmin ? "⚙ Quản trị viên" : "📚 Người học"}
              </span>
            </div>
          </div>

          <div className="pf-meta-list">
            <div className="pf-meta-item">
              <span className="pf-meta-icon">✉</span>
              <div>
                <p className="pf-meta-label">Email</p>
                <p className="pf-meta-value">{viewer.email}</p>
              </div>
            </div>
            <div className="pf-meta-item">
              <span className="pf-meta-icon">🎯</span>
              <div>
                <p className="pf-meta-label">Mục tiêu hàng ngày</p>
                <p className="pf-meta-value">{goalLabel}</p>
              </div>
            </div>
          </div>

          <div className="pf-quick-nav">
            <Link href="/decks" className="pf-nav-link">
              <span>🃏</span> Bộ thẻ Flashcard
            </Link>
            <Link href="/history" className="pf-nav-link">
              <span>📊</span> Lịch sử học tập
            </Link>
            {isAdmin && (
              <Link href="/admin" className="pf-nav-link is-admin">
                <span>⚙</span> Trang quản trị
              </Link>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="pf-content">

          {/* Chỉnh sửa thông tin */}
          <section className="pf-section">
            <div className="pf-section-head">
              <h2>Chỉnh sửa thông tin</h2>
              <p>Cập nhật tên hiển thị, mục tiêu học và múi giờ của bạn.</p>
            </div>
            <ProfileForm viewer={viewer} />
          </section>

          {/* Bảo mật */}
          <section className="pf-section">
            <div className="pf-section-head">
              <h2>Bảo mật tài khoản</h2>
              <p>Quản lý mật khẩu và phiên đăng nhập.</p>
            </div>
            <div className="pf-security-actions">
              <Link href="/forgot-password" className="pf-action-row">
                <div className="pf-action-row-icon">🔑</div>
                <div>
                  <p className="pf-action-row-title">Đổi mật khẩu</p>
                  <p className="pf-action-row-desc">Nhận link đặt lại mật khẩu qua email</p>
                </div>
                <span className="pf-action-row-arrow">→</span>
              </Link>
              <LogoutSection />
            </div>
          </section>

          <p className="pf-note">
            Tiến độ flashcard và bài làm được lưu theo tài khoản. Dữ liệu học thử trên thiết bị chỉ được nhập khi bạn chọn nhập; điểm học thử không chuyển thành điểm chính thức.
          </p>
        </div>

      </div>
    </main>
  );
}