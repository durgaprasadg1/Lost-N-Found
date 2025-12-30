import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import User from "@/model/user";
import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

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
    const owner = await User.findById(item.postedBy);
    if (!owner) {
      return NextResponse.json(
        { error: "Owner user not found" },
        { status: 404 }
      );
    }

    let finder = null;
    if (item.foundBy) {
      finder = await User.findById(item.foundBy);
    }

    if (finder) {
      const msgToFinder = `Your report for "${
        item.itemName
      }" was confirmed received by ${ownerUser.name}. Email: ${
        ownerUser.email
      } | Time: ${new Date().toLocaleString()}`;
      finder.notification.push(msgToFinder);
      await finder.save();

      await User.findByIdAndUpdate(finder._id, { $inc: { itemsReturned: 1 } });
    }

    await User.findByIdAndUpdate(owner._id, { $inc: { totalLostRequests: 1 } });

    item.isResolved = true;
    item.resolvedAt = new Date();
    await item.save();

    return NextResponse.json({ success: true, owner, item }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
