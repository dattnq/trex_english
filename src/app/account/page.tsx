import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth-fields";
export const metadata={title:"Tài khoản của tôi | T-Rex Edu"};
export default async function AccountPage(){
 const viewer=await requireUser();
 return <main id="main" className="ta-recovery"><section className="ta-recovery-card"><span className="ta-account-avatar">{viewer.displayName.charAt(0).toUpperCase()}</span><span className="ta-eyebrow">TÀI KHOẢN CỦA BẠN</span><h1>Chào {viewer.displayName}!</h1><p className="ta-intro">Sẵn sàng học thêm một điều mới hôm nay?</p><dl className="ta-account-details"><div><dt>Email đã xác nhận</dt><dd>{viewer.email}</dd></div><div><dt>Vai trò</dt><dd>{viewer.role==="ADMIN"?"Quản trị viên":"Người học"}</dd></div></dl><div className="ta-account-actions"><Link className="ta-submit" href="/decks">Khám phá flashcard</Link><Link className="ta-inline-link" href="/forgot-password">Đặt lại mật khẩu qua email</Link>{viewer.role==="ADMIN"&&<Link className="ta-submit" href="/admin">Mở trang quản trị</Link>}<Link className="ta-inline-link" href="/history">Bài làm và kết quả trên tài khoản</Link><LogoutButton/></div><p className="ta-local-note">Tiến độ flashcard và bài làm được lưu theo tài khoản. Dữ liệu học thử trên thiết bị chỉ được nhập khi bạn chọn nhập; điểm học thử không chuyển thành điểm chính thức.</p></section></main>;
}
