import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { cacheKeys } from "@/lib/cacheKeys";
import { deleteCacheKeys } from "@/lib/redis";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const { userid } = await params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const user = await User.findById(userid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email !== decoded.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const nameRegex = /^[A-Za-z\s]{2,100}$/;
    const phoneRegex = /^[0-9+\-\s]{7,20}$/;
    const bioRegex = /^.{0,500}$/s;

    const allowedDeps = [
      "Computer Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Non-teaching Staff",
      "Teaching Staff",
      "Library Staff",
      "Other",
    ];

    const updates = {};

    if ("name" in body) {
      if (!body.name || !nameRegex.test(body.name)) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updates.name = body.name;
    }

    if ("phone" in body) {
      if (body.phone && !phoneRegex.test(body.phone)) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }
      updates.phone = body.phone || "";
    }

    if ("department" in body) {
      if (body.department && !allowedDeps.includes(body.department)) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 }
        );
      }
      updates.department = body.department || "";
    }

    if ("bio" in body) {
      if (body.bio && !bioRegex.test(body.bio)) {
        return NextResponse.json(
          { error: "Bio too long" },
          { status: 400 }
        );
      }
      updates.bio = body.bio || "";
    }

    if ("notification" in body) {
      if (!Array.isArray(body.notification)) {
        return NextResponse.json(
          { error: "Invalid notification format" },
          { status: 400 }
        );
      }
      updates.notification = body.notification;
    }

    await User.findByIdAndUpdate(userid, updates);
    await deleteCacheKeys([
      cacheKeys.userProfile(user.email),
      cacheKeys.topPerformers(),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("User PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
