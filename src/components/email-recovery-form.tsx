"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { recoveryAction, verifyRecoveryAction } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth-fields";
import type { FormState } from "@/lib/auth-types";

const initial: FormState = { message: "" };

export default function EmailRecoveryForm() {
  const [attempt, setAttempt] = useState(0);
  return <EmailStep key={attempt} onRestart={() => setAttempt(value => value + 1)}/>;
}

function EmailStep({ onRestart }: { onRestart: () => void }) {
  const [state, action, pending] = useActionState(recoveryAction, initial);
  if (state.status === "success" && state.recoveryEmail) {
    return <OtpStep email={state.recoveryEmail} message={state.message} onRestart={onRestart}/>;
  }
  return <form action={action} className="ta-form" aria-busy={pending}>
    <fieldset disabled={pending}>
      <input type="hidden" name="mode" value="reset"/>
      <div className="ta-field">
        <label htmlFor="recovery-email">Email tài khoản</label>
        <input id="recovery-email" name="email" type="email" autoComplete="email" placeholder="ban@example.com" required maxLength={254}
          aria-invalid={Boolean(state.errors?.email)} aria-describedby={state.errors?.email ? "recovery-email-error" : undefined}/>
        {state.errors?.email && <span id="recovery-email-error" className="ta-field-error">{state.errors.email[0]}</span>}
      </div>
      <AuthFeedback state={state}/>
      <button className="ta-submit" disabled={pending}>{pending ? "Đang gửi…" : "Gửi mã OTP"}</button>
    </fieldset>
    <Link className="ta-guest" href="/login">Quay lại đăng nhập</Link>
  </form>;
}

function OtpStep({ email, message, onRestart }: { email: string; message: string; onRestart: () => void }) {
  const [state, verify, verifying] = useActionState(verifyRecoveryAction, initial);
  const [remaining, setRemaining] = useState(60);
  const [sent, resend, sending] = useActionState(async (previous: FormState, form: FormData) => {
    const result = await recoveryAction(previous, form);
    if (result.status === "success") setRemaining(60);
    return result;
  }, initial);
  const pending = verifying || sending;
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="ta-form">
    <p className="ta-hint">Email nhận mã: <strong>{email}</strong></p>
    <p className="ta-hint">{message}</p>
    <form action={verify} className="ta-form" aria-busy={pending}>
      <fieldset disabled={pending}>
        <input type="hidden" name="email" value={email}/>
        <div className="ta-field">
          <label htmlFor="recovery-token">Mã OTP</label>
          <input id="recovery-token" name="token" type="text" inputMode="numeric" autoComplete="one-time-code"
            required pattern="[0-9]{6,10}" minLength={6} maxLength={10} autoFocus
            aria-invalid={Boolean(state.errors?.token) || state.status === "error"} aria-describedby="recovery-token-hint"/>
          <span id="recovery-token-hint" className="ta-hint">{state.errors?.token?.[0] ?? "Nhập mã trong email mới nhất. Mã chỉ dùng một lần."}</span>
        </div>
        <AuthFeedback state={state}/>
        <button className="ta-submit" disabled={pending}>{verifying ? "Đang xác nhận…" : "Xác nhận mã OTP"}</button>
      </fieldset>
    </form>
    <form action={resend} aria-busy={sending}>
      <input type="hidden" name="email" value={email}/>
      <input type="hidden" name="mode" value="reset"/>
      <button className="ta-guest" disabled={pending || remaining > 0}>
        {sending ? "Đang gửi…" : remaining > 0 ? `Gửi lại mã sau ${remaining}s` : "Gửi lại mã OTP"}
      </button>
      <AuthFeedback state={sent}/>
    </form>
    <button type="button" className="ta-guest" disabled={pending} onClick={onRestart}>Dùng email khác</button>
    <Link className="ta-guest" href="/login">Quay lại đăng nhập</Link>
  </div>;
}
