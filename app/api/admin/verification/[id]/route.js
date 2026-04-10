import dbConnect from "@/lib/dbConnect";
import Item from "@/model/item";
import { NextResponse } from "next/server";
import { deleteImage } from "@/lib/cloudinary";
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

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const item = await Item.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }
    const userid = item.postedBy;
    const user = await User.findById(userid);
    const recipientEmail = user.email;
    await transporter.sendMail({
      from: `"Lost & Found Support" <support@lostandfound.com>`,
      to: recipientEmail,
      subject: "Your Lost / Found Request Could Not Be Approved",
      html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
      
      <h2 style="color:#991b1b;">❌ Request Not Approved</h2>

      <p>Dear User,</p>

      <p>
        Thank you for submitting your lost / found request on the
        <strong>Lost & Found</strong> platform.
      </p>

      <p style="margin-top:12px;">
        After review, we regret to inform you that your request could not be
        approved at this time as it does not meet our platform guidelines.
      </p>

      <p style="margin-top:12px;">
        Common reasons for request denial include (but are not limited to):
      </p>

      <ul style="margin-left:20px;">
        <li>Missing or unclear item images</li>
        <li>Insufficient or misleading item details</li>
        <li>Duplicate or repetitive requests</li>
        <li>Requests not relevant to the platform’s purpose</li>
      </ul>

      <p style="margin-top:12px;">
        You may revise the request with accurate information and resubmit it
        for review. Ensuring clear details and proper images greatly improves
        the chances of approval.
      </p>

      <p style="margin-top:12px;">
        If you believe this decision was made in error, you may contact our
        support team for clarification.
      </p>

      <hr style="margin:24px 0;" />

      <p style="font-size:13px;color:#555;">
        This notification applies only to the specific request mentioned above
        and does not affect your account status.
      </p>

      <p style="margin-top:8px;">
        Regards,<br />
        <strong>Lost & Found Support Team</strong>
      </p>
    </div>
  `,
    });

    if (item.itemImage?.filename) {
      await deleteImage(item.itemImage.filename);
    }

    await Item.findByIdAndDelete(id);

    await deleteCacheKeys([
      ...getGlobalFeedCacheKeys(),
      ...getUserScopedCacheKeys({ userId: userid, email: user?.email }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
