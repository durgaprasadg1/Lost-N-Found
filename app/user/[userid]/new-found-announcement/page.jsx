"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function NewFoundAnnouncement() {
  const { user, mongoUser } = useAuth();
  const router = useRouter();
  const { userid } = useParams();

  useEffect(() => {
    if (!mongoUser || !userid) return;

    if (mongoUser._id !== userid) {
      router.push("/");
    }
  }, [mongoUser, userid, router]);

  const [form, setForm] = useState({
    itemName: "",
    description: "",
    foundAt: "",
    category: "Other",
    itemImage: null,
    phone: mongoUser?.phone || "",
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      alert("Only PNG and JPG images are allowed");
      return;
    }

    const options = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm({ ...form, itemImage: reader.result });
    };

    reader.readAsDataURL(compressedFile);
  }

  async function submit() {
    if (!user) return;

    const nameRegex = /^[A-Za-z0-9\s\-\.,]{2,100}$/;
    const descRegex = /^.{5,500}$/s;
    const placeRegex = /^[A-Za-z0-9\s\,\-\#]{3,200}$/;
    const imgRegex = /^data:image\/(png|jpeg|jpg);base64,/;
    const phoneRegex = /^[0-9\-\+\s\(\)]{7,15}$/;

    if (!form.itemName || !nameRegex.test(form.itemName)) {
      toast.error("Enter a valid item name (2-100 characters)");
      return;
    }
    if (!form.description || !descRegex.test(form.description)) {
      toast.error("Description must be 5-500 characters");
      return;
    }
    if (!form.foundAt || !placeRegex.test(form.foundAt)) {
      toast.error("Enter a valid 'Found At' location");
      return;
    }
    if (!phoneRegex.test(form.phone || "")) {
      toast.error("Enter a valid contact number in your profile");
      return;
    }
    const allowed = [
      "Electronics",
      "Books",
      "Documents",
      "Accessories",
      "Clothing",
      "Other",
    ];
    if (!allowed.includes(form.category)) {
      toast.error("Select a valid category");
      return;
    }
    if (form.itemImage && !imgRegex.test(form.itemImage)) {
      toast.error("Invalid image format");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken(true);

      const response = await fetch(
        `/api/user/${mongoUser._id}/new-found-announcement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit found item");
        return;
      }

      toast.success(
        "Found item announced listed successfully! , Please wait for admin approval."
      );
      router.refresh();
      router.push("/user/all-found-announcements");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit found item");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="">
        <Loader2 className="animate-spin text-3xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Report Found Item</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm">Item Name</label>
          <Input
            className="w-full border p-2 rounded-md"
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm">Description</label>
          <textarea
            className="w-full border p-2 rounded-md"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm">Found At</label>
          <Input
            className="w-full border p-2 rounded-md"
            value={form.foundAt}
            onChange={(e) => setForm({ ...form, foundAt: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm">Category</label>
          <Select
            value={form.category}
            onValueChange={(value) => setForm({ ...form, category: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Documents">Documents</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Phone</label>
          <Input
            className="w-full border p-2 rounded-md"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm">Item Image</label>
          <Input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImage}
            required
          />
        </div>

        {preview && (
          <img
            src={preview}
            className="w-40 h-40 rounded-md object-cover mt-2"
          />
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-stone-800 text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Found Item"
          )}
        </button>
      </div>
    </div>
  );
}
