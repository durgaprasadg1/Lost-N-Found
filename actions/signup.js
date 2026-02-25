import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "react-toastify";
import { getAuthErrorMessage } from "@/lib/authErrors";

export async function signup(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();

    const res = await fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token, create: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      try {
        await signOut(auth);
      } catch {}
      toast.error("Signup failed");
      console.log(data?.error || "Signup failed");
    }

    toast.success("Account created successfully");
    return data;
  } catch (err) {
    const errorMessage = getAuthErrorMessage(err);
    console.log(errorMessage)
    toast.error("Something went wrong. Try again later.");
    return;
  }
}
