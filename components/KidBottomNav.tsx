"use client";

import { useRouter, usePathname } from "next/navigation";
import "./kidBottomNav.css";

export default function KidBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    {
      key: "home",
      label: "Home",
      path: "/kid/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" className="kid-bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M9 20v-6h6v6" />
        </svg>
      ),
    },
    {
      key: "learn",
      label: "Learn",
      path: "/kid/modules",
      icon: (
        <svg viewBox="0 0 24 24" className="kid-bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v18H5.5A2.5 2.5 0 0 0 3 23z" />
          <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v18h5.5A2.5 2.5 0 0 1 21 23z" />
        </svg>
      ),
    },
    {
      key: "shop",
      label: "Shop",
      path: "/kid/shop",
      icon: (
        <svg viewBox="0 0 24 24" className="kid-bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L23 7H7" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="kid-bottom-nav" aria-label="Kid navigation">
      {items.map((item) => {
        const isActive =
          item.path === "/kid/modules"
            ? pathname.startsWith("/kid/modules")
            : pathname === item.path;

        return (
          <button
            key={item.key}
            type="button"
            className={`kid-bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => router.push(item.path)}
          >
            {item.icon}
            <span className="kid-bottom-nav-indicator" />
          </button>
        );
      })}
    </nav>
  );
}