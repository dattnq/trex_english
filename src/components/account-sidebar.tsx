"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Viewer } from "@/lib/auth-types";
import { LogoutButton } from "./auth-fields";
import { Icon } from "./ui";
import "./account-sidebar.css";

export function AccountSidebar({ viewer, path }: { viewer: Viewer; path: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const initial = viewer.displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    const previousOverflow = document.body.style.overflow;
    panel?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      panel?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const items = [
    { href: "/account", label: "Thông tin cá nhân", icon: "user" },
    { href: "/dashboard", label: "Tiến độ học tập", icon: "chart" },
    { href: "/history", label: "Lịch sử làm bài", icon: "clock" },
    { href: "/decks", label: "Bộ từ vựng", icon: "cards" },
    ...(viewer.role === "ADMIN" ? [{ href: "/admin", label: "Trang quản trị", icon: "settings" }] : []),
  ];

  return <>
    <button type="button" className="account-link account-trigger" onClick={() => setOpen(true)}
      aria-haspopup="dialog" aria-expanded={open} aria-controls="account-sidebar" aria-label={`Mở menu tài khoản của ${viewer.displayName}`}>
      <span className="avatar">{initial}</span><span>{viewer.displayName}</span><Icon name="chevron" size={14} />
    </button>
    <dialog ref={dialog} id="account-sidebar" className="account-drawer" aria-labelledby="account-sidebar-title"
      onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
      }}>
      <div className="account-drawer-content">
        <div className="account-drawer-heading">
          <h2 id="account-sidebar-title">Tài khoản của bạn</h2>
          <button type="button" className="icon-button" aria-label="Đóng menu tài khoản" onClick={() => setOpen(false)} autoFocus><Icon name="close" /></button>
        </div>
        <div className="account-drawer-profile">
          <span className="avatar">{initial}</span>
          <div><strong>{viewer.displayName}</strong><p>{viewer.email}</p><span className="account-drawer-role">{viewer.role === "ADMIN" ? "Quản trị viên" : "Người học"}</span></div>
        </div>
        <nav className="account-drawer-nav" aria-label="Menu tài khoản">
          {items.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={path === item.href ? "page" : undefined}>
            <Icon name={item.icon} size={20} /><span>{item.label}</span><Icon name="chevron" size={15} />
          </Link>)}
        </nav>
        <div className="account-drawer-footer"><LogoutButton /></div>
      </div>
    </dialog>
  </>;
}
