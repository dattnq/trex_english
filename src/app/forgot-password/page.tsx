import Link from "next/link";
import RecoveryForm from "@/components/recovery-form";
import { Icon } from "@/components/ui";
export const metadata={title:"Khôi phục tài khoản | T-Rex Edu"};
export default async function Page({searchParams}:{searchParams:Promise<{mode?:string}>}) {
  const mode=(await searchParams).mode==="resend"?"resend":"reset";
  return <main id="main" className="ta-recovery"><section className="ta-recovery-card"><span className="ta-sent-icon"><Icon name="user" size={26}/></span><span className="ta-eyebrow">LUÔN CÓ CÁCH QUAY LẠI</span><h1>{mode==="resend"?"Xác nhận email":"Quên mật khẩu?"}</h1><p className="ta-intro">{mode==="resend"?"Nhập email đã đăng ký để nhận lại liên kết xác nhận.":"Đừng lo. Chúng tôi sẽ gửi liên kết giúp bạn tạo mật khẩu mới."}</p><nav className="ta-tabs" aria-label="Loại khôi phục"><Link href="/forgot-password" aria-current={mode==="reset"?"page":undefined}>Đặt lại mật khẩu</Link><Link href="/forgot-password?mode=resend" aria-current={mode==="resend"?"page":undefined}>Gửi lại xác nhận</Link></nav><RecoveryForm key={mode} mode={mode}/></section></main>;
}
