import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth-screen";
import { getViewer } from "@/lib/auth";
export const metadata={title:"Đăng nhập | T-Rex Edu"};
export default async function LoginPage({searchParams}:{searchParams:Promise<{updated?:string}>}) {
 if(await getViewer())redirect("/account");
 return <AuthScreen updated={(await searchParams).updated==="1"}/>;
}
