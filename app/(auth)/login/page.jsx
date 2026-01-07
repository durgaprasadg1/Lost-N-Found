"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/login";
import { googleSignin } from "@/actions/googleSignin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import Navbar from "@/app/Components/NonUser/Navbar";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user, mongoUser } = useAuth();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Enter a valid email address");
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Check if admin is logged in
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      router.replace("/admin");
      return;
    }

    // Check if user is logged in
    if (user && mongoUser) {
      router.replace("/user/" + mongoUser._id);
    }
  }, [user, mongoUser, router]);

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 border rounded-xl shadow">
          <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={18} />
                ) : (
                  <AiOutlineEye size={18} />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-700 text-white hover:bg-black"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="my-2 text-center text-gray-500">OR</div>

          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await googleSignin();
              } catch {
                toast.error("Google sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 
              border border-gray-300 rounded-lg py-2.5 
              bg-white text-black 
              hover:bg-stone-800 hover:text-white"
          >
            <FcGoogle />
            Sign In with Google
          </Button>

          <p className="mt-6 text-center text-sm text-gray-600">
            New user?{" "}
            <a href="/register" className="text-blue-600">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
