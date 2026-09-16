"use client";
import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { loginAction, registerAction, googleLoginAction } from "@/actions/auth";
import { PasswordField, AuthFeedback } from "@/components/auth-fields";
import { Icon } from "@/components/ui";

export default function AuthScreen({register=false,updated=false}:{register?:boolean;updated?:boolean}) {
  const [email,setEmail]=useState(""),[name,setName]=useState("");
  const [password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [state,action,pending]=useActionState(register?registerAction:loginAction,{message:""});
  const [googleState,googleAction,googlePending]=useActionState(googleLoginAction,{message:""});
  const busy=pending||googlePending;
  const sent=register&&state.status==="success";
  return <main id="main" className="ta-page"><div className="ta-shell">
    <aside className="ta-story">
      <span className="ta-eyebrow"><span/> MỖI NGÀY MỘT CHÚT TIẾNG ANH</span>
      <h2>Học từng chút.<br/>{" "}<em>Tiến xa mỗi ngày.</em></h2>
      <p>Từ những từ vựng đầu tiên đến sự tự tin của bạn. T-Rex luôn sẵn sàng đồng hành.</p>
      <div className="ta-illustration" aria-hidden="true">
        <div className="ta-orbit"/><span className="ta-spark">✦</span>
        <div className="ta-word"><small>TỪ VỰNG HÔM NAY</small><strong>grow <span>/ɡrəʊ/</span></strong><p>phát triển, trưởng thành</p><span className="ta-word-line"/></div>
        <Image src="/trex-avatar.png" alt="" width={270} height={270} priority className="ta-mascot"/>
        <span className="ta-bubble">Let’s grow together!</span>
      </div>
      <div className="ta-features"><span><Icon name="cards" size={16}/>Flashcard dễ nhớ</span><span><Icon name="quiz" size={16}/>Quiz thú vị</span><span><Icon name="test" size={16}/>Tự kiểm tra</span></div>
      <span className="ta-story-foot">Một khởi đầu nhỏ. Một thói quen tốt.</span>
    </aside>
    <section className="ta-form-panel" aria-labelledby="auth-title">
      <nav className="ta-tabs" aria-label="Tài khoản"><Link href="/login" aria-current={!register?"page":undefined}>Đăng nhập</Link><Link href="/register" aria-current={register?"page":undefined}>Đăng ký</Link></nav>
      <span className="ta-eyebrow">{register?"BẮT ĐẦU HÀNH TRÌNH":"RẤT VUI ĐƯỢC GẶP BẠN"}</span>
      <h1 id="auth-title">{register?"Tạo tài khoản mới":"Chào mừng trở lại!"}</h1>
      <p className="ta-intro">{register?"Một tài khoản, một khởi đầu mới cùng tiếng Anh.":"Đăng nhập để tiếp tục khám phá cùng T-Rex."}</p>
      {updated&&<AuthFeedback state={{message:"Mật khẩu đã được cập nhật. Hãy đăng nhập lại.",status:"success"}}/>}
      {!sent&&<><form action={googleAction} className="ta-google-form" aria-busy={googlePending}>
        <button type="submit" className="ta-google" disabled={busy}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.72 9.4 5.96 12 5.96Z"/></svg>
          {googlePending?"Đang kết nối Google…":"Tiếp tục với Google"}
          {googlePending&&<span className="ta-spinner"/>}
        </button><AuthFeedback state={googleState}/>
      </form><div className="ta-divider ta-email-divider"><span>hoặc dùng email</span></div></>}
      {sent?<div className="ta-sent"><span className="ta-sent-icon"><Icon name="check" size={30}/></span><h2>Kiểm tra email của bạn</h2><AuthFeedback state={state}/><Link className="ta-submit" href="/login">Đến trang đăng nhập <Icon name="arrow" size={18}/></Link><Link className="ta-inline-link" href="/forgot-password?mode=resend">Gửi lại thư xác nhận</Link></div>:
      <form action={action} className="ta-form" aria-busy={busy}>
        <fieldset disabled={busy}>
        {register&&<div className="ta-field"><label htmlFor="displayName">Tên của bạn</label><input id="displayName" name="displayName" placeholder="Bạn muốn T-Rex gọi là gì?" autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} aria-invalid={Boolean(state.errors?.displayName)} aria-describedby={state.errors?.displayName?"displayName-error":undefined}/>{state.errors?.displayName&&<span id="displayName-error" className="ta-field-error">{state.errors.displayName[0]}</span>}</div>}
        <div className="ta-field"><label htmlFor="email">Địa chỉ email</label><input id="email" name="email" type="email" placeholder="ban@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={Boolean(state.errors?.email)} aria-describedby={state.errors?.email?"email-error":undefined}/>{state.errors?.email&&<span id="email-error" className="ta-field-error">{state.errors.email[0]}</span>}</div>
        <PasswordField name="password" label="Mật khẩu" placeholder={register?"Tạo mật khẩu từ 8 ký tự":"Nhập mật khẩu của bạn"} autoComplete={register?"new-password":"current-password"} required minLength={register?8:1} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} error={state.errors?.password?.[0]}/>
        {register&&<><p className={`ta-hint ${password.length>=8?"is-ready":""}`}><Icon name={password.length>=8?"check":"info"} size={14}/> Ít nhất 8 ký tự. Nên dùng mật khẩu riêng cho tài khoản này.</p><PasswordField name="confirmPassword" label="Nhập lại mật khẩu" placeholder="Nhập lại mật khẩu vừa tạo" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} error={state.errors?.confirmPassword?.[0]}/></>}
        {!register&&<div className="ta-form-options"><span>Chào bạn, người bạn của T-Rex.</span><Link href="/forgot-password">Quên mật khẩu?</Link></div>}
        <AuthFeedback state={state}/>
        <button className="ta-submit" type="submit" disabled={busy}>{pending?"Đang xử lý…":register?"Tạo tài khoản miễn phí":"Đăng nhập"}{pending?<span className="ta-spinner"/>:<Icon name="arrow" size={19}/>}</button>
        </fieldset>
      </form>}
      {!sent&&<><p className="ta-switch">{register?"Bạn đã có tài khoản?":"Lần đầu đến với T-Rex?"} <Link href={register?"/login":"/register"}>{register?"Đăng nhập":"Tạo tài khoản"}</Link></p>{!register&&<Link className="ta-resend" href="/forgot-password?mode=resend">Chưa nhận được email xác nhận?</Link>}</>}
      <div className="ta-divider"><span>hoặc khám phá trước</span></div><Link className="ta-guest" href="/decks"><Icon name="book" size={17}/> Học thử không cần tài khoản <Icon name="chevron" size={14}/></Link>
    </section>
  </div></main>;
}
