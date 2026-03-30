import dbConnect from "@/lib/dbConnect";
import User from "@/model/user";
import Item from "@/model/item";
import { NextResponse } from "next/server";
import { deleteImages } from "@/lib/cloudinary";
import { userActionSchema } from "@/lib/validationSchemas";
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
    const { userid } = await params;

    const body = await req.json();

    const validationResult = userActionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action } = validationResult.data;

    const user = await User.findById(userid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "warn") {
      const recipientEmail = user.email;

      try {
        await transporter.sendMail({
          from: `"Lost & Found Support" <support@lostandfound.com>`,
          to: recipientEmail,
          subject: "Important Notice Regarding Your Recent Activity",
          html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
      
      <h2 style="color:#b91c1c;">?? Account Usage Warning</h2>

      <p>Dear User,</p>

      <p>
        We are writing to inform you that certain recent activities associated with your account
        do not align with the usage guidelines of our Lost & Found platform.
      </p>

      <p style="margin-top:12px;">
        Examples of such activities may include (but are not limited to):
      </p>

      <ul style="margin-left:20px;">
        <li>Submitting lost or found requests without valid item images</li>
        <li>Posting multiple or repetitive requests without meaningful details</li>
        <li>Providing misleading or incomplete information</li>
        <li>Any activity that disrupts the platform’s intended purpose</li>
      </ul>

      <p style="margin-top:12px;">
        Please understand that these guidelines exist to ensure the platform remains helpful,
        reliable, and fair for all users.
      </p>

      <p style="margin-top:12px;">
        We request you to review and correct your future submissions carefully.
        Continued misuse may lead to temporary restrictions or suspension of your account.
      </p>

      <p style="margin-top:16px;">
        If you believe this notice was sent in error, or if you need clarification,
        you may reply to this email or contact our support team.
      </p>

      <hr style="margin:24px 0;" />

      <p style="font-size:13px;color:#555;">
        This is an automated message. Please do not ignore this notice.
      </p>

      <p style="margin-top:8px;">
        Regards,<br />
        <strong>Lost & Found Support Team</strong>
      </p>
    </div>
  `,
        });

        await User.findByIdAndUpdate(user._id, {
          notification: [
            ...(user.notification || []),
            `?? Admin Warning: Please follow platform rules.`,
          ],
        });
      } catch (mailErr) {
        console.error("Failed to send warning email:", mailErr);
      }

      return NextResponse.json({
        success: true,
        message: "User warned successfully",
      });
    }

    if (action === "block") {
      try {
        const recipientEmail = user.email;
        if (!user.isBlocked) {
          await transporter.sendMail({
            from: `"Lost & Found Support" <support@lostandfound.com>`,
            to: recipientEmail,
            subject: "Your Account Has Been Blocked",
            html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
      
      <h2 style="color:#b91c1c;">?? Account Access Restricted</h2>

      <p>Dear User,</p>

      <p>
        After careful review, we regret to inform you that your account has been
        <strong>blocked</strong> due to repeated violations of our platform usage guidelines.
      </p>

      <p style="margin-top:12px;">
        Reasons for this action may include:
      </p>

      <ul style="margin-left:20px;">
        <li>Repeated submission of requests without valid or relevant item images</li>
        <li>Posting misleading, spam, or non-genuine lost/found entries</li>
        <li>Ignoring prior warnings or corrective notices</li>
        <li>Any activity that compromises the reliability of the platform</li>
      </ul>

      <p style="margin-top:12px;">
        As a result of this action, your account access has been disabled, and you
        will no longer be able to create or manage lost or found requests.
      </p>

      <p style="margin-top:12px;">
        This decision has been made in the interest of maintaining a trustworthy
        and effective environment for all users.
      </p>

      <p style="margin-top:14px;">
        If you believe this action was taken in error, you may contact our support team
        with relevant details for further review. Please note that account reinstatement
        is not guaranteed.
      </p>

      <hr style="margin:24px 0;" />

      <p style="font-size:13px;color:#555;">
        This action is final unless reviewed by the platform administration.
      </p>

      <p style="margin-top:8px;">
        Regards,<br />
        <strong>Lost & Found Support Team</strong>
      </p>
    </div>
  `,
          });
        } else {
          await transporter.sendMail({
            from: `"Lost & Found Support" <support@lostandfound.com>`,
            to: recipientEmail,
            subject: "Your Account Has Been Unblocked",
            html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
      
      <h2 style="color:#166534;">? Account Access Restored</h2>

      <p>Dear User,</p>

      <p>
        We are pleased to inform you that your account on the
        <strong>Lost & Found</strong> platform has been
        <strong>unblocked</strong> following administrative review.
      </p>

      <p style="margin-top:12px;">
        You may now access your account and continue using the platform
        as intended.
      </p>

      <p style="margin-top:12px;">
        Please ensure that all future submissions comply with our platform
        guidelines, including providing accurate details and relevant images
        for lost or found requests.
      </p>

      <p style="margin-top:12px;">
        Continued adherence to these guidelines helps maintain a reliable
        and helpful environment for all users.
      </p>

      <hr style="margin:24px 0;" />

      <p style="font-size:13px;color:#555;">
        Please note that repeated violations may result in further restrictions.
      </p>

      <p style="margin-top:8px;">
        Regards,<br />
        <strong>Lost & Found Support Team</strong>
      </p>
    </div>
  `,
          });
        }

        await User.findByIdAndUpdate(user._id, { isBlocked: !user.isBlocked });
      } catch (mailErr) {
        console.error("Failed to send blocking email:", mailErr);
      }

      return NextResponse.json({
        success: true,
        message: "User blocked successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("ADMIN PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { userid } = await params;

    try {
      const userItems = await Item.find({ postedBy: userid });
      const imagePublicIds = userItems
        .filter((item) => item.itemImage?.filename)
        .map((item) => item.itemImage.filename);

      if (imagePublicIds.length > 0) {
        await deleteImages(imagePublicIds);
      }

      await Item.deleteMany({ postedBy: userid });

      const user = await User.findByIdAndDelete(userid);
      console.log("user : ", user);
      const recipientEmail = user?.email;

      if (recipientEmail) {
        await transporter.sendMail({
          from: `"Lost & Found Support" <support@lostandfound.com>`,
          to: recipientEmail,
          subject: "Account Permanently Deleted Due to Policy Violations",
          html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
      
      <h2 style="color:#991b1b;">? Account Permanently Deleted</h2>

      <p>Dear User,</p>

      <p>
        This email is to formally notify you that your account on the
        <strong>Lost & Found</strong> platform has been
        <strong>permanently deleted</strong>.
      </p>

      <p style="margin-top:12px;">
        This action was taken after multiple reviews and prior warnings regarding
        repeated violations of our platform usage guidelines, including but not
        limited to:
      </p>

      <ul style="margin-left:20px;">
        <li>Continuous submission of non-genuine or incomplete lost/found requests</li>
        <li>Repeated misuse despite prior warnings and account restrictions</li>
        <li>Activities that undermined the reliability and purpose of the platform</li>
      </ul>

      <p style="margin-top:12px;">
        As a result, all associated access has been revoked, and your account data
        has been removed in accordance with our internal policies.
      </p>

      <p style="margin-top:12px;">
        Please note that this action is <strong>final</strong>.
        Re-registration or creation of new accounts to bypass this action is not permitted.
      </p>

      <p style="margin-top:14px;">
        If you believe this decision was made in error, you may contact our support
        team for clarification. However, reinstatement is not guaranteed.
      </p>

      <hr style="margin:24px 0;" />

      <p style="font-size:13px;color:#555;">
        This email serves as official communication regarding account termination.
      </p>

      <p style="margin-top:8px;">
        Regards,<br />
        <strong>Lost & Found Support Team</strong>
      </p>
    </div>
  `,
        });
      }
    } catch (mailErr) {
      console.error("Failed to send deleting email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "User and related data deleted",
    });
  } catch (error) {
    console.error("ADMIN DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
