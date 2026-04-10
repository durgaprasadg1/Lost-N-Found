import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import Admin from "@/model/admin";
import { adminAuth } from "@/lib/firebaseAdmin";
import { cacheKeys, CACHE_TTL } from "@/lib/cacheKeys";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { idToken, create } = await req.json();

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email;
    const name = decoded.name || email.split("@")[0];
    const cacheKey = cacheKeys.userProfile(email);

    const cachedUser = await getJsonCache(cacheKey);
    if (cachedUser) {
      return NextResponse.json({ user: cachedUser });
    }

    await dbConnect();

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "This email is registered as admin. Please use admin login." },
        { status: 403 }
      );
    }

    let user = await User.findOne({ email });
    if (!user) {
      if (create) {
        const now = new Date();
        user = await User.create({
          name,
          email,
          phone: "",
          role: "student",
          department: "Other",
          items: [],
          itemsReturned: 0,
          totalLostRequests: 0,
          monthlyLostRequestsCount: 0,
          monthlyFoundAnnouncementsCount: 0,
          lastMonthlyReset: now,
          dailyMarkFoundCount: 0,
          lastDailyReset: now,
          notification: [],
          isBlocked: false,
          isUser: true,
          token: decoded.user_id,
          profilePicture: {
            url: decoded.picture || "",
            filename: "",
          },
        });
      } else {
        return NextResponse.json(
          { error: "User not registered" },
          { status: 403 }
        );
      }
    }

    await setJsonCache(cacheKey, user, CACHE_TTL.USER_PROFILE);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
