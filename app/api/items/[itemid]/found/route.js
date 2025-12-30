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

    const founder = await User.findOne({ email: decoded.email });
    if (!founder) {
      return NextResponse.json(
        { error: "Founder user not found" },
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

    const msg = `Your item "${item.itemName}" has been found by ${
      founder.name
    }. Email: ${founder.email} | Phone: ${
      founder.phone
    } | Time: ${new Date().toLocaleString()}`;

    owner.notification.push(msg);
    await owner.save();

    item.isFound = true;
    item.foundBy = founder._id;
    item.foundAt = new Date().toLocaleString();

    // credit the finder when they mark an item as found (only once)
    try {
      if (!item.creditGiven) {
        await User.findByIdAndUpdate(founder._id, {
          $inc: { itemsReturned: 1 },
        });
        item.creditGiven = true;
      }
    } catch (err) {
      console.error("Error crediting finder on found route:", err);
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
