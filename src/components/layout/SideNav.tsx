"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Home" },
  { href: "/calendar", icon: "📅", label: "Calendar" },
  { href: "/chores", icon: "✅", label: "Chores" },
  { href: "/meals", icon: "🍽️", label: "Meals" },
  { href: "/home-controls", icon: "💡", label: "Smart Home" },
  { href: "/messages", icon: "📌", label: "Messages" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-1 py-4 px-2 bg-slate-900 border-r border-slate-800 w-16 h-full select-none">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center w-12 h-14 rounded-xl text-xl
              transition-all duration-150 touch-manipulation
              ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700"
              }
            `}
            title={item.label}
            aria-label={item.label}
          >
            <span>{item.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
