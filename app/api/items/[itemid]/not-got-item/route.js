import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import User from "@/model/user";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

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
    } catch (err) {
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
        const msgToFinder = `Your report for "${
          item.itemName
        }" was confirmed as NOT received by ${ownerUser.name}. Email: ${
          ownerUser.email
        }. Time: ${new Date().toLocaleString()}`;

        finder.notification.push(msgToFinder);
        await finder.save();

        // If we previously credited the finder for this item, revoke that credit
        try {
          if (item.creditGiven) {
            await User.findByIdAndUpdate(finder._id, {
              $inc: { itemsReturned: -1 },
            });
            item.creditGiven = false;
          }
        } catch (err) {
          console.error("Error revoking finder credit on not-got-item:", err);
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
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
