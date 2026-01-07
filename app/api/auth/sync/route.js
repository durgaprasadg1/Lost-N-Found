import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import Admin from "@/model/admin";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();
  const { idToken, create } = await req.json();

  const decoded = await adminAuth.verifyIdToken(idToken);
  const email = decoded.email;
  const name = decoded.name || email.split("@")[0];

  // Check if email exists as admin
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
      user = await User.create({
        name,
        email,
        phone: "",
        role: "student",
        department: "Other",
        items: [],
        itemsReturned: 0,
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

  return NextResponse.json({ user });
}
