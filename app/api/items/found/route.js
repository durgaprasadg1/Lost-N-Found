import Item from "@/model/item";
import dbConnect from "@/lib/dbConnect";
import { cacheKeys, CACHE_TTL } from "@/lib/cacheKeys";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cacheKey = cacheKeys.allFoundItems();
    const cached = await getJsonCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await dbConnect();

    const items = await Item
      .find({ isFound: true })
      .sort({ reportedAt: -1 });

    const payload = { success: true, items };
    await setJsonCache(cacheKey, payload, CACHE_TTL.ALL_FOUND_ITEMS);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET FOUND ITEMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
