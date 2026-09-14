import type { Metadata } from "next";
import "./globals.css";
import { LearningProvider } from "@/components/learning-provider";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
export const metadata: Metadata = {
  title: "T-Rex Edu | Học tiếng Anh mỗi ngày",
  description: "Học từ vựng qua flashcard, thử sức với quiz và bài test tiếng Anh cơ bản cùng T-Rex Edu.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" data-scroll-behavior="smooth"><body><LearningProvider><SiteHeader />{children}<SiteFooter /></LearningProvider></body></html>;
}
