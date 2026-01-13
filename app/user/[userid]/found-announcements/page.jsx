"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import UnauthorizedBox from "../../../Components/Others/UnAuthorised";
import StatBox from "../../../Components/Others/StatBox";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function MyFoundAnnouncements({ params }) {
  const { userid } = useParams();
  const { user, mongoUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!mongoUser || !userid) return;

    if (mongoUser._id !== userid) {
      router.push("/");
    }
  }, [mongoUser, userid, router]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadFound = async () => {
      try {
        const token = await user.getIdToken(true);
        const res = await fetch(`/api/user/${userid}/found-announcements`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          toast.error("Unauthorized. Please login again.");
          setItems([]);
          return;
        }
        if (!res.ok) {
          toast.error("Failed to load lost requests");
          setItems([]);
          return;
        }
        const data = await res.json();
        // console.log("Datadata", data);
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to load lost requests:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadFound();
  }, [user, userid]);

  if (!user) return <UnauthorizedBox />;
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-gray-800 mx-auto mt-20" />
      </div>
    );
  const total = items?.length;
  const pending = items?.filter((i) => !i.isResolved).length;
  const returned = items?.filter((i) => i.isResolved).length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-semibold">My Found Announcements</h1>
      <p className="text-gray-600 mb-8">
        View and manage your found item announcements
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatBox label="Total" value={total} color="bg-stone-100" />
        <StatBox label="Pending" value={pending} color="bg-yellow-50" />
        <StatBox label="Returned" value={returned} color="bg-green-50" />
      </div>

      {total === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 border rounded-xl bg-white"
        >
          <h2 className="text-lg font-medium text-gray-700">
            No found announcements yet
          </h2>
          <p className="text-gray-500 mt-1">
            You haven't reported any found items
          </p>

          <Link
            href={`/user/${userid}/new-found-announcement`}
            className="mt-6 bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-black"
          >
            Report Found Item
          </Link>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 border rounded-xl bg-white shadow-sm flex gap-4"
            >
              <Image
                src={item.itemImage?.url}
                height={96}
                width={96}
                alt="placeholder.png"
                className="w-24 h-24 rounded-md object-cover"
              />

              <div>
                <h3 className="text-lg font-semibold">{item.itemName}</h3>
                <p className="text-gray-600">
                  Found at: {item.foundAt || "N/A"}
                </p>

                <span
                  className={`inline-block mt-2 px-3 py-1 text-sm rounded-md ${
                    item.isResolved
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.isResolved ? "Returned to Owner" : "Pending Claim"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
