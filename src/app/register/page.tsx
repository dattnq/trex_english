import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth-screen";
import { getViewer } from "@/lib/auth";
export const metadata = { title: "Đăng ký | T-Rex Edu" };
export default async function RegisterPage() {
  if (await getViewer()) redirect("/account");
  return <AuthScreen register />;
}
