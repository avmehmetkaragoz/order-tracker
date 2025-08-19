"use client"

import { usePathname } from "next/navigation"
import { Home, Package, Warehouse, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function HeaderNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Ana Sayfa",
      isActive: pathname === "/",
    },
    {
      href: "/orders",
      icon: Package,
      label: "Siparişler",
      isActive: pathname.startsWith("/orders"),
    },
    {
      href: "/warehouse",
      icon: Warehouse,
      label: "Depo",
      isActive: pathname.startsWith("/warehouse"),
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Ayarlar",
      isActive: pathname.startsWith("/settings"),
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 sm:px-4">
        <nav className="flex items-center justify-between h-12 sm:h-14">
          <div className="flex items-center flex-shrink-0">
            <Button variant="ghost" size="sm" className="p-1 sm:p-2" onClick={() => (window.location.href = "/")}>
              <Image
                src="/images/company-logo.png"
                alt="DEKA"
                width={24}
                height={24}
                className="h-5 w-auto sm:h-6 md:h-8"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const fallbackText = target.nextElementSibling as HTMLElement
                  if (fallbackText) {
                    fallbackText.classList.remove("hidden")
                  }
                }}
              />
              <span className="hidden ml-1 sm:ml-2 text-xs sm:text-sm font-semibold">DEKA</span>
            </Button>
          </div>

          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant={item.isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-0.5 sm:gap-1 h-10 sm:h-12 px-2 sm:px-3 py-1",
                    item.isActive && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => (window.location.href = item.href)}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs font-medium leading-tight">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}
