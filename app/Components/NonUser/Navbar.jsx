"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Menu, UserIcon } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/actions/logout";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, mongoUser } = useAuth();

  const isActive = (path) =>
    pathname === path
      ? "font-semibold text-black px-2 py-1  bg-gray-200 rounded-sm"
      : "font-bold text-gray-700 hover:text-black";

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <nav className="w-full bg-gray-100 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          <Image src="/Log.png" width={60} height={40} alt="Logo" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/how-to-use" className={isActive("/how-to-use")}>
            How to Use
          </Link>
          <Link
            href="/terms-and-conditions"
            className={isActive("/terms-and-conditions")}
          >
            Terms & Conditions
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="outline">
                  <LogIn className="mr-1" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gray-800 text-white hover:bg-black">
                  Register
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href={`/user/${mongoUser?._id}`}>
                <Button variant="outline">
                  <UserIcon className="mr-1" />
                  {mongoUser?.name?.split(" ")[0] || "Profile"}
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                className="bg-gray-800 text-white hover:bg-black"
              >
                <LogOut className="mr-1" />
                Logout
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger>
              <Menu size={26} />
            </SheetTrigger>

            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6 text-lg">
                <Link href="/how-to-use" className={isActive("/how-to-use")}>
                  How to Use
                </Link>
                <Link
                  href="/terms-and-conditions"
                  className={isActive("/terms-and-conditions")}
                >
                  Terms & Conditions
                </Link>
              </div>

              <div className="mt-10 flex flex-col gap-4">
                {!user ? (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full bg-gray-800 text-white hover:bg-black">
                        Register
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={`/user/${mongoUser?._id}`}>
                      <Button variant="outline" className="w-full">
                        {mongoUser?.name?.split(" ")[0] || "Profile"}
                      </Button>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      className="w-full bg-gray-800 text-white hover:bg-black"
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
