"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "../Components/Others/Navbar";
import AccountBlockedBox from "../Components/Others/AccountBlockedBox";

export default function UserLayout({ children }) {
  const { user, admin, mongoUser, loading } = useAuth();
  const router = useRouter();

  if (!loading && mongoUser?.isBlocked) {
    return <AccountBlockedBox />;
  }

  useEffect(() => {
    if (loading) return;

    const adminSession = localStorage.getItem("adminSession");

    // If admin is logged in, redirect to admin dashboard
    if (adminSession) {
      router.push("/admin");
      return;
    }

    // If no user is logged in, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, admin, router, loading]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
