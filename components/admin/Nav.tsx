"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export default function AdminNav({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Manage tournaments", href: "/admin" },
    { label: "Games", href: "/admin/games" },
    { label: "Settings", href: "#" },
  ]

  return (  
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and branding */}
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-cyan-400 font-semibold ring-1 ring-white/6">
                C
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-tight text-slate-50">Centaurus Admin</div>
                <div className="text-xs text-slate-400">Admin panel</div>
              </div>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href}>
                  <Button variant="ghost" className="text-sm font-medium text-slate-50 hover:text-cyan-400">
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5 text-slate-50" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-slate-900 text-slate-50">
                <nav className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-base text-slate-50 hover:text-cyan-400">
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
