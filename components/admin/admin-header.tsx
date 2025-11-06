"use client"

import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminHeader() {
  const { admin, signOut } = useAdmin()
  const router = useRouter()

  const handleSignOut = () => {
    signOut()
    router.push("/admin/login")
  }

  if (!admin) return null

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {admin.name}</h2>
        <p className="text-sm text-muted-foreground capitalize">{admin.role} Account</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-coral-500 text-white">
                {admin.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{admin.name}</p>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
