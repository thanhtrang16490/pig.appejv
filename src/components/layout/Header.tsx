"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Store, LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Get initials for avatar
  const getInitials = (email: string) => {
    const name = email.split("@")[0];
    return name.substring(0, 2).toUpperCase();
  };

  const displayEmail = user?.email && user.email.length > 20
    ? user.email.substring(0, 17) + "..."
    : user?.email;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="mx-auto max-w-lg lg:max-w-4xl xl:max-w-6xl">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: App title with icon */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg">
              <Store className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">Pig Appejv</span>
          </div>

          {/* Right: Avatar + email + logout */}
          {!loading && user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-7 h-7 bg-emerald-600 rounded-full flex-shrink-0">
                  <span className="text-xs font-bold text-white leading-none">
                    {user.email ? getInitials(user.email) : "U"}
                  </span>
                </div>
                <span className="text-sm text-gray-700 max-w-[100px] sm:max-w-[180px] truncate">{displayEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
