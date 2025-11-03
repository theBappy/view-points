import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: [true, "Problem is required"],
      trim: true,
      minlength: [5, "Problem description must be at least 5 characters long"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: [true, "Difficulty is required"],
      lowercase: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true, // ✅ improves query performance for active sessions
    },
    callId: {
      type: String,
      required: true,
      unique: true, // ✅ prevents duplicate Stream call IDs
      index: true,
    },
    // Optional metadata
    duration: {
      type: Number, // in seconds (if you plan to track it later)
      default: 0,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/* -------------------- Indexes -------------------- */
// Query optimization for frequent lookups
sessionSchema.index({ host: 1, status: 1 });
sessionSchema.index({ participant: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });

/* -------------------- Pre/Post Hooks (Optional) -------------------- */
// Example: Auto-update endedAt when session is marked as completed
sessionSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.endedAt) {
    this.endedAt = new Date();
  }
  next();
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
