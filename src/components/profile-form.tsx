"use client";
import { useActionState } from "react";
import { updateProfileAction, logoutAction } from "@/actions/auth";
import type { FormState, Viewer } from "@/lib/auth-types";

const GOALS = [5, 10, 15, 20, 30] as const;

function FieldError({ error }: { error?: string[] }) {
  if (!error?.length) return null;
  return <span className="pf-field-error">{error[0]}</span>;
}

export function ProfileForm({ viewer }: { viewer: Viewer }) {
  const init: FormState = { message: "" };
  const [state, action, pending] = useActionState(updateProfileAction, init);

  return (
    <form action={action} className="pf-form">
      {state.message && (
        <p
          className={`pf-feedback ${state.status === "success" ? "is-success" : "is-error"}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}

      <div className="pf-field">
        <label htmlFor="displayName">Tên hiển thị</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={viewer.displayName}
          maxLength={80}
          aria-invalid={Boolean(state.errors?.displayName)}
          aria-describedby={state.errors?.displayName ? "displayName-error" : undefined}
          placeholder="Nhập tên của bạn"
        />
        <FieldError error={state.errors?.displayName} />
      </div>

      <div className="pf-field">
        <label>Mục tiêu học mỗi ngày</label>
        <div className="pf-goal-options">
          {GOALS.map(g => (
            <label key={g} className="pf-goal-option">
              <input
                type="radio"
                name="dailyGoal"
                value={g}
                defaultChecked={viewer.dailyGoal === g}
              />
              <span>{g} từ</span>
            </label>
          ))}
        </div>
        <FieldError error={state.errors?.dailyGoal} />
      </div>

      <button type="submit" className="pf-save-btn" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </form>
  );
}

export function LogoutSection() {
  const [state, action, pending] = useActionState(logoutAction, { message: "" });
  return (
    <div className="pf-logout-section">
      <form action={action}>
        <button type="submit" className="pf-logout-btn" disabled={pending}>
          {pending ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>
        {state.message && (
          <p className="pf-feedback is-error" role="alert">{state.message}</p>
        )}
      </form>
    </div>
  );
}