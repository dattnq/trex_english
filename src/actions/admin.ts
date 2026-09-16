"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleSchema } from "@/lib/validation";
import type { FormState } from "@/lib/auth-types";

export async function changeRoleAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const viewer = await requireUser();
  const parsed = roleSchema.safeParse({
    userId: form.get("userId"),
    role: form.get("role"),
  });
  if (!parsed.success) return { message: "Dữ liệu vai trò chưa hợp lệ." };
  const target = parsed.data;
  let message: string;
  try {
    message = await db.$transaction(
      async (tx) => {
        // Serialize all role changes made by this application.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(73191, 1)`;
        const actor = await tx.profile.findUnique({
          where: { id: viewer.id },
          select: { role: true },
        });
        if (actor?.role !== "ADMIN") return "Bạn không có quyền quản trị.";
        if (target.userId === viewer.id) return "Không được tự đổi quyền.";
        const existing = await tx.profile.findUnique({
          where: { id: target.userId },
          select: { id: true, role: true },
        });
        if (!existing) return "Không tìm thấy hồ sơ người dùng.";
        if (form.get("expectedRole") !== existing.role) return "Vai trò đã thay đổi. Tải lại trang trước khi tiếp tục.";
        await tx.profile.update({
          where: { id: target.userId },
          data: { role: target.role },
        });
        return "Đã cập nhật vai trò.";
      },
      { isolationLevel: "ReadCommitted" },
    );
  } catch {
    return { message: "Chưa cập nhật được. Hãy tải lại trang rồi thử lại." };
  }
  revalidatePath("/", "layout");
  return { message };
}
