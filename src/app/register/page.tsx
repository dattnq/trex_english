import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth-screen";
import { getViewer, getAuthDestination } from "@/lib/auth";
export const metadata = { title: "Đăng ký | T-Rex Edu" };
export default async function RegisterPage() {
  const viewer = await getViewer();
  if (viewer) redirect(getAuthDestination(viewer.role));
  return <AuthScreen register />;
}
