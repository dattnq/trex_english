import { z } from "zod";

export const emailSchema = z.string().trim().email("Nhập địa chỉ email hợp lệ.").max(254).toLowerCase();
const email = emailSchema;
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Nhập mật khẩu của bạn.").max(128),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự.").max(80, "Tên tối đa 80 ký tự."),
    email,
    password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(128),
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp.",
  });

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(128),
  confirmPassword: z.string().min(1, "Nhập lại mật khẩu."),
})
  .refine(v => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Hai mật khẩu chưa khớp." });

export const roleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["LEARNER", "ADMIN"]),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự.").max(80, "Tên tối đa 80 ký tự."),
  dailyGoal: z.coerce.number().int().refine(v => [5, 10, 15, 20, 30].includes(v), { message: "Mục tiêu không hợp lệ." }),
});
