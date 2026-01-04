"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import LostFoundButtons from "@/app/Components/Others/LostFoundButtons";

export default function AllLostRequests() {
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingFoundId, setMarkingFoundId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [search, setSearch] = useState("");
  const [confirmItemId, setConfirmItemId] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const { user, mongoUser, refreshMongoUser } = useAuth();

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items/lost");
      const data = await res.json();
      setLostItems(data.items || []);
    } catch {
      toast.error("Failed to load lost items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshTick]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((p) => p + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const visibleBase = useMemo(
    () => lostItems.filter((i) => i.isVerified && !i.isResolved && !i.isFound ),
    [lostItems]
  );

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleBase;
    return visibleBase.filter(
      (i) =>
        i.itemName?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
    );
  }, [visibleBase, search]);

  const handleMarkFound = (itemId) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    if (mongoUser?.phone == null || mongoUser?.phone === "") {
      setShowProfileDialog(true);
      return;
    }
    setConfirmItemId(itemId);
  };

  const confirmMarkFound = async () => {
    try {
      setMarkingFoundId(confirmItemId);
      const token = await user.getIdToken();
      const res = await fetch(`/api/items/${confirmItemId}/found`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("mark found failed:", data);
        toast.error("Something went wrong");
        return;
      }

      toast.success("Item marked as found");
      refreshMongoUser();
      setRefreshTick((p) => p + 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark item as found");
    } finally {
      setMarkingFoundId(null);
      setConfirmItemId(null);
    }
  };

  return (
    <>
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogTitle>Profile Incomplete</DialogTitle>
          <p className="text-sm">
            Please update your phone number in your profile before continuing.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmItemId}
        onOpenChange={() => setConfirmItemId(null)}
      >
        <DialogContent>
          <DialogTitle>Confirm Action</DialogTitle>
          <p className="text-sm">
            Your contact details will be shared with the owner. Continue?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmItemId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmMarkFound}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-4 flex flex-col items-center gap-4">
        <div className="w-full max-w-2xl">
          <Input
            placeholder="Search by item name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <LostFoundButtons />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!loading && visibleItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 border rounded-xl bg-white"
          >
            <h2 className="text-lg font-medium text-gray-700">
              No lost requests yet
            </h2>
            <p className="text-gray-500 mt-1">
              Start by reporting a lost item or check back later.
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-8">
            {visibleItems.map((item) => (
              
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="h-52 bg-gray-100 rounded mb-4 overflow-hidden">
                      <Image
                        src={item.itemImage?.url || "/placeholder.png"}
                        alt={item.itemName}
                        width={400}
                        height={400}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <h2 className="text-xl font-semibold">{item.itemName}</h2>
                    <Badge className="mt-1">{item.category}</Badge>

                    <p className="text-gray-600 text-sm mt-3 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      {user && mongoUser && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full sm:w-1/2 bg-stone-900 text-white">
                              Contact Owner
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogTitle>{item.postedBy?.name}</DialogTitle>
                            <p className="text-sm">
                              Phone: {item.postedBy?.phone}
                            </p>
                            <p className="text-sm">
                              Email: {item.postedBy?.email}
                            </p>

                            <div className="h-52 bg-gray-100 rounded mt-4 overflow-hidden">
                              <Image
                                src={
                                  item.postedBy?.profilePicture?.url ||
                                  "/placeholder.png"
                                }
                                alt="Owner"
                                width={400}
                                height={400}
                                className="object-cover w-full h-full"
                              />
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        className="w-full sm:w-1/2 bg-green-600 text-white"
                        disabled={markingFoundId === item._id}
                        onClick={() => handleMarkFound(item._id)}
                      >
                        {markingFoundId === item._id
                          ? "Processing..."
                          : "Mark Found"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
