import RecoveryForm from "@/components/recovery-form";
import { Icon } from "@/components/ui";
export const metadata={title:"Khôi phục tài khoản | T-Rex Edu"};
export default async function Page({searchParams}:{searchParams:Promise<{mode?:string}>}) {
  const mode=(await searchParams).mode==="resend"?"resend":"reset";
  return <main id="main" className="ta-recovery"><section className="ta-recovery-card"><span className="ta-sent-icon"><Icon name="user" size={26}/></span><span className="ta-eyebrow">LUÔN CÓ CÁCH QUAY LẠI</span><h1>{mode==="resend"?"Xác nhận email":"Quên mật khẩu?"}</h1><p className="ta-intro">{mode==="resend"?"Nhập email đã đăng ký để nhận lại liên kết xác nhận.":"Nhập email đã đăng ký, mở liên kết trong email rồi đặt mật khẩu mới."}</p><RecoveryForm key={mode} mode={mode}/></section></main>;
}
