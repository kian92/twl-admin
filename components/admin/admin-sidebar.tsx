"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, MapPin, Calendar, Users, Award, FileText, Settings, Compass, UserPlus, Link2, Receipt, MessageSquare, BookOpen, Image } from "lucide-react"
import { useTranslations } from 'next-intl'

type UserRole = "admin" | "manager" | "support" | "sales" | "supplier";

interface MenuItem {
  nameKey: string;
  href: string;
  icon: any;
  roles: UserRole[];
}

const allMenuItems: MenuItem[] = [
  { nameKey: "dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin", "manager", "support"] },
  { nameKey: "experiences", href: "/admin/experiences", icon: MapPin, roles: ["admin", "manager", "support", "supplier"] },
  { nameKey: "bookings", href: "/admin/bookings", icon: Calendar, roles: ["admin", "manager", "support"] },
  { nameKey: "blog", href: "/admin/blog", icon: BookOpen, roles: ["admin", "manager"] },
  { nameKey: "media", href: "/admin/media", icon: Image, roles: ["admin", "manager"] },
  { nameKey: "testimonials", href: "/admin/testimonials", icon: MessageSquare, roles: ["admin", "manager", "support"] },
  { nameKey: "paymentLinks", href: "/admin/payment-links", icon: Link2, roles: ["admin", "manager", "support", "sales"] },
  { nameKey: "submissions", href: "/admin/payment-submissions", icon: Receipt, roles: ["admin", "manager", "support", "sales"] },
  { nameKey: "users", href: "/admin/users", icon: Users, roles: ["admin", "manager", "support"] },
  { nameKey: "team", href: "/admin/staff", icon: UserPlus, roles: ["admin"] },
  { nameKey: "settings", href: "/admin/settings", icon: Settings, roles: ["admin", "sales", "supplier"] },
];

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [navigation, setNavigation] = useState<MenuItem[]>([])

  useEffect(() => {
    // Fetch user role
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);

          // Filter menu items based on role
          const accessibleItems = allMenuItems.filter((item) =>
            item.roles.includes(data.role)
          );
          setNavigation(accessibleItems);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        // Fallback to showing all items
        setNavigation(allMenuItems);
      }
    };

    fetchUserRole();
  }, [])

  return (
    <div className="w-64 bg-card border-r flex flex-col">
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          {/* <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-coral-500 flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div> */}
          <div>
            <h1 className="font-bold text-lg">The Wandering Lens</h1>
            <p className="text-xs text-muted-foreground">{t('adminPortal')}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              {t(item.nameKey)}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Link
          href="https://www.twanderinglens.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Compass className="w-5 h-5" />
          {t('viewSite')}
        </Link>
      </div>
    </div>
  )
}
