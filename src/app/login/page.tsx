import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth-screen";
import { getViewer, getAuthDestination } from "@/lib/auth";
export const metadata={title:"Đăng nhập | T-Rex Edu"};
export default async function LoginPage({searchParams}:{searchParams:Promise<{updated?:string}>}) {
 const viewer = await getViewer();
 if(viewer)redirect(getAuthDestination(viewer.role));
 return <AuthScreen updated={(await searchParams).updated==="1"}/>;
}
