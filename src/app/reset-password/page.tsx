import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecoveryForm from "@/components/recovery-form";
export const metadata={title:"Mật khẩu mới | T-Rex Edu"};
export default async function Page(){
 const supabase=await createClient();
 const {data,error}=await supabase.auth.getUser();
 const viewer=!error && data.user?.email_confirmed_at ? data.user : null;
 return <main id="main" className="ta-recovery"><section className="ta-recovery-card"><span className="ta-eyebrow">BẢO VỆ TÀI KHOẢN</span><h1>{viewer?"Tạo mật khẩu mới":"Cần xác nhận email"}</h1><p className="ta-intro">{viewer?`Đặt mật khẩu mới cho ${viewer.email}. Sau đó bạn sẽ đăng nhập lại.`:"Nhập email và mã OTP ở trang quên mật khẩu để tiếp tục."}</p>{viewer?<RecoveryForm reset/>:<Link className="ta-submit" href="/forgot-password">Nhận mã OTP qua email</Link>}</section></main>;
}
