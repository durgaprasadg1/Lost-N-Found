import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import User from "@/model/user";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  shouldResetDailyLimit,
  resetDailyLimit,
  canMarkItemAsFound,
} from "@/lib/limitHelpers";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const { itemid } = await params;

    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    const founder = await User.findOne({ email: decoded.email });
    if (!founder) {
      return NextResponse.json(
        { error: "Founder user not found" },
        { status: 404 }
      );
    }

    // Check and reset daily limit if needed
    if (shouldResetDailyLimit(founder)) {
      await resetDailyLimit(founder);
    }

    // Check if user can mark an item as found
    const canMark = canMarkItemAsFound(founder);
    if (!canMark.allowed) {
      return NextResponse.json({ error: canMark.message }, { status: 429 });
    }

    const item = await Item.findById(itemid);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const owner = await User.findById(item.postedBy);
    if (!owner) {
      return NextResponse.json(
        { error: "Owner user not found" },
        { status: 404 }
      );
    }

    const notificationMessage = `Your item "${
      item.itemName
    }" has been found by ${founder.name}. Email: ${founder.email} | Phone: ${
      founder.phone
    } | Time: ${new Date().toLocaleString()}`;
    owner.notification.push(notificationMessage);
    await owner.save();

    item.isFound = true;
    item.foundBy = founder._id;
    item.foundAt = new Date().toLocaleString();

    if (!item.creditGiven) {
      await User.findByIdAndUpdate(founder._id, {
        $inc: { itemsReturned: 1, dailyMarkFoundCount: 1 },
      });
      item.creditGiven = true;
    }

    if (owner.email) {
      const mailOptions = {
        from: `"VIT Lost & Found" `,
        to: owner.email,
        subject: "Update on Your Lost Item",
        text: `Dear ${owner.name},

We are pleased to inform you that your lost item "${item.itemName}" has been successfully located.

Finder Details:
Name: ${founder.name}
Email: ${founder.email}
Phone: ${founder.phone}

Please reach out to the finder at your convenience to retrieve your item.

Thank you for using the VIT Lost & Found platform.

Warm regards,
VIT Lost & Found Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (e) {
        console.error("Email send failed:", e.message);
      }
    }

    await item.save();

    return NextResponse.json({ success: true, owner, item }, { status: 200 });
  } catch (err) {
    console.error("/api/items/[itemid]/found error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
