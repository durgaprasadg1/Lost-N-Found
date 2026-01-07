import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    password: {
      type: String,
      minlength: 8,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must have atleast one lowercase, uppercase, digit, special character",
      ],
    },

    phone: {
      type: String,
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    department: {
      type: String,
      enum: [
        "Computer Engineering",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Non-teaching Staff",
        "Teaching Staff",
        "Libary-staff",
        "Other",
      ],
      default: "Other",
    },
    profilePicture: {
      url: String,
      filename: String,
    },

    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
    ],

    itemsReturned: {
      type: Number,
      default: 0,
    },
    totalLostRequests: {
      type: Number,
      default: 0,
    },

    monthlyLostRequestsCount: {
      type: Number,
      default: 0,
    },
    monthlyFoundAnnouncementsCount: {
      type: Number,
      default: 0,
    },
    lastMonthlyReset: {
      type: Date,
      default: () => new Date(),
    },

    // Daily mark-as-found limit
    dailyMarkFoundCount: {
      type: Number,
      default: 0,
    },
    lastDailyReset: {
      type: Date,
      default: () => new Date(),
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    badgeColor: {
      type: String,
      default: "#3b82f6",
    },

    profileColor: {
      type: String,
      default: "#f3f4f6",
    },
    notification: [
      {
        type: String,
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isUser: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isBlocked: 1 });

userSchema.post("findByIdAndDelete", async function (doc) {
  if (doc) {
    const Item = mongoose.model("Item");
    await Item.deleteMany({ postedBy: doc._id });
  }
});

userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const Item = mongoose.model("Item");
    await Item.deleteMany({ postedBy: this._id });
  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
