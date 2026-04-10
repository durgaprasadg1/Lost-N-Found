import Item from "@/model/item";
import dbConnect from "@/lib/dbConnect";
import { cacheKeys, CACHE_TTL } from "@/lib/cacheKeys";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cacheKey = cacheKeys.allLostItems();
    const cached = await getJsonCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await dbConnect();

    const items = await Item
      .find({ isLost: true })
      .sort({ reportedAt: -1 })
      .populate("postedBy");

    const payload = { success: true, items };
    await setJsonCache(cacheKey, payload, CACHE_TTL.ALL_LOST_ITEMS);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET LOST ITEMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
