"use client"

import Link from "next/link"
import { Camera, ShoppingBag, LogOut, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTrip } from "@/components/trip-context"
import { useAuth } from "@/components/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const { tripItems } = useTrip()
  const { user, isAuthenticated, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <Camera className="h-5 w-5 text-foreground" />
          <span className="font-serif text-xl font-normal tracking-wide">The Wandering Lens</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/destinations" className="text-sm font-medium transition-colors hover:text-foreground/60">
            Destinations
          </Link>
          <Link href="/experiences" className="text-sm font-medium transition-colors hover:text-foreground/60">
            Experiences
          </Link>
          <Link href="/my-trip" className="text-sm font-medium transition-colors hover:text-foreground/60">
            My Trip
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/my-trip">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingBag className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">My Trip</span>
              {tripItems.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-semibold">
                  {tripItems.length}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-foreground text-background">
                      {user?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/membership" className="cursor-pointer">
                    <Award className="mr-2 h-4 w-4" />
                    Membership
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-trip" className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    My Trip
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
