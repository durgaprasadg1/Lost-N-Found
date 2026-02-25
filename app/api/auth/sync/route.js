import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import Admin from "@/model/admin";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
  } catch (error) {
    console.log("Database connection failed:", error.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }

  try {
    const { idToken, create } = await req.json();

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email;
    const name = decoded.name || email.split("@")[0];

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
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
