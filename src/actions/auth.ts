"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";
import { appOrigin, googleProviderEnabled } from "@/lib/auth-config";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import type { FormState } from "@/lib/auth-types";

const failure = (message: string): FormState => ({ status: "error", message });
const rateMessage = "Bạn thao tác quá nhanh. Hãy chờ một chút rồi thử lại.";
export async function registerAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    displayName: form.get("displayName"),
    email: form.get("email"),
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!parsed.success)
    return {
      ...failure("Kiểm tra lại những ô được đánh dấu."),
      errors: parsed.error.flatten().fieldErrors,
    };
  let signedIn = false;
  try {
    const supabase = await createClient(true);
    const { displayName, email, password } = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${appOrigin()}/auth/confirm`,
      },
    });
    if (error)
      return failure(
        error.status === 429
          ? rateMessage
          : "Chưa tạo được tài khoản. Hãy kiểm tra thông tin hoặc thử lại sau.",
      );
    if (data.session && data.user?.email_confirmed_at) {
      await ensureProfile(data.user);
      signedIn = true;
    }
  } catch {
    return failure(
      "Chưa hoàn tất kết nối. Nếu đã nhận email, hãy xác nhận rồi đăng nhập lại.",
    );
  }
  if (signedIn) {
    revalidatePath("/", "layout");
    redirect("/account");
  }
  return {
    status: "success",
    message:
      "Nếu email đủ điều kiện, thư xác nhận sẽ được gửi đến bạn. Hãy kiểm tra hộp thư và thư rác. Nếu đã có tài khoản, bạn có thể đăng nhập.",
  };
}
export async function loginAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success)
    return {
      ...failure("Kiểm tra lại thông tin đăng nhập."),
      errors: parsed.error.flatten().fieldErrors,
    };
  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user?.email_confirmed_at) {
      if (!error && data.session)
        await supabase.auth.signOut({ scope: "local" });
      return failure(
        error?.status === 429
          ? rateMessage
          : "Email hoặc mật khẩu chưa đúng, hoặc email chưa được xác nhận.",
      );
    }
    await ensureProfile(data.user);
  } catch {
    return failure(
      "Dịch vụ đăng nhập tạm thời chưa sẵn sàng. Hãy thử lại sau.",
    );
  }
  revalidatePath("/", "layout");
  redirect("/account");
}
export async function logoutAction(): Promise<FormState> {
  try {
    const supabase = await createClient(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return failure("Chưa đăng xuất được. Hãy thử lại.");
  } catch {
    return failure("Kết nối gián đoạn. Hãy thử đăng xuất lại.");
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
export async function recoveryAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success)
    return {
      ...failure("Nhập địa chỉ email hợp lệ."),
      errors: { email: ["Email chưa hợp lệ."] },
    };
  const mode = form.get("mode");
  if (mode !== "reset" && mode !== "resend")
    return failure("Yêu cầu chưa hợp lệ.");
  try {
    const supabase = await createClient(true),
      url = `${appOrigin()}/auth/confirm`;
    const { error } =
      mode === "resend"
        ? await supabase.auth.resend({
            type: "signup",
            email: email.data,
            options: { emailRedirectTo: url },
          })
        : await supabase.auth.resetPasswordForEmail(email.data, {
            redirectTo: `${url}?next=reset-password`,
          });
    if (error?.status === 429) return failure(rateMessage);
    if (error && (!error.status || error.status >= 500))
      return failure(
        "Dịch vụ gửi email tạm thời chưa sẵn sàng. Hãy thử lại sau.",
      );
    // Account-specific failures remain indistinguishable to prevent enumeration.
  } catch {
    return failure("Không kết nối được dịch vụ. Hãy thử lại sau.");
  }
  return {
    status: "success",
    message:
      "Nếu tài khoản phù hợp, bạn sẽ nhận được email hướng dẫn. Kiểm tra cả thư rác và chờ trước khi gửi lại.",
  };
}
export async function resetAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!parsed.success)
    return {
      ...failure("Kiểm tra lại mật khẩu mới."),
      errors: parsed.error.flatten().fieldErrors,
    };
  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email_confirmed_at)
      return failure(
        "Phiên đã hết hạn. Hãy yêu cầu email đặt lại mật khẩu mới.",
      );
    const result = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (result.error)
      return failure(
        result.error.status === 429
          ? rateMessage
          : "Chưa đổi được mật khẩu. Mật khẩu phải khác mật khẩu cũ và đáp ứng chính sách tài khoản.",
      );
    const signedOut = await supabase.auth.signOut({ scope: "global" });
    if (signedOut.error)
      return failure(
        "Mật khẩu đã đổi, nhưng chưa đăng xuất được các phiên. Hãy đăng xuất từ trang tài khoản.",
      );
  } catch {
    return failure(
      "Kết nối gián đoạn. Thử đăng nhập với mật khẩu mới trước khi yêu cầu lại email.",
    );
  }
  revalidatePath("/", "layout");
  redirect("/login?updated=1");
}

export async function googleLoginAction(): Promise<FormState> {
  let destination: string;
  try {
    if (!(await googleProviderEnabled()))
      return failure(
        "Đăng nhập Google chưa sẵn sàng. Bạn vẫn có thể dùng email và mật khẩu.",
      );
    const supabase = await createClient(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appOrigin()}/auth/confirm`,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data.url)
      return failure(
        error?.status === 429
          ? rateMessage
          : "Chưa kết nối được với Google. Hãy thử lại sau.",
      );
    destination = data.url;
  } catch {
    return failure("Kết nối đăng nhập Google bị gián đoạn. Hãy thử lại sau.");
  }
  // Next redirects throw; keep this outside the catch block.
  redirect(destination);
}
