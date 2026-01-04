import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import User from "@/model/user";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

    const authHeader = req.headers.get("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const ownerUser = await User.findOne({ email: decoded.email });
    if (!ownerUser) {
      return NextResponse.json(
        { error: "Owner user not found" },
        { status: 404 }
      );
    }

    const item = await Item.findById(itemid);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.postedBy.toString() !== ownerUser._id.toString()) {
      return NextResponse.json(
        { error: "Not authorized to update this item" },
        { status: 403 }
      );
    }

    const owner = await User.findById(item.postedBy);
    if (!owner) {
      return NextResponse.json(
        { error: "Owner user not found" },
        { status: 404 }
      );
    }

    if (item.foundBy) {
      const finder = await User.findById(item.foundBy);

      if (finder) {
        const notificationMessage = `The owner has confirmed that the item "${
          item.itemName
        }" was not received. Reported by ${ownerUser.name}. Email: ${
          ownerUser.email
        } | Time: ${new Date().toLocaleString()}`;

        finder.notification.push(notificationMessage);
        await finder.save();

        if (item.creditGiven) {
          try {
            await User.findByIdAndUpdate(finder._id, {
              $inc: { itemsReturned: -1 },
            });
            item.creditGiven = false;
          } catch (err) {
            console.error("Error revoking finder credit:", err);
          }
        }

        if (finder.email) {
          const mailOptions = {
            from: `"VIT Lost & Found" <${process.env.MAIL_USER}>`,
            to: finder.email,
            subject: "Update Regarding Reported Found Item",
            text: `Dear ${finder.name},

This is to inform you that the owner of the item "${item.itemName}" has confirmed that the item was not received.

Owner Details:
Name: ${ownerUser.name}
Email: ${ownerUser.email}
Phone: ${ownerUser.phone}

If there has been any misunderstanding or if further clarification is required, you may contact the owner directly.

Thank you for your cooperation and for contributing to the VIT Lost & Found initiative.

Warm regards,
VIT Lost & Found Team`,
          };

          try {
            await transporter.sendMail(mailOptions);
          } catch (e) {
            console.error("Email send failed:", e.message);
          }
        }
      }
    }

    if (owner.totalLostRequests > 0) {
      await User.findByIdAndUpdate(owner._id, {
        $inc: { totalLostRequests: -1 },
      });
    }

    item.isFound = false;
    item.foundBy = null;
    await item.save();

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (err) {
    console.error("/api/items/[itemid]/not-got-item error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
