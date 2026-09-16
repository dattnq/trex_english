"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { recoveryAction,resetAction } from "@/actions/auth";
import { PasswordField,AuthFeedback } from "@/components/auth-fields";
import { Icon } from "@/components/ui";
export default function RecoveryForm({reset=false,mode="reset"}:{reset?:boolean;mode?:"reset"|"resend"}) {
  const [state,action,pending]=useActionState(reset?resetAction:recoveryAction,{message:""});
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  return <form action={action} className="ta-form" aria-busy={pending}><fieldset disabled={pending}>
    <input type="hidden" name="mode" value={mode}/>
    {reset?<><PasswordField name="password" label="Mật khẩu mới" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} error={state.errors?.password?.[0]}/><PasswordField name="confirmPassword" label="Nhập lại mật khẩu mới" autoComplete="new-password" minLength={8} maxLength={128} required value={confirm} onChange={e=>setConfirm(e.target.value)} error={state.errors?.confirmPassword?.[0]}/></>:<div className="ta-field"><label htmlFor="email">Email tài khoản</label><input id="email" name="email" type="email" placeholder="ban@example.com" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={Boolean(state.errors?.email)}/></div>}
    <AuthFeedback state={state}/><button className="ta-submit" disabled={pending}>{pending?"Đang xử lý…":reset?"Lưu mật khẩu mới":mode==="resend"?"Gửi thư xác nhận":"Gửi liên kết đặt lại"}<Icon name="arrow" size={18}/></button>
    </fieldset><Link className="ta-guest" href="/login"><Icon name="back" size={16}/>Quay lại đăng nhập</Link></form>;
}
