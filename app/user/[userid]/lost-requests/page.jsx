"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import UnauthorizedBox from "../../../Components/Others/UnAuthorised";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import StatBox from "../../../Components/Others/StatBox";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MyLostRequests() {
  const { userid } = useParams();
  const { user, mongoUser, refreshMongoUser } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingItemId, setResolvingItemId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!mongoUser || !userid) return;

    if (mongoUser._id !== userid) {
      router.push("/");
    }
  }, [mongoUser, userid, router]);

  const loadLostRequests = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/user/${userid}/lost-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error("Failed to load lost requests");
        setItems([]);
        return;
      }

      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast.error("Failed to load lost requests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, userid]);

  useEffect(() => {
    loadLostRequests();
  }, [loadLostRequests, refreshTick]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((p) => p + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const runAction = async () => {
    const { itemId, type } = confirmAction;
    try {
      setResolvingItemId(itemId);
      const token = await user.getIdToken();

      const endpoint =
        type === "resolved"
          ? `/api/items/${itemId}/resolved`
          : `/api/items/${itemId}/not-got-item`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error("Action failed");
        return;
      }

      toast.success(
        type === "resolved" ? "Marked as resolved" : "Marked as still lost"
      );

      refreshMongoUser();
      setRefreshTick((p) => p + 1);
    } catch {
      toast.error("Action failed");
    } finally {
      setResolvingItemId(null);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!user) return <UnauthorizedBox />;

  const total = items.length;
  const pending = items.filter((i) => !i.isResolved).length;
  const found = items.filter((i) => i.isFound).length;
  const resolved = items.filter((i) => i.isResolved).length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-semibold">My Lost Requests</h1>
      <p className="text-gray-600 mb-8">
        Track and manage your reported lost items
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatBox label="Total" value={total} color="bg-stone-100" />
        <StatBox
          label="Pending ( Not Resolved )"
          value={pending}
          color="bg-yellow-50"
        />
        <StatBox label="Found" value={found} color="bg-blue-50" />
        <StatBox label="Resolved" value={resolved} color="bg-green-50" />
      </div>

      {total === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 border rounded-xl bg-white"
        >
          <h2 className="text-lg font-medium text-gray-700">
            No lost requests yet
          </h2>
          <p className="text-gray-500 mt-1">Start by reporting a lost item</p>

          <Link
            href={`/user/${userid}/new-lost-request`}
            className="mt-6 bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-black"
          >
            Report Lost Item
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
                src={item.itemImage?.url || "/placeholder.png"}
                height={96}
                width={96}
                alt={item.itemName}
                className="w-24 h-24 rounded-md object-cover"
              />

              <div className="flex-1">
                <h3 className="text-lg font-semibold">{item.itemName}</h3>
                <p className="text-gray-600 text-sm">
                  Lost at: {item.lostAt || "N/A"}
                </p>

                <span
                  className={`inline-block mt-2 px-3 py-1 text-sm rounded-md ${
                    item.isResolved
                      ? "bg-green-100 text-green-700"
                      : item.isFound
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.isResolved
                    ? "Resolved"
                    : item.isFound
                    ? "Found"
                    : "Pending"}
                </span>

                <div className="mt-4 flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !item.isFound ||
                      item.isResolved ||
                      resolvingItemId === item._id
                    }
                    onClick={() =>
                      setConfirmAction({
                        itemId: item._id,
                        type: "not-got",
                      })
                    }
                  >
                    Still Not Received
                  </Button>

                  <Button
                    size="sm"
                    className="bg-green-600 text-white"
                    disabled={
                      !item.isFound ||
                      item.isResolved ||
                      resolvingItemId === item._id
                    }
                    onClick={() =>
                      setConfirmAction({
                        itemId: item._id,
                        type: "resolved",
                      })
                    }
                  >
                    {resolvingItemId === item._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Mark as Resolved"
                    )}
                  </Button>
                </div>

                {!item.isFound && (
                  <p className="text-xs text-gray-500 mt-2">
                    Waiting for someone to mark this item as found
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            {confirmAction?.type === "resolved"
              ? "Confirm that you have received this item."
              : "Confirm that you have not received this item yet."}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button onClick={runAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
