import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "manager" | "support" | "sales";

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  avatar_url: string | null;
  is_active: boolean;
}

// Get current user's role
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    return profile?.role as UserRole | null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

// Get current user's full profile
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    return profile as UserProfile | null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Check if user has access to a specific page
export function hasAccessToPage(role: UserRole | null, pathname: string): boolean {
  if (!role) return false;

  // Admin has access to everything
  if (role === "admin") return true;

  // Sales role restrictions - only these pages
  if (role === "sales") {
    const salesAllowedPages = [
      "/admin/payment-links",
      "/admin/payment-submissions",
      "/admin/settings",
    ];

    return salesAllowedPages.some((page) => pathname.startsWith(page));
  }

  // Manager and support have access to everything except settings
  if (role === "manager" || role === "support") {
    return !pathname.startsWith("/admin/settings");
  }

  return false;
}

// Get accessible menu items based on role
export function getAccessibleMenuItems(role: UserRole | null) {
  if (!role) return [];

  const allMenuItems = [
    { name: "Dashboard", href: "/admin", roles: ["admin", "manager", "support"] },
    { name: "Experiences", href: "/admin/experiences", roles: ["admin", "manager", "support"] },
    { name: "Bookings", href: "/admin/bookings", roles: ["admin", "manager", "support"] },
    { name: "Payment Links", href: "/admin/payment-links", roles: ["admin", "manager", "support", "sales"] },
    { name: "Submissions", href: "/admin/payment-submissions", roles: ["admin", "manager", "support", "sales"] },
    { name: "Users", href: "/admin/users", roles: ["admin", "manager", "support"] },
    { name: "Team", href: "/admin/staff", roles: ["admin"] },
    { name: "Settings", href: "/admin/settings", roles: ["admin", "sales"] },
  ];

  return allMenuItems.filter((item) => item.roles.includes(role));
}
