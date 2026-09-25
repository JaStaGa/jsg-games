"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./site-header.module.css";

export function SiteNavigation({ brand, children }: {
  brand: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState({ pathname, open: false });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const open = state.pathname === pathname && state.open;

  // Reset without remounting the account controls (and their auth subscription).
  if (state.pathname !== pathname) {
    setState({ pathname, open: false });
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setState({ pathname, open: false });
      if (trigger.current?.getClientRects().length) {
        event.preventDefault();
        trigger.current.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pathname]);

  useEffect(() => {
    // Only recover focus when navigation leaves it in the now-hidden panel.
    // Otherwise preserve Next's normal focus on the destination page.
    if (!open && panel.current?.contains(document.activeElement) &&
        trigger.current?.getClientRects().length) {
      trigger.current.focus();
    }
  }, [open]);

  return (
    <div className={styles.inner}>
      {brand}
      <button ref={trigger} className={styles.menuButton} type="button"
        aria-expanded={open} aria-controls={panelId}
        onClick={() => setState({ pathname, open: !open })}>
        Menu
      </button>
      <div ref={panel} id={panelId} className={styles.headerActions} data-open={open}>
        {children}
      </div>
    </div>
  );
}
