"use client";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      try {
        setAdmin(JSON.parse(adminSession));
      } catch (e) {
        localStorage.removeItem("adminSession");
      }
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setMongoUser(null);
        setLoading(false);
        return;
      }

      setUser(u);

      const token = await u.getIdToken();
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token }),
      });

      if (res.ok) {
        const data = await res.json();
        setMongoUser(data.user);
      } else {
        console.log("Auth sync failed:", res.status);
        setMongoUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function refreshMongoUser() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMongoUser(data.user);
      } else {
        console.error("refreshMongoUser failed:", res.status);
      }
    } catch (err) {
      console.error("refreshMongoUser error", err);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, mongoUser, admin, refreshMongoUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
