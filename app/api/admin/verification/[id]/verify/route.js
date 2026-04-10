import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import { NextResponse } from "next/server";
import User from "@/model/user";
import { getGlobalFeedCacheKeys, getUserScopedCacheKeys } from "@/lib/cacheKeys";
import { deleteCacheKeys } from "@/lib/redis";
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

    const { id } = await params;

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!updatedItem) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const userid = updatedItem.postedBy;
    const user = await User.findById(userid);
    const recipientEmail = user.email;
    await transporter.sendMail({
      from: `"Lost & Found Support" <support@lostandfound.com>`,
      to: recipientEmail,
      subject: "Your Lost / Found Request Has Been Verified",
      html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
      
      <h2 style="color:#065f46;">Request Verified Successfully</h2>

      <p>Dear User,</p>

      <p>
        We are pleased to inform you that your
        <strong>lost / found request</strong> has been
        <strong>successfully verified</strong> by our moderation team.
      </p>

      <p style="margin-top:12px;">
        Your request is now visible on the platform and can be viewed by other
        users, increasing the chances of a successful match or recovery.
      </p>

      <p style="margin-top:12px;">
        Please ensure that any further updates or communication related to this
        request remain accurate and respectful.
      </p>

      <p style="margin-top:12px;">
        We appreciate your cooperation in helping keep the Lost & Found platform
        reliable and useful for everyone.
      </p>

      <hr style="margin:24px 0;" />

      <p style="font-size:13px;color:#555;">
        You will be notified if there are any updates or responses related to your request.
      </p>

      <p style="margin-top:8px;">
        Regards,<br />
        <strong>Lost & Found Support Team</strong>
      </p>
    </div>
  `,
    });

    await deleteCacheKeys([
      ...getGlobalFeedCacheKeys(),
      ...getUserScopedCacheKeys({ userId: userid, email: user?.email }),
    ]);

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("VERIFY ITEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
