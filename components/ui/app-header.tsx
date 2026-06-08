"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== "/" && pathname.startsWith(href))
  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        active ? "font-medium text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-semibold">Lab Orders Lite</Link>
          <nav className="flex items-center gap-4">
            <NavLink href="/">Patients</NavLink>
            <NavLink href="/orders">Orders</NavLink>
          </nav>
        </div>
        {right}
      </div>
    </header>
  )
}
