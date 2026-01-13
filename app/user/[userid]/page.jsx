"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import EditProfileModal from "../../Components/User/EditProfileModal";
import { motion } from "framer-motion";
import StatCard from "../../Components/User/StatCard";
import QuickActions from "../../Components/User/QuickActions";
import AchievementBanner from "../../Components/User/AchievementBanner";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, mongoUser, refreshMongoUser } = useAuth();
  const { userid } = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Authorization check: prevent users from accessing other users' profiles
  useEffect(() => {
    if (!mongoUser || !userid) return;

    if (mongoUser._id !== userid) {
      router.push("/");
    }
  }, [mongoUser, userid, router]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshMongoUser();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, refreshMongoUser]);

  if (!user || !mongoUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-gray-800" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-stone-800 text-white rounded-xl p-8 flex gap-6"
      >
        <Image
          src={
            mongoUser.profilePicture?.url ||
            user.photoURL ||
            "/default-user.png"
          }
          alt="Profile"
          width={80}
          height={80}
          className="rounded-full border border-white"
        />

        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-semibold">{mongoUser.name}</h2>
          <p className="text-sm opacity-90">{mongoUser.email}</p>
          <p className="capitalize text-sm mt-1">{mongoUser.role}</p>
          <p className="capitalize text-sm">{mongoUser.phone}</p>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setOpen(true)}
          className="bg-white text-stone-800 px-4 py-2 rounded-md font-medium hover:bg-gray-200"
        >
          Edit Profile
        </button>
      </motion.div>

      {mongoUser.bio && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center text-gray-700 italic bg-stone-200 py-3 rounded-2xl"
        >
          {mongoUser.bio}
        </motion.p>
      )}

      <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mt-10">
        <StatCard
          title="Lost Requests"
          value={mongoUser.totalLostRequests || 0}
        />
        <StatCard
          title="Found Announcements"
          value={mongoUser.itemsReturned || 0}
        />
      </div>

      <QuickActions mongoUser={mongoUser} />
      <AchievementBanner count={mongoUser.itemsReturned} />

      {open && (
        <EditProfileModal open={open} setOpen={setOpen} mongoUser={mongoUser} />
      )}
    </div>
  );
}
