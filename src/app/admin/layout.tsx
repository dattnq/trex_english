import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import "./admin.css";
export const metadata={title:"Quản trị | T-Rex Edu"};
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const viewer=await requireAdmin();
 return <main id="main" className="admin-shell"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand">T-REX <span>ADMIN</span></Link><p>Không gian quản trị</p><nav aria-label="Quản trị"><Link href="/admin">Tổng quan</Link><Link href="/admin/content?kind=deck">Bộ từ vựng</Link><Link href="/admin/content?kind=test">Đề kiểm tra</Link><Link href="/admin/users">Tài khoản & phân quyền</Link><Link href="/admin/attempts">Kết quả học tập</Link></nav><div className="admin-identity"><strong>{viewer.displayName}</strong><span>Quản trị viên</span><Link href="/account">Về tài khoản →</Link></div></aside><section className="admin-main">{children}</section></main>;
}
