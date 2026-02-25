"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BellIcon, LogIn, LogOut, Menu, UserIcon } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/actions/logout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, mongoUser, refreshMongoUser } = useAuth();

  const [notifyOpen, setNotifyOpen] = useState(false);
  const mongoUserId = mongoUser?._id;

  const isActive = (path) =>
    pathname === path
      ? "bg-gray-200 text-black px-3 py-1 rounded-md"
      : "hover:bg-gray-100 px-3 py-1 rounded-md";

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshMongoUser();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, refreshMongoUser]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function updateNotifications(newNotifications) {
    if (!user || !mongoUser) return;
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/user/${mongoUser._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification: newNotifications }),
      });

      if (!res.ok) {
        toast.error("Failed to update notifications");
        return;
      }
      await refreshMongoUser();
    } catch {
      toast.error("Failed to update notifications");
    }
  }

  async function deleteNotificationAt(revIndex) {
    if (!mongoUser?.notification?.length) return;
    const originalIndex = mongoUser.notification.length - 1 - revIndex;
    const updated = [...mongoUser.notification];
    updated.splice(originalIndex, 1);
    await updateNotifications(updated);
  }

  async function clearNotifications() {
    await updateNotifications([]);
  }

  return (
    <nav className="w-full border-b bg-white">
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">
            Notifications
          </DialogTitle>

          <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
            {mongoUser?.notification?.length > 0 ? (
              [...mongoUser.notification].reverse().map((msg, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 p-3 rounded-md border bg-gray-50 text-sm text-gray-800"
                >
                  <div className="flex-1">{msg}</div>
                  <Button
                    variant="ghost"
                    onClick={() => deleteNotificationAt(index)}
                    className="text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 text-sm">
                No notifications yet
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={clearNotifications}
              disabled={!mongoUser?.notification?.length}
            >
              Clear All
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl">
          <Image src="/Log.png" width={60} height={40} alt="Logo" />
        </Link>

        <div className="hidden md:flex flex-1 justify-center gap-8 font-medium text-gray-700">
          <Link href="/" className={isActive("/")}>
            Home
          </Link>
          <Link
            href="/user/all-lost-requests"
            className={isActive("/all-lost-requests")}
          >
            All Lost Items
          </Link>
          <Link
            href="/user/all-found-announcements"
            className={isActive("/all-found-announcements")}
          >
            All Found Items
          </Link>
          <Link
            href="/user/top-performers"
            className={isActive("/top-performers")}
          >
            Top Performers
          </Link>
        </div>

        <div className="hidden md:flex gap-4">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="outline">
                  <LogIn /> Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gray-700 text-white hover:bg-black">
                  Register
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative">
                <BellIcon
                  className="cursor-pointer"
                  onClick={() => setNotifyOpen(true)}
                />
                {mongoUser?.notification?.length > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center">
                    {mongoUser.notification.length}
                  </span>
                )}
              </div>

              {mongoUser && (
                <Link href={`/user/${mongoUserId}`}>
                  <Button variant="outline">
                    <UserIcon />
                    {user?.displayName?.split(" ")[0] || "Profile"}
                  </Button>
                </Link>
              )}

              <Button
                onClick={handleLogout}
                className="bg-stone-800 text-white"
              >
                <LogOut /> Logout
              </Button>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger>
              <Menu size={28} />
            </SheetTrigger>

            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6 text-lg font-medium">
                <Link href="/" className={isActive("/")}>
                  Home
                </Link>
                <Link
                  href="/user/all-lost-requests"
                  className={isActive("/all-lost-requests")}
                >
                  All Lost Items
                </Link>
                <Link
                  href="/user/all-found-announcements"
                  className={isActive("/all-found-announcements")}
                >
                  All Found Items
                </Link>
                <Link
                  href="/user/top-performers"
                  className={isActive("/top-performers")}
                >
                  Top Performers
                </Link>
              </div>

              <div className="mt-10 flex flex-col gap-4">
                {!user ? (
                  <>
                    <Link href="/login">
                      <Button variant="outline">Login</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="bg-gray-700 text-white">
                        Register
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-around">
                      <BellIcon
                        className="cursor-pointer"
                        onClick={() => setNotifyOpen(true)}
                      />
                      <Link href={`/user/${mongoUserId}`}>
                        <Button variant="outline">
                          {mongoUser?.name?.split(" ")[0] || "Profile"}
                        </Button>
                      </Link>
                    </div>

                    <Button
                      onClick={handleLogout}
                      className="bg-stone-800 text-white"
                    >
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
