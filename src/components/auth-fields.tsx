"use client";
import { useActionState, useState, type InputHTMLAttributes } from "react";
import { logoutAction } from "@/actions/auth";
import type { FormState } from "@/lib/auth-types";

export function PasswordField({label,error,...props}: InputHTMLAttributes<HTMLInputElement> & {name:string;label:string;error?:string}) {
  const [visible,setVisible]=useState(false);
  return <div className="ta-field"><label htmlFor={props.name}>{label}</label>
    <div className="ta-password"><input {...props} id={props.name} type={visible?"text":"password"}
      aria-invalid={Boolean(error)} aria-describedby={error?`${props.name}-error`:undefined}/>
      <button type="button" aria-label={visible?`Ẩn ${label.toLowerCase()}`:`Hiện ${label.toLowerCase()}`}
        aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?"Ẩn":"Hiện"}</button></div>
    {error&&<span className="ta-field-error" id={`${props.name}-error`}>{error}</span>}
  </div>;
}
export function AuthFeedback({state}:{state:FormState}) {
  if(!state.message)return null;
  return <p className={`ta-feedback ${state.status==="success"?"is-success":"is-error"}`}
    role={state.status==="success"?"status":"alert"}>{state.message}</p>;
}
export function LogoutButton() {
  const [state,action,pending]=useActionState(logoutAction,{message:""});
  return <form action={action}><button className="button secondary" disabled={pending}>
    {pending?"Đang đăng xuất…":"Đăng xuất"}</button><AuthFeedback state={state}/></form>;
}
