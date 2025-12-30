import mongoose from "mongoose";
const Schema = mongoose.Schema;
import "../model/user";
const itemSchema = new Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    lostAt: {
      type: String,
      trim: true,
    },

    foundAt: {
      type: String,
      trim: true,
    },

    isLost: {
      type: Boolean,
      default: false,
    },

    isFound: {
      type: Boolean,
      default: false,
    },

    itemImage: {
      url: String,
      filename: String,
    },

    category: {
      type: String,
      enum: [
        "Electronics",
        "Books",
        "Documents",
        "Accessories",
        "Clothing",
        "Other",
      ],
      default: "Other",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    foundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reportedAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: {
      type: Date,
    },

    isResolved: {
      type: Boolean,
      default: false,
    },
    creditGiven: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

itemSchema.index({ reportedAt: 1 }, { expireAfterSeconds: 864000 });
itemSchema.index({ postedBy: 1 });
itemSchema.index({ isResolved: 1 });
itemSchema.index({ isVerified: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ isLost: 1, isFound: 1 });

itemSchema.post("findByIdAndDelete", async function (doc) {
  if (doc) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(
      doc.postedBy,
      { $pull: { items: doc._id } },
      { new: true }
    );
  }
});

export default mongoose.models.Item || mongoose.model("Item", itemSchema);
