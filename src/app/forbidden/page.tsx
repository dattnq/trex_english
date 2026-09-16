import Link from "next/link";
export default function ForbiddenPage() {
  return (
    <section className="container page-main">
      <h1>Bạn không có quyền truy cập</h1>
      <p>Chức năng này chỉ dành cho quản trị viên.</p>
      <Link className="button primary" href="/account">
        Về tài khoản
      </Link>
    </section>
  );
}
