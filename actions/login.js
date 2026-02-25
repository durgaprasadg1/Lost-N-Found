import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "react-toastify";
import { getAuthErrorMessage } from "@/lib/authErrors";

export async function login(email, password) {
  try {
    // First, check if this is an admin login (admins use different auth)
    const adminCheckRes = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (adminCheckRes.ok) {
      const adminData = await adminCheckRes.json();
      // Store admin session
      localStorage.setItem("adminSession", JSON.stringify(adminData.admin));
      toast.success("Admin logged in successfully");

      // Redirect to admin page
      window.location.href = "/admin";
      return adminData;
    }

    // If not admin, proceed with regular Firebase user login
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();

    const res = await fetch("/api/auth/sync", {
      method: "POST",
      body: JSON.stringify({ idToken: token }),
    });

    const data = await res.json();

    if (!res.ok || !data.user) {
      await signOut(auth);
      toast.error("Account not registered. Please register before logging in.");
      console.log(data?.error || "User not registered");
      return;
    }

    toast.success("Logged in successfully");
    window.location.href = "/";
    return data;
  } catch (err) {
    const errorMessage = getAuthErrorMessage(err);
    toast.error( "Login failed");
    console.log("Signin error", errorMessage);
    return;
  }
}
