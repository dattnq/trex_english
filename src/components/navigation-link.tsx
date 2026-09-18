"use client";

import Link, { useLinkStatus } from "next/link";
import { useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";

function NavigationFeedback() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return createPortal(<span className="navigation-feedback" role="status">
    <span className="sr-only">Đang chuyển trang…</span>
  </span>, document.body);
}

// Prefetch the full destination only after intent, not every card in a list.
export default function NavigationLink({ children, prefetch, onMouseEnter, onFocus, onPointerDown, ...props }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  return <Link {...props} prefetch={prefetch ?? (intent ? true : null)}
    onMouseEnter={event => { setIntent(true); onMouseEnter?.(event); }}
    onFocus={event => { setIntent(true); onFocus?.(event); }}
    onPointerDown={event => { setIntent(true); onPointerDown?.(event); }}>
    {children}<NavigationFeedback />
  </Link>;
}
