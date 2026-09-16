"use client";
import { useActionState } from "react";
import { changeRoleAction } from "@/actions/admin";
export default function RoleForm({
  id,
  role,
}: {
  id: string;
  role: "ADMIN" | "LEARNER";
}) {
  const [state, action, pending] = useActionState(changeRoleAction, {
    message: "",
  });
  return (
    <form action={action} className="form-stack" onSubmit={e=>{if(!window.confirm("Xác nhận thay đổi quyền của tài khoản này? Quyền admin cho phép quản lý toàn bộ nội dung và tài khoản."))e.preventDefault();}}>
      <input type="hidden" name="expectedRole" value={role} />
      <input type="hidden" name="userId" value={id} />
      <label>
        Vai trò mới
        <select name="role" defaultValue={role} key={role}>
          <option value="LEARNER">Người học</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
      </label>
      <button className="button secondary" disabled={pending}>
        {pending ? "Đang lưu..." : "Lưu vai trò"}
      </button>
      <p role="status">{state.message}</p>
    </form>
  );
}
