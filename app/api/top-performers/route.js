import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import { cacheKeys, CACHE_TTL } from "@/lib/cacheKeys";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cacheKey = cacheKeys.topPerformers();
    const cached = await getJsonCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await dbConnect();

    const users = await User.find()
      .select("name role email phone profilePicture itemsReturned department")
      .sort({ itemsReturned: -1 })
      .lean();

    const performers = users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone,
      department: u.department,
      profilePicture: u.profilePicture?.url || "",
      itemsReturned: u.itemsReturned || 0,
    }));

    const payload = { success: true, performers };
    await setJsonCache(cacheKey, payload, CACHE_TTL.TOP_PERFORMERS);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET PERFORMERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
