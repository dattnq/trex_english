import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecoveryForm from "@/components/recovery-form";
export const metadata={title:"Mật khẩu mới | T-Rex Edu"};
export default async function Page(){
 const supabase=await createClient();
 const {data,error}=await supabase.auth.getUser();
 const viewer=!error && data.user?.email_confirmed_at ? data.user : null;
 return <main id="main" className="ta-recovery"><section className="ta-recovery-card"><span className="ta-eyebrow">BẢO VỆ TÀI KHOẢN</span><h1>{viewer?"Tạo mật khẩu mới":"Liên kết chưa sẵn sàng"}</h1><p className="ta-intro">{viewer?`Đặt mật khẩu mới cho ${viewer.email}. Sau đó bạn sẽ đăng nhập lại.`:"Mở liên kết trong email đặt mật khẩu. Nếu liên kết hết hạn, hãy yêu cầu gửi lại."}</p>{viewer?<RecoveryForm reset/>:<Link className="ta-submit" href="/forgot-password">Yêu cầu liên kết mới</Link>}</section></main>;
}
