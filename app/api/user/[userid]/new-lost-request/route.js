import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import User from "@/model/user";
import cloudinary from "@/lib/cloudinary";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { lostItemSchema } from "@/lib/validationSchemas";
import {
  shouldResetMonthlyLimits,
  resetMonthlyLimits,
  canPostLostRequest,
} from "@/lib/limitHelpers";

export async function POST(req, { params }) {
  try {
    await dbConnect();

    const { userid } = await params;
    const body = await req.json();

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

    const mongoUser = await User.findById(userid);
    if (!mongoUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (mongoUser.email !== decoded.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check and reset monthly limits if needed
    if (shouldResetMonthlyLimits(mongoUser)) {
      await resetMonthlyLimits(mongoUser);
    }

    // Check if user can post a lost request
    const canPost = canPostLostRequest(mongoUser);
    if (!canPost.allowed) {
      return NextResponse.json({ error: canPost.message }, { status: 429 });
    }

    const validationResult = lostItemSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    let imageData = null;

    if (body.itemImage) {
      if (
        !body.itemImage.startsWith("data:image/png") &&
        !body.itemImage.startsWith("data:image/jpeg")
      ) {
        return NextResponse.json(
          { error: "Only PNG and JPG images are allowed" },
          { status: 400 }
        );
      }

      const base64Length =
        body.itemImage.length - (body.itemImage.indexOf(",") + 1);
      const sizeInBytes = (base64Length * 3) / 4;

      if (sizeInBytes > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image size must be less than 2MB" },
          { status: 400 }
        );
      }

      const upload = await cloudinary.uploader.upload(body.itemImage, {
        folder: "lost-and-found/lost",
      });

      imageData = {
        url: upload.secure_url,
        filename: upload.public_id,
      };
    }

    const newItem = await Item.create({
      itemName: body.itemName,
      description: body.description,
      lostAt: body.lostAt,
      category: body.category,
      isLost: true,
      postedBy: mongoUser._id,
      itemImage: imageData,
      reportedAt: new Date(),
    });

    await User.findByIdAndUpdate(userid, {
      $inc: { totalLostRequests: 1, monthlyLostRequestsCount: 1 },
      phone: body.phone,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.log("New Lost Error : ", error);
    return NextResponse.json(
      { success: false, error: "Slow Internet connectivity." },
      { status: 500 }
    );
  }
}
