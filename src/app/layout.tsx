import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import { publicDeckCatalog } from "@/lib/catalog";
import { getViewer } from "@/lib/auth";
import { LearningProvider } from "@/components/learning-provider";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
export const metadata: Metadata = {
  title: "T-Rex Edu | Học tiếng Anh mỗi ngày",
  description: "Học từ vựng qua flashcard, thử sức với quiz và bài test tiếng Anh cơ bản cùng T-Rex Edu.",
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [viewer,catalog] = await Promise.all([getViewer(),publicDeckCatalog()]);
  return <html lang="vi" data-scroll-behavior="smooth"><body><LearningProvider key={viewer?.id??"guest"} userId={viewer?.id} publicDecks={catalog.decks} catalogError={catalog.error}><SiteHeader viewer={viewer} />{children}<SiteFooter /></LearningProvider></body></html>;
}
