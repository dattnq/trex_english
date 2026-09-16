"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, Icon } from "./ui";
import type { Viewer } from "@/lib/auth-types";

const links = [{ href: "/", label: "Trang chủ", icon: "home" }, { href: "/decks", label: "Flashcard", icon: "cards" }, { href: "/tests", label: "Online Test", icon: "test" }, { href: "/quiz", label: "Quiz từ vựng", icon: "quiz" }, { href: "/dashboard", label: "Tiến độ", icon: "chart" }];
export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  const path = usePathname(); const state = { name: viewer?.displayName ?? "" };
  return <><a className="skip-link" href="#main">Đến nội dung chính</a><header className="site-header"><div className="header-inner"><Brand /><nav aria-label="Điều hướng chính">{links.map(link => <Link key={link.href} href={link.href} className={path === link.href || (link.href !== "/" && path.startsWith(link.href)) ? "active" : ""} aria-current={path === link.href ? "page" : undefined}><Icon name={link.icon} size={17} />{link.label}</Link>)}</nav><Link href={viewer ? "/account" : "/login"} className="account-link"><span className="avatar">{state.name ? state.name.charAt(0).toUpperCase() : <Icon name="user" size={16} />}</span><span>{state.name || "Đăng nhập"}</span><Icon name="chevron" size={14} /></Link></div></header></>;
}
export function SiteFooter() { return <footer className="site-footer"><div className="container footer-top"><div><Brand /></div><div><h3>Góc học tập</h3><Link href="/decks">Khám phá flashcard</Link><Link href="/quiz">Quiz từ vựng</Link><Link href="/tests">Bài kiểm tra tiếng Anh</Link></div><div><h3>Hành trình của bạn</h3><Link href="/dashboard">Tiến độ học tập</Link><Link href="/register">Tạo tài khoản</Link><Link href="/login">Đăng nhập</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} T-Rex Edu.</span></div></footer>; }
