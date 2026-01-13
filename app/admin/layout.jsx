"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/actions/logout";
import { useState, useEffect } from "react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

import AdminSidebar from "./../Components/Admins/Others/AdminSideBar";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { admin, user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(null);

  async function handleLogout() {
    localStorage.removeItem("adminSession");
    router.push("/login");
  }

  useEffect(() => {
    const adminSession = localStorage.getItem("adminSession");

    if (!adminSession) {
      setIsAuthorized(false);
      router.push("/");
      return;
    }

    if (user) {
      setIsAuthorized(false);
      router.push("/");
      return;
    }

    setIsAuthorized(true);
  }, [user, admin, router]);

  if (isAuthorized === null || isAuthorized === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-600">
      <aside className="hidden md:flex ">
        <AdminSidebar onLogout={handleLogout} />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-700 px-4 py-3 flex justify-between items-center z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost">
              <Menu className="text-white" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-64">
            <AdminSidebar
              onLogout={handleLogout}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 mt-14 md:mt-0 ">{children}</main>
    </div>
  );
}
