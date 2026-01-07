import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import {
  shouldResetMonthlyLimits,
  shouldResetDailyLimit,
  resetMonthlyLimits,
  resetDailyLimit,
  getUserLimitStatus,
} from "@/lib/limitHelpers";

export async function GET(req) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check and reset limits if needed
    if (shouldResetMonthlyLimits(user)) {
      await resetMonthlyLimits(user);
    }

    if (shouldResetDailyLimit(user)) {
      await resetDailyLimit(user);
    }

    // Get current limit status
    const limitStatus = getUserLimitStatus(user);

    return NextResponse.json({
      success: true,
      limits: limitStatus,
    });
  } catch (error) {
    console.error("Error fetching limit status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
